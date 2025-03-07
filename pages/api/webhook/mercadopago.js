// pages/api/webhook/mercadopago.js
import crypto from 'crypto';
import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Configuração de segurança
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
// Tempo máximo permitido de diferença (5 minutos)
const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000;

/**
 * Valida a assinatura do webhook do MercadoPago
 * @param {Object} headers - Cabeçalhos da requisição
 * @param {String} body - Corpo da requisição (raw)
 * @returns {Boolean} - Resultado da validação
 */
function validateMercadoPagoSignature(headers, body) {
  try {
    // Se não temos chave secreta configurada ou estamos em ambiente de desenvolvimento
    if (!MERCADOPAGO_WEBHOOK_SECRET || process.env.NODE_ENV !== 'production') {
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
      .createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET)
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
    console.error('[Webhook] Erro ao validar assinatura:', error);
    // Em caso de erro, permitimos passar em dev e rejeitamos em prod
    return process.env.NODE_ENV !== 'production';
  }
}

export default async function handler(req, res) {
  // Captura o corpo bruto para validação de assinatura
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Extração de dados da requisição
    const { query, body, headers } = req;
    
    // Logging para diagnóstico (omitir dados sensíveis em produção)
    console.log('[Webhook] Headers recebidos:', JSON.stringify(headers));
    console.log('[Webhook] Query recebidos:', JSON.stringify(query));
    console.log('[Webhook] Body recebido:', typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200));

    // Validação de segurança ajustada para x-signature
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

    // Processa a notificação do Mercado Pago
    const result = await processPaymentNotification(paymentNotification.topic, paymentNotification.id);

    if (!result.success) {
      console.warn(`[Webhook] Notificação não processável: ${result.message}`);
      // Para MercadoPago, retornamos 200 para evitar reenvios
      return res.status(200).json({ success: false, message: result.message });
    }

    const { userId, planId, paymentId, status, amount } = result.data;

    console.log(`[Webhook] Pagamento aprovado: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

    // Busca informações do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`discord_id.eq.${userId},discord_id.eq."${userId}"`) // Busca como número ou string
      .maybeSingle();

    if (userError) {
      console.error('[Webhook] Erro ao buscar dados do usuário:', userError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuário' });
    }

    if (!userData) {
      console.error('[Webhook] Usuário não encontrado para discord_id:', userId);
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    // Busca a assinatura pendente ou qualquer assinatura recente
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .or(`status.eq.pending,payment_preference_id.ilike.%${paymentId}%,payment_id.eq.${paymentId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calcular data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtISOString = expiresAt.toISOString();

    if (subError) {
      console.error('[Webhook] Erro ao buscar assinatura pendente:', subError);
      return res.status(500).json({ success: false, message: 'Erro ao buscar assinatura pendente' });
    }

    let subscriptionId;

    if (!subscription) {
      console.log('[Webhook] Assinatura pendente não encontrada, criando nova assinatura');
      
      // Obter o nome do plano com base no planId
      let planName = planId.replace('vip-', 'VIP ');
      planName = planName.replace('basic', 'Básico').replace('plus', 'Plus').replace('premium', 'Premium');

      // Buscar o ID do plano no banco de dados se planId for um código interno
      let dbPlanId = planId;
      if (planId === 'vip-basic') {
        dbPlanId = '0b81cf06-ed81-49ce-8680-8f9d9edc932e';
      } else if (planId === 'vip-plus') {
        dbPlanId = '3994ff53-f110-4c8f-a492-ad988528006f';
      }

      // Criar uma nova assinatura
      const { data: newSubscription, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert([{
          user_id: userData.id,
          plan_id: dbPlanId,
          plan_name: planName,
          status: 'active',
          payment_status: 'approved',
          amount: parseFloat(amount) || 0,
          price: parseFloat(amount) || 0,
          payment_id: paymentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAtISOString,
          steam_id: userData.steam_id,
          discord_role_assigned: false,
          rust_permission_assigned: false,
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('[Webhook] Erro ao criar nova assinatura:', createError);
        return res.status(500).json({ success: false, message: 'Erro ao criar assinatura' });
      }

      subscriptionId = newSubscription.id;
      console.log(`[Webhook] Nova assinatura criada, ID: ${subscriptionId}`);
    } else {
      // Atualiza a assinatura existente para ativa
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          payment_status: 'approved',
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
          expires_at: expiresAtISOString,
          is_active: true
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('[Webhook] Erro ao atualizar assinatura:', updateError);
        return res.status(500).json({ success: false, message: 'Erro ao atualizar assinatura' });
      }

      subscriptionId = subscription.id;
      console.log(`[Webhook] Assinatura atualizada para ativa, ID: ${subscriptionId}`);
    }

    // Adiciona permissões VIP no servidor Rust
    if (userData.steam_id) {
      try {
        console.log(`[Webhook] Adicionando permissões VIP para SteamID: ${userData.steam_id}`);
        const vipAdded = await addVipPermissions(userData.steam_id);
        
        if (!vipAdded) {
          console.error('[Webhook] Erro ao adicionar permissões VIP no servidor Rust');
        } else {
          console.log('[Webhook] Permissões VIP adicionadas com sucesso no servidor Rust');
          
          // Atualiza o status no banco de dados
          await supabaseAdmin
            .from('subscriptions')
            .update({ rust_permission_assigned: true })
            .eq('id', subscriptionId);
        }
      } catch (serverError) {
        console.error('[Webhook] Exceção ao adicionar permissões VIP:', serverError);
        // Não falha o webhook se a integração com o servidor falhar
      }
    }

    // Adiciona cargo VIP no Discord se o ID estiver disponível
    if (userData.discord_id) {
      try {
        console.log(`[Webhook] Adicionando cargo VIP no Discord para ID: ${userData.discord_id}`);
        const roleAdded = await addVipRole(userData.discord_id, planId); // Passando o planId aqui
        
        if (!roleAdded) {
          console.error('[Webhook] Erro ao adicionar cargo VIP no Discord');
        } else {
          console.log('[Webhook] Cargo VIP adicionado com sucesso no Discord');
          
          // Atualiza o status no banco de dados
          await supabaseAdmin
            .from('subscriptions')
            .update({ discord_role_assigned: true })
            .eq('id', subscriptionId);
        }
      } catch (discordError) {
        console.error('[Webhook] Exceção ao adicionar cargo Discord:', discordError);
        // Não falha o webhook se a integração com o Discord falhar
      }
    }

    // Atualiza a role do usuário com base no plano contratado
    let newRole = 'user';
    if (planId.includes('vip-plus') || planId.includes('vip_plus')) {
      newRole = 'vip-plus';
    } else if (planId.includes('vip')) {
      newRole = 'vip';
    }

    // Não rebaixa um admin para vip
    if (userData.role !== 'admin') {
      const { error: roleError } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userData.id);
        
      if (roleError) {
        console.error('[Webhook] Erro ao atualizar role do usuário:', roleError);
      } else {
        console.log(`[Webhook] Role do usuário atualizada com sucesso para '${newRole}'`);
      }
    }

    // Retorno de sucesso para o Mercado Pago
    return res.status(200).json({ 
      success: true, 
      message: 'Pagamento processado com sucesso',
      subscription_id: subscriptionId
    });
  } catch (error) {
    // Logar erro detalhado mas responder com 200 para Mercado Pago não retentar
    console.error('[Webhook] Erro ao processar webhook:', error);
    return res.status(200).json({ 
      success: false, 
      message: 'Erro ao processar pagamento, mas registrado para análise',
      error_message: error.message
    });
  }
}