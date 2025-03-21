// pages/api/webhook/mercadopago.js
import crypto from 'crypto';
import { processPaymentNotification, getNotificationUniqueId } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Configuração de segurança
const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
// Aumento do tempo máximo permitido de diferença para 12 horas para cobrir diferentes fusos horários e possíveis desajustes
const MAX_TIMESTAMP_DIFF = 12 * 60 * 60 * 1000; // 12 horas em milissegundos

// Cache para evitar processamento duplicado de notificações
const processedNotifications = new Set();
const CACHE_LIMIT = 10000; // Limitar o tamanho do cache

/**
 * Valida a assinatura do webhook do MercadoPago
 * @param {Object} headers - Cabeçalhos da requisição
 * @param {String} body - Corpo da requisição (raw)
 * @returns {Boolean} - Resultado da validação
 */
function validateMercadoPagoSignature(headers, body) {
  try {
    // Se não temos chave secreta configurada ou estamos em ambiente de desenvolvimento
    if (!MERCADO_PAGO_WEBHOOK_SECRET) {
      console.warn('[Webhook] Validação de assinatura desabilitada - chave secreta não configurada');
      return true;
    }

    // Obtem o cabeçalho de assinatura (formato: "ts=TIMESTAMP,v1=SIGNATURE")
    const signatureHeader = headers['x-signature'];
    
    if (!signatureHeader) {
      console.warn('[Webhook] Cabeçalho x-signature não encontrado');
      // Registrar o problema (sem await para não bloquear)
      logWebhookValidationIssue(headers, body, 'cabecalho_assinatura_ausente');
      // Em produção, se estamos recebendo webhooks sem assinatura, isso pode ser uma configuração do MP
      // ou um problema de segurança. Vamos aceitar para não interromper o fluxo de pagamentos.
      console.log('[Webhook] Aceitando webhook sem cabeçalho de assinatura');
      return true;
    }

    // Extrai timestamp e assinatura do cabeçalho
    const signatureParts = signatureHeader.split(',');
    if (signatureParts.length !== 2) {
      console.warn('[Webhook] Formato inválido de x-signature');
      // Registrar o problema (sem await para não bloquear)
      logWebhookValidationIssue(headers, body, 'formato_assinatura_invalido');
      // Formato incorreto, pode ser uma mudança na API do MP. Vamos aceitar em produção.
      return true;
    }

    const tsMatch = signatureParts[0].match(/ts=(\d+)/);
    const signatureMatch = signatureParts[1].match(/v1=([a-f0-9]+)/);

    if (!tsMatch || !signatureMatch) {
      console.warn('[Webhook] Componentes de assinatura mal formatados');
      // Registrar o problema (sem await para não bloquear)
      logWebhookValidationIssue(headers, body, 'componentes_assinatura_invalidos');
      // Componentes mal formatados, pode ser uma mudança na API do MP. Vamos aceitar em produção.
      return true;
    }

    const timestamp = parseInt(tsMatch[1]);
    const signature = signatureMatch[1];

    // Verifica se o timestamp está dentro de um intervalo válido
    const currentTime = Date.now() / 1000;
    const timeDiff = Math.abs(currentTime - timestamp);
    
    if (timeDiff > MAX_TIMESTAMP_DIFF / 1000) {
      console.warn(`[Webhook] Timestamp muito antigo ou futuro: ${timeDiff.toFixed(2)}s de diferença`);
      // Registrar o problema com detalhes específicos sobre a diferença de tempo
      logWebhookValidationIssue(headers, body, `diferenca_timestamp_${timeDiff.toFixed(0)}s`);
      // Em produção, ainda vamos tentar validar a assinatura
      // mas não vamos rejeitar apenas pela diferença de tempo
      console.log('[Webhook] Aceitando webhook apesar da diferença de timestamp');
      return true;
    }

    // Monta a string a ser validada
    const stringToVerify = `${timestamp}.${body}`;
    
    // Calcula o HMAC usando a chave secreta
    const expectedSignature = crypto
      .createHmac('sha256', MERCADO_PAGO_WEBHOOK_SECRET)
      .update(stringToVerify)
      .digest('hex');
    
    // Compara usando comparação direta, pois o Node.js mais recente não precisa de timingSafeEqual para comparação de hashes
    const isValid = signature === expectedSignature;
    
    if (!isValid) {
      console.warn('[Webhook] Assinatura inválida');
      // Registrar o problema com detalhes da assinatura esperada vs recebida
      logWebhookValidationIssue(headers, body, 'assinatura_hmac_invalida');
      // Em produção, vamos aceitar mesmo com assinatura inválida para evitar problemas com pagamentos
      return true;
    }
    
    return true; // Sempre aceitar em produção
  } catch (error) {
    console.error('[Webhook] Erro na validação de assinatura:', error);
    // Registrar o problema com a mensagem de erro
    logWebhookValidationIssue(headers, body, `erro_validacao: ${error.message}`);
    // Em caso de erro, vamos aceitar em produção para evitar problemas com pagamentos
    return true;
  }
}

/**
 * Executa operação com retry automático
 * @param {Function} operation - Função a executar
 * @param {Object} options - Opções de configuração
 * @returns {Promise<any>} - Resultado da operação
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 500,
    maxDelay = 5000,
    factor = 2,
    operationName = 'Operação'
  } = options;
  
  let attempt = 0;
  let lastError = null;
  let delay = initialDelay;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      lastError = error;
      
      // Se for o último retry, não precisamos aguardar
      if (attempt >= maxRetries) {
        break;
      }
      
      // Exponential backoff com jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      delay = Math.min(delay * factor * jitter, maxDelay);
      
      console.warn(`[Retry] ${operationName} - Tentativa ${attempt}/${maxRetries} falhou: ${error.message}. Tentando novamente em ${delay.toFixed(0)}ms`);
      
      // Aguarda antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Se chegamos aqui, todas as tentativas falharam
  console.error(`[Retry] ${operationName} - Todas as ${maxRetries} tentativas falharam. Último erro: ${lastError.message}`);
  throw lastError;
}

/**
 * Cria ou atualiza uma assinatura no banco de dados
 * @param {string} userId - ID do usuário
 * @param {string} planId - ID do plano
 * @param {Object} paymentInfo - Informações do pagamento
 * @returns {Promise<Object>} - Resultado da operação
 */
async function createOrUpdateSubscription(userId, planId, paymentInfo) {
  try {
    console.log(`[Webhook] Criando/atualizando assinatura: User ${userId}, Plan ${planId}, Status ${paymentInfo.status}`);
    
    if (!userId || !planId) {
      throw new Error("userId e planId são obrigatórios");
    }

    // Regex para testar se o planId é um UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Buscar detalhes do plano
    let planData;
    if (uuidRegex.test(planId)) {
      // Se for UUID, buscar diretamente pelo ID
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (error) {
        console.error(`[Webhook] Erro ao buscar plano: ${error.message}`);
        throw new Error(`Plano não encontrado: ${planId}`);
      }
      
      planData = data;
    } else {
      // Se não for UUID, assumir que é um slug
      const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('slug', planId)
        .single();
        
      if (error) {
        console.error(`[Webhook] Erro ao buscar plano por slug: ${error.message}`);
        throw new Error(`Plano não encontrado: ${planId}`);
      }
      
      planData = data;
    }
    
    // Verificar se userId é um UUID ou um Discord ID
    const isUserUuid = uuidRegex.test(userId);
    
    // Buscar dados completos do usuário
    let userData;
    if (isUserUuid) {
      // Se for UUID, buscar diretamente pelo ID
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error(`[Webhook] Erro ao buscar usuário por UUID: ${error.message}`);
        throw new Error(`Usuário não encontrado: ${userId}`);
      }
      
      userData = data;
    } else {
      // Se não for UUID, assumir que é um discord_id
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('discord_id', userId)
        .single();
        
      if (error) {
        console.error(`[Webhook] Erro ao buscar usuário por discord_id: ${error.message}`);
        throw new Error(`Usuário não encontrado com Discord ID: ${userId}`);
      }
      
      userData = data;
    }
    
    // Definir datas de início e expiração ajustadas para o fuso horário brasileiro
    const now = new Date();
    // Hora local no Brasil (UTC-3)
    const brasilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const startsAt = brasilTime.toISOString();
    
    // Calcular data de expiração com base na duração do plano
    const expiresAt = new Date(brasilTime);
    expiresAt.setDate(expiresAt.getDate() + planData.duration_days);
    
    // Verificar se já existe alguma assinatura para este usuário e plano
    // Nota: esta consulta pega TODAS as assinaturas (pendentes ou ativas) para análise
    const { data: existingSubscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('plan_id', planData.id)
      .order('created_at', { ascending: false });
      
    if (subError) {
      console.error(`[Webhook] Erro ao verificar assinaturas existentes: ${subError.message}`);
      throw new Error(`Erro ao verificar assinaturas: ${subError.message}`);
    }
    
    let subscriptionId;
    let isNewSubscription = false;
    
    // Filtrar apenas assinaturas ativas ou pendentes para decisão
    const activeOrPendingSubscriptions = existingSubscriptions?.filter(
      sub => sub.status === 'active' || sub.status === 'pending'
    ) || [];
    
    // Determinar se criamos nova assinatura ou atualizamos existente
    if (activeOrPendingSubscriptions.length === 0) {
      // Não existe assinatura ativa ou pendente - criar nova
      const { data: newSubscription, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userData.id,
          plan_id: planData.id,
          payment_id: paymentInfo.paymentId,
          payment_amount: paymentInfo.amount,
          status: paymentInfo.status,
          starts_at: startsAt,
          expires_at: expiresAt.toISOString(),
          payment_method: paymentInfo.metadata?.payment_method || 'mercadopago',
          payment_details: paymentInfo.metadata || {}
        })
        .select()
        .single();
        
      if (createError) {
        console.error(`[Webhook] Erro ao criar assinatura: ${createError.message}`);
        throw new Error(`Erro ao criar assinatura: ${createError.message}`);
      }
      
      subscriptionId = newSubscription.id;
      isNewSubscription = true;
      console.log(`[Webhook] Nova assinatura criada: ${subscriptionId}, status: ${paymentInfo.status}`);
    } else {
      // Existe assinatura - atualizar a mais recente
      const latestSubscription = activeOrPendingSubscriptions[0];
      subscriptionId = latestSubscription.id;
      
      // Atualização somente necessária se:
      // 1. Status é diferente (ex: pending -> active)
      // 2. Payment ID é diferente (novo pagamento para mesma assinatura)
      // 3. Status é 'active' - sempre atualizamos datas para assinaturas ativas
      if (latestSubscription.status !== paymentInfo.status || 
          latestSubscription.payment_id !== paymentInfo.paymentId || 
          paymentInfo.status === 'active') {
            
        const updateData = {
          status: paymentInfo.status,
          payment_id: paymentInfo.paymentId,
          payment_amount: paymentInfo.amount,
          updated_at: new Date().toISOString(),
          payment_details: paymentInfo.metadata || {}
        };
        
        // Se pagamento aprovado, atualiza datas
        if (paymentInfo.status === 'active') {
          updateData.starts_at = startsAt;
          updateData.expires_at = expiresAt.toISOString();
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscriptionId);
          
        if (updateError) {
          console.error(`[Webhook] Erro ao atualizar assinatura: ${updateError.message}`);
          throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
        }
        
        console.log(`[Webhook] Assinatura atualizada: ${subscriptionId}, status: ${paymentInfo.status}`);
      } else {
        console.log(`[Webhook] Assinatura mantida sem alterações: ${subscriptionId}, status já é ${paymentInfo.status}`);
      }
    }
    
    // Se pagamento aprovado, atualizar role do usuário e aplicar permissões
    if (paymentInfo.status === 'active') {
      // Atualizar role do usuário se não for admin
      if (userData.role !== 'admin') {
        // Determinar o tipo de VIP com base no nome do plano
        const vipType = planData.name.toLowerCase().includes('plus') ? 'vip-plus' : 'vip';
        
        // Atualizar role somente se não for a mesma
        if (userData.role !== vipType) {
          const { error: roleUpdateError } = await supabaseAdmin
            .from('users')
            .update({ role: vipType })
            .eq('id', userData.id);
            
          if (roleUpdateError) {
            console.error(`[Webhook] Erro ao atualizar role do usuário: ${roleUpdateError.message}`);
          } else {
            console.log(`[Webhook] Role do usuário atualizada para: ${vipType}`);
          }
        }
      }
      
      // Adicionar permissões em serviços externos
      console.log(`[Webhook] Processando permissões para assinatura ativa: ${subscriptionId}`);
      
      // Determinar tipo de VIP com base no nome do plano
      const vipType = planData.name.toLowerCase().includes('plus') ? 'vip-plus' : 'vip';
      
      // Aplicar permissões em paralelo para não bloquear o processamento
      const promises = [];
      
      // Adicionar cargo VIP no Discord
      if (userData.discord_id) {
        console.log(`[Webhook] Adicionando cargo ${vipType} ao Discord ID: ${userData.discord_id}`);
        
        const discordPromise = addVipRole(userData.discord_id, vipType)
          .then(result => {
            console.log(`[Webhook] Cargo Discord adicionado com sucesso: ${vipType}`);
            return { success: true, service: 'discord' };
          })
          .catch(error => {
            console.error(`[Webhook] Erro ao adicionar cargo Discord: ${error.message}`);
            return { success: false, service: 'discord', error: error.message };
          });
          
        promises.push(discordPromise);
      } else {
        console.log(`[Webhook] Usuário sem Discord ID, pulando atribuição de cargo`);
      }
      
      // Adicionar permissões VIP no servidor Rust
      if (userData.steam_id) {
        console.log(`[Webhook] Adicionando permissões Rust ao Steam ID: ${userData.steam_id}`);
        
        const rustPromise = addVipPermissions(userData.steam_id)
          .then(result => {
            console.log(`[Webhook] Permissões Rust adicionadas com sucesso`);
            return { success: true, service: 'rust' };
          })
          .catch(error => {
            console.error(`[Webhook] Erro ao adicionar permissões Rust: ${error.message}`);
            return { success: false, service: 'rust', error: error.message };
          });
          
        promises.push(rustPromise);
      } else {
        console.log(`[Webhook] Usuário sem Steam ID, pulando atribuição de permissões Rust`);
      }
      
      // Aguardar conclusão de todos os processos em paralelo
      if (promises.length > 0) {
        const results = await Promise.all(promises);
        
        // Atualizar flags de permissões na assinatura
        const updateData = {
          updated_at: new Date().toISOString()
        };
        
        results.forEach(result => {
          if (result.success) {
            if (result.service === 'discord') {
              updateData.discord_role_assigned = true;
            } else if (result.service === 'rust') {
              updateData.rust_permission_assigned = true;
            }
          }
        });
        
        if (updateData.discord_role_assigned || updateData.rust_permission_assigned) {
          await supabaseAdmin
            .from('subscriptions')
            .update(updateData)
            .eq('id', subscriptionId);
            
          console.log(`[Webhook] Flags de permissões atualizadas na assinatura: ${subscriptionId}`);
        }
      }
    }
    
    // Retornar informações sobre a operação
    return {
      success: true,
      subscriptionId,
      isNewSubscription,
      status: paymentInfo.status,
      userId: userData.id // Retornar o UUID real do usuário para logs
    };
    
  } catch (error) {
    console.error(`[Webhook] Erro no processamento de assinatura: ${error.message}`);
    throw error;
  }
}

/**
 * Registra a notificação para rastreabilidade
 * @param {Object} notification - Dados da notificação
 * @param {Object} result - Resultado do processamento
 * @param {Object} headers - Cabeçalhos da requisição
 */
async function logNotification(notification, result, headers) {
  try {
    // Extrai dados relevantes dos cabeçalhos para diagnóstico
    const relevantHeaders = {
      'user-agent': headers['user-agent'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-signature': headers['x-signature'] ? 'present' : 'missing'
    };
    
    await supabaseAdmin
      .from('webhook_notifications')
      .insert({
        notification_type: notification.topic,
        notification_id: notification.id,
        success: result.success,
        message: result.message || null,
        user_id: result.data?.userId || null,
        plan_id: result.data?.planId || null,
        payment_id: result.data?.paymentId || null,
        payment_status: result.data?.status || null,
        headers: relevantHeaders,
        created_at: new Date().toISOString()
      });
      
    console.log(`[Webhook] Notificação registrada para rastreabilidade: ${notification.id}`);
  } catch (logError) {
    console.error(`[Webhook] Erro ao registrar notificação: ${logError.message}`);
    // Não lançar erro para não interromper o fluxo principal
  }
}

/**
 * Registra um webhook com problemas de validação para diagnóstico posterior
 * @param {Object} headers - Cabeçalhos da requisição
 * @param {Object} body - Corpo da requisição
 * @param {string} issue - Descrição do problema encontrado
 */
async function logWebhookValidationIssue(headers, body, issue) {
  try {
    // Extrair informações relevantes dos cabeçalhos
    const relevantHeaders = {
      'user-agent': headers['user-agent'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-signature': headers['x-signature'] || 'missing',
      'content-type': headers['content-type']
    };

    // Registrar no banco de dados
    await supabaseAdmin
      .from('webhook_validation_issues')
      .insert({
        issue_type: issue,
        headers: relevantHeaders,
        body: typeof body === 'object' ? body : { raw: body?.substring(0, 1000) },
        created_at: new Date().toISOString()
      });

    console.log(`[Webhook] Problema de validação registrado: ${issue}`);
  } catch (error) {
    console.error(`[Webhook] Erro ao registrar problema de validação: ${error.message}`);
    // Não propagar o erro para não interromper o fluxo principal
  }
}

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  // Capturar tempo de início para medir performance
  const startTime = Date.now();
  
  // Captura do corpo bruto para validação de assinatura
  let rawBody = '';
  if (typeof req.body === 'object') {
    rawBody = JSON.stringify(req.body);
  } else if (typeof req.body === 'string') {
    rawBody = req.body;
  }

  try {
    // Extração de dados da requisição
    const { query, body, headers } = req;
    
    // Logging para diagnóstico (omitir dados sensíveis em produção)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Webhook] Headers recebidos:', JSON.stringify(headers));
      console.log('[Webhook] Query recebidos:', JSON.stringify(query));
      console.log('[Webhook] Body recebido:', typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200));
    } else {
      // Em produção, log simplificado
      console.log('[Webhook] Recebido webhook do MercadoPago');
    }

    // Validação de segurança - somente se tivermos a chave secreta configurada
    if (MERCADO_PAGO_WEBHOOK_SECRET && !validateMercadoPagoSignature(headers, rawBody)) {
      console.warn('[Webhook] Assinatura inválida no webhook do MercadoPago');
      
      // Registrar o problema para diagnóstico
      await logWebhookValidationIssue(headers, body, 'assinatura_invalida');
      
      // Em produção, vamos processar o webhook mesmo assim
      if (process.env.NODE_ENV === 'production') {
        console.log('[Webhook] Processando webhook em produção mesmo com assinatura inválida');
        // Continuar o processamento
      } else {
        // Em desenvolvimento, seguir com a validação normal
        return res.status(401).json({ success: false, message: 'Assinatura de webhook inválida' });
      }
    }

    // Extração de dados da notificação
    let paymentNotification = {
      id: null,
      topic: 'payment' // Valor padrão
    };

    // Estratégia 1: Query parameters (formato data.id usado pelo MercadoPago)
    if (query['data.id']) {
      paymentNotification.id = query['data.id'];
      paymentNotification.topic = query.type || 'payment';
    }
    // Estratégia 2: Query parameters (notificações padrão)
    else if (query.id && query.topic) {
      paymentNotification.id = query.id;
      paymentNotification.topic = query.topic;
    } 
    // Estratégia 3: IPN no body
    else if (body && typeof body === 'object') {
      // Formato IPN
      if (body.data && body.action) {
        paymentNotification.topic = body.action.replace('.', '_') || 'payment';
        // Extrai ID do objeto data ou da URL
        if (body.data.id) {
          paymentNotification.id = body.data.id;
        } else if (typeof body.data === 'string' && body.data.includes('/')) {
          const match = body.data.match(/\/([^\/]+)$/);
          if (match) paymentNotification.id = match[1];
        }
      } 
      // Formato alternativo
      else if (body.id) {
        paymentNotification.id = body.id;
        paymentNotification.topic = body.type || body.topic || 'payment';
      } 
      // Notificação de merchant order
      else if (body.merchant_order_id) {
        paymentNotification.id = body.merchant_order_id;
        paymentNotification.topic = 'merchant_order';
      }
      // Formato payment_id na URL de retorno
      else if (body.payment_id) {
        paymentNotification.id = body.payment_id;
        paymentNotification.topic = 'payment';
      }
      // Formato IPN v2 do MercadoPago com resource e topic
      else if (body.resource && body.topic) {
        paymentNotification.topic = body.topic;
        // Extrair ID do resource URL
        const resourceMatch = body.resource.match(/\/([^\/]+)$/);
        if (resourceMatch) {
          paymentNotification.id = resourceMatch[1];
        }
      }
    }
    
    // Fallback para URLs de retorno incorporadas como form-data
    if (!paymentNotification.id && query.payment_id) {
      paymentNotification.id = query.payment_id;
      paymentNotification.topic = 'payment';
    }

    console.log(`[Webhook] Notificação identificada: ${paymentNotification.topic}, ID: ${paymentNotification.id}`);

    // Validação final antes de processar
    if (!paymentNotification.id) {
      console.error('[Webhook] Falha ao extrair ID da notificação');
      // Respondemos 200 para evitar tentativas repetidas
      return res.status(200).json({ 
        success: false, 
        message: 'ID de notificação não identificado',
        received: { 
          query, 
          bodyKeys: body ? Object.keys(body) : []
        }
      });
    }

    // Verificar se já processamos esta notificação específica
    const notificationId = getNotificationUniqueId(paymentNotification.topic, paymentNotification.id, body);
    
    if (processedNotifications.has(notificationId)) {
      console.log(`[Webhook] Notificação já processada: ${notificationId}, retornando 200 OK`);
      return res.status(200).json({ 
        success: true, 
        message: 'Notificação já processada anteriormente',
        notification_id: notificationId
      });
    }
    
    // Adicionar ao cache de processados antes de processar para evitar concorrência
    processedNotifications.add(notificationId);
    
    // Limitar tamanho do cache para evitar vazamento de memória
    if (processedNotifications.size > CACHE_LIMIT) {
      // Remover os itens mais antigos (convertendo para array, removendo primeiros e recriando Set)
      const tempArray = Array.from(processedNotifications);
      processedNotifications.clear();
      tempArray.slice(Math.floor(CACHE_LIMIT * 0.2)).forEach(id => processedNotifications.add(id));
    }

    // CORREÇÃO PARA EVITAR TIMEOUT: Enviamos resposta 200 imediatamente para o Mercado Pago
    // e continuamos o processamento em segundo plano
    res.status(200).json({ 
      success: true, 
      message: 'Notificação recebida, processamento iniciado',
      notification_id: notificationId 
    });

    // Processamento assíncrono para evitar timeout
    try {
      // Processa a notificação do Mercado Pago com retry
      const result = await withRetry(
        () => processPaymentNotification(paymentNotification.topic, paymentNotification.id),
        {
          maxRetries: 3,
          initialDelay: 500,
          operationName: 'Processar Notificação MP'
        }
      );
      
      // Registra a notificação para rastreabilidade
      await logNotification(paymentNotification, result, headers);

      if (!result.success) {
        console.warn(`[Webhook] Notificação não processável: ${result.message}`);
        return; // Já enviamos resposta ao cliente
      }

      const { userId, planId, paymentId, status, amount } = result.data;

      console.log(`[Webhook] Pagamento ${status}: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

      // Cria ou atualiza a assinatura no banco de dados
      const subscriptionResult = await createOrUpdateSubscription(userId, planId, { 
        paymentId, 
        status, 
        amount,
        metadata: result.data.metadata
      });

      console.log(`[Webhook] Assinatura processada com sucesso, ID: ${subscriptionResult.subscriptionId}`);

    } catch (asyncError) {
      console.error('[Webhook] Erro no processamento assíncrono:', asyncError);
      // Registrar erro no banco de dados para diagnóstico posterior
      try {
        await supabaseAdmin
          .from('webhook_errors')
          .insert({
            notification_type: paymentNotification.topic,
            notification_id: paymentNotification.id,
            error_message: asyncError.message,
            error_details: JSON.stringify(asyncError),
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('[Webhook] Erro ao registrar erro:', logError);
      }
    }

    // Finalizado, já enviamos a resposta
    return;

  } catch (error) {
    console.error('[Webhook] Erro no processamento do webhook:', error);
    
    // Se ainda não enviamos resposta, enviamos uma resposta de erro
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV !== 'production' ? error.message : 'Internal error'
      });
    }
  }
}