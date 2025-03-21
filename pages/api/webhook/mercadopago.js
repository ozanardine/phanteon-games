// pages/api/webhook/mercadopago.js
import crypto from 'crypto';
import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Configuração de segurança
const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
// Tempo máximo permitido de diferença (5 minutos)
const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000;

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
    if (!MERCADO_PAGO_WEBHOOK_SECRET || process.env.NODE_ENV !== 'production') {
      console.warn('[Webhook] Validação de assinatura desabilitada - chave secreta não configurada ou ambiente não produtivo');
      return true;
    }

    // Obtem o cabeçalho de assinatura (formato: "ts=TIMESTAMP,v1=SIGNATURE")
    const signatureHeader = headers['x-signature'];
    
    if (!signatureHeader) {
      console.warn('[Webhook] Cabeçalho x-signature não encontrado');
      // Se estamos em produção, exigimos a assinatura
      return process.env.NODE_ENV !== 'production';
    }

    // Extrai timestamp e assinatura do cabeçalho
    const signatureParts = signatureHeader.split(',');
    if (signatureParts.length !== 2) {
      console.warn('[Webhook] Formato inválido de x-signature');
      return false;
    }

    const tsMatch = signatureParts[0].match(/ts=(\d+)/);
    const signatureMatch = signatureParts[1].match(/v1=([a-f0-9]+)/);

    if (!tsMatch || !signatureMatch) {
      console.warn('[Webhook] Componentes de assinatura mal formatados');
      return false;
    }

    const timestamp = parseInt(tsMatch[1]);
    const signature = signatureMatch[1];

    // Verifica se o timestamp está dentro de um intervalo válido
    const currentTime = Date.now() / 1000;
    const timeDiff = Math.abs(currentTime - timestamp);
    
    if (timeDiff > MAX_TIMESTAMP_DIFF / 1000) {
      console.warn(`[Webhook] Timestamp muito antigo ou futuro: ${timeDiff.toFixed(2)}s de diferença`);
      return false;
    }

    // Monta a string a ser validada
    const stringToVerify = `${timestamp}.${body}`;
    
    // Calcula o HMAC usando a chave secreta
    const expectedSignature = crypto
      .createHmac('sha256', MERCADO_PAGO_WEBHOOK_SECRET)
      .update(stringToVerify)
      .digest('hex');
    
    // Compara de forma segura (tempo constante) para evitar timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!isValid) {
      console.warn('[Webhook] Assinatura inválida');
    }
    
    return isValid;
  } catch (error) {
    console.error('[Webhook] Erro na validação de assinatura:', error);
    // Em caso de erro, permitimos passar em dev e rejeitamos em prod
    return process.env.NODE_ENV !== 'production';
  }
}

/**
 * Extrai identificador único da notificação para evitar processamento duplicado
 */
function getNotificationUniqueId(topic, id, body) {
  const idString = `${topic}:${id}`;
  
  // Se temos body com detalhes adicionais, adicionar ao hash
  if (body && typeof body === 'object') {
    // Adicionar payment_id se disponível para maior especificidade
    if (body.payment_id) {
      return `${idString}:payment:${body.payment_id}`;
    }
    
    // Adicionar merchant_order_id se disponível
    if (body.merchant_order_id) {
      return `${idString}:order:${body.merchant_order_id}`;
    }
  }
  
  return idString;
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
 * Registra a notificação no banco de dados para rastreabilidade
 */
async function logNotification(notification, result, headers) {
  try {
    // Cria registro da notificação recebida
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        provider: 'mercadopago',
        notification_id: notification.id,
        notification_type: notification.topic,
        status: result.success ? 'success' : 'failed',
        details: {
          result,
          headers: {
            'user-agent': headers['user-agent'],
            'content-type': headers['content-type'],
            'x-signature': headers['x-signature']
          }
        }
      });
  } catch (error) {
    console.error('[Webhook] Erro ao registrar notificação:', error);
    // Não propagamos esse erro, apenas logamos
  }
}

/**
 * Cria ou atualiza uma assinatura no banco de dados
 */
async function createOrUpdateSubscription(userId, planId, paymentDetails) {
  return await withRetry(async () => {
    // Busca informações do plano
    const { data: planData, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      throw new Error(`Erro ao buscar plano: ${planError.message}`);
    }
    
    if (!planData) {
      throw new Error(`Plano não encontrado: ${planId}`);
    }
    
    // Busca informações do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    }
    
    if (!userData) {
      throw new Error(`Usuário não encontrado: ${userId}`);
    }
    
    // Calcula data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planData.duration_days);
    
    // Cria ou atualiza assinatura
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      plan_name: planData.name,
      payment_id: paymentDetails.paymentId,
      status: 'active',
      payment_status: paymentDetails.status,
      amount: paymentDetails.amount,
      currency: 'BRL',
      start_date: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      steam_id: userData.steam_id,
      payment_details: {
        method: 'mercadopago',
        payment_id: paymentDetails.paymentId,
        transaction_time: new Date().toISOString()
      }
    };
    
    // Verifica se já existe uma assinatura ativa para este usuário
    const { data: existingSubscription, error: subQueryError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subQueryError && !subQueryError.message.includes('No rows found')) {
      throw new Error(`Erro ao verificar assinaturas existentes: ${subQueryError.message}`);
    }
    
    let result;
    
    // Se já existe uma assinatura ativa, atualize-a
    if (existingSubscription) {
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          ...subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select('*')
        .single();
        
      if (updateError) {
        throw new Error(`Erro ao atualizar assinatura: ${updateError.message}`);
      }
      
      result = { data: updatedSub, isNew: false };
    } else {
      // Cria uma nova assinatura
      const { data: newSub, error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
        
      if (insertError) {
        throw new Error(`Erro ao criar assinatura: ${insertError.message}`);
      }
      
      result = { data: newSub, isNew: true };
    }
    
    return result;
  }, {
    maxRetries: 5,
    initialDelay: 300,
    maxDelay: 3000,
    operationName: 'Criar/Atualizar Assinatura'
  });
}

/**
 * Aplica permissões VIP no servidor Rust
 */
async function applyRustPermissions(userData, subscriptionId) {
  return await withRetry(async () => {
    if (!userData.steam_id) {
      throw new Error('SteamID não disponível para o usuário');
    }
    
    try {
      const result = await addVipPermissions(userData.steam_id);
      
      if (result.success) {
        // Atualiza a flag de permissões aplicadas na assinatura
        await supabaseAdmin
          .from('subscriptions')
          .update({
            rust_permission_assigned: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        
        return { success: true };
      } else {
        throw new Error(`Falha ao aplicar permissões: ${result.message}`);
      }
    } catch (serverError) {
      // Registra a falha para reconciliação posterior
      await supabaseAdmin
        .from('system_logs')
        .insert({
          action: 'vip_permission_failed',
          details: {
            subscription_id: subscriptionId,
            steam_id: userData.steam_id,
            error: serverError.message
          }
        });
      
      throw serverError;
    }
  }, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 5000,
    operationName: 'Aplicar Permissões Rust'
  });
}

/**
 * Aplica cargo VIP no Discord
 */
async function applyDiscordRole(userData, planData, subscriptionId) {
  return await withRetry(async () => {
    if (!userData.discord_id) {
      console.log(`[Webhook] Usuário ${userData.id} não tem Discord ID, pulando atribuição de cargo`);
      return { success: false, reason: 'missing_discord_id' };
    }
    
    try {
      // Determina tipo de VIP com base no plano
      const isVipPlus = planData.name.toLowerCase().includes('plus');
      const roleType = isVipPlus ? 'vip-plus' : 'vip-basic';
      
      // Adiciona cargo no Discord
      const result = await addVipRole(userData.discord_id, roleType);
      
      if (result.success) {
        // Atualiza a flag de cargo Discord na assinatura
        await supabaseAdmin
          .from('subscriptions')
          .update({
            discord_role_assigned: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        
        return { success: true };
      } else {
        throw new Error(`Falha ao adicionar cargo Discord: ${result.message}`);
      }
    } catch (error) {
      // Registra a falha para reconciliação posterior
      await supabaseAdmin
        .from('system_logs')
        .insert({
          action: 'discord_role_failed',
          details: {
            subscription_id: subscriptionId,
            discord_id: userData.discord_id,
            error: error.message
          }
        });
      
      throw error;
    }
  }, {
    maxRetries: 3,
    initialDelay: 500,
    maxDelay: 3000,
    operationName: 'Aplicar Cargo Discord'
  });
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
    console.log('[Webhook] Headers recebidos:', JSON.stringify(headers));
    console.log('[Webhook] Query recebidos:', JSON.stringify(query));
    console.log('[Webhook] Body recebido:', typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200));

    // Validação de segurança
    if (!validateMercadoPagoSignature(headers, rawBody)) {
      console.warn('[Webhook] Assinatura inválida no webhook do MercadoPago');
      return res.status(401).json({ success: false, message: 'Assinatura de webhook inválida' });
    }

    // Extração de dados da notificação
    let paymentNotification = {
      id: null,
      topic: 'payment' // Valor padrão
    };

    // Estratégia 1: Query parameters (formato data.id usado pelo MercadoPago)
    if (query['data.id']) {
      paymentNotification.id = query['data.id'];
      paymentNotification.topic = query.type || 'merchant_order';
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
        paymentNotification.topic = body.action || 'payment';
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
      // Para MercadoPago, retornamos 200 para evitar reenvios
      return res.status(200).json({ success: false, message: result.message });
    }

    const { userId, planId, paymentId, status, amount } = result.data;

    console.log(`[Webhook] Pagamento aprovado: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

    // Cria ou atualiza a assinatura no banco de dados
    const subscriptionResult = await createOrUpdateSubscription(userId, planId, { 
      paymentId, 
      status, 
      amount 
    });
    
    // Se a assinatura foi criada ou atualizada com sucesso, applica permissões
    if (subscriptionResult) {
      const subscription = subscriptionResult.data;
      const isNewSubscription = subscriptionResult.isNew;
      
      console.log(`[Webhook] Assinatura ${isNewSubscription ? 'criada' : 'atualizada'}: ${subscription.id}`);
      
      // Busca informações completas do usuário
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error(`[Webhook] Erro ao buscar dados do usuário: ${userError.message}`);
      }
      
      // Busca informações completas do plano
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
        
      if (planError) {
        console.error(`[Webhook] Erro ao buscar dados do plano: ${planError.message}`);
      }
      
      // Aplica permissões VIP no servidor Rust (em parallel com Discord)
      const rustPromise = userData?.steam_id 
        ? applyRustPermissions(userData, subscription.id)
            .then(result => ({ type: 'rust', success: true, result }))
            .catch(error => ({ type: 'rust', success: false, error: error.message }))
        : Promise.resolve({ type: 'rust', success: false, reason: 'no_steam_id' });
          
      // Aplica cargo VIP no Discord (em parallel com Rust)
      const discordPromise = userData?.discord_id && planData 
        ? applyDiscordRole(userData, planData, subscription.id)
            .then(result => ({ type: 'discord', success: true, result }))
            .catch(error => ({ type: 'discord', success: false, error: error.message }))
        : Promise.resolve({ type: 'discord', success: false, reason: 'no_discord_id_or_plan' });
      
      // Aguarda conclusão de todas as operações
      const [rustResult, discordResult] = await Promise.all([rustPromise, discordPromise]);
      
      // Log dos resultados
      console.log(`[Webhook] Resultado da aplicação de permissões:`, {
        rust: rustResult,
        discord: discordResult
      });
      
      // Atualiza data de conclusão da operação
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      
      // Se tudo correu bem, adicionar ao log de sucesso
      await supabaseAdmin
        .from('system_logs')
        .insert({
          action: 'payment_processed',
          details: {
            notification_id: notificationId,
            subscription_id: subscription.id,
            user_id: userId,
            processing_time: processingTime,
            results: {
              rust: rustResult,
              discord: discordResult
            }
          }
        });
      
      return res.status(200).json({
        success: true,
        message: 'Pagamento processado com sucesso',
        subscriptionId: subscription.id,
        processingTime: `${processingTime.toFixed(2)}s`
      });
    } else {
      console.error('[Webhook] Erro desconhecido ao criar/atualizar assinatura');
      return res.status(200).json({
        success: false,
        message: 'Falha ao processar assinatura'
      });
    }
  } catch (error) {
    console.error('[Webhook] Erro no processamento do webhook:', error);
    
    // Registra o erro no banco de dados para auditoria
    try {
      await supabaseAdmin
        .from('system_logs')
        .insert({
          action: 'webhook_error',
          details: {
            error: error.message,
            stack: error.stack,
            query: req.query,
            body_keys: req.body ? Object.keys(req.body) : []
          }
        });
    } catch (logError) {
      console.error('[Webhook] Erro ao registrar log de erro:', logError);
    }
    
    // Sempre retorna 200 para o MercadoPago para evitar retentativas desnecessárias
    return res.status(200).json({
      success: false,
      message: 'Erro interno no processamento'
    });
  }
}