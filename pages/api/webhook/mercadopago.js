import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Webhook Secret para validação básica (recomendado configurar em variáveis de ambiente)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Extração robusta de dados da requisição
    const { query, body, headers } = req;
    
    //Log completo para diagnóstico (em produção, considere omitir dados sensíveis)
    console.log('[Webhook] Headers recebidos:', JSON.stringify(headers));
    console.log('[Webhook] Query recebidos:', JSON.stringify(query));
    console.log('[Webhook] Body recebido:', typeof body === 'string' ? body.substring(0, 200) : JSON.stringify(body).substring(0, 200));

    // Validação opcional da origem (adicione em produção)
    if (WEBHOOK_SECRET && headers['x-webhook-token'] !== WEBHOOK_SECRET) {
      console.warn('[Webhook] Aviso: Token de webhook inválido ou ausente');
      // Em produção, descomente a linha abaixo:
      return res.status(401).json({ success: false, message: 'Token de webhook inválido' });
    }

    // Extração de dados com múltiplas estratégias
    let paymentNotification = {
      id: null,
      topic: 'payment' // Valor padrão
    };

    // Estratégia 1: Query parameters (notificações padrão)
    if (query.id && query.topic) {
      paymentNotification.id = query.id;
      paymentNotification.topic = query.topic;
    } 
    // Estratégia 2: IPN (Instant Payment Notification) no body
    else if (body && typeof body === 'object') {
      // Formato IPN
      if (body.data && body.action) {
        paymentNotification.topic = body.action;
        if (body.data.id) {
          paymentNotification.id = body.data.id;
        } else if (typeof body.data === 'string' && body.data.includes('/')) {
          // Formato "/payments/123456789"
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
    
    // Estratégia 3: Fallback para URLs de retorno incorporadas como form-data
    if (!paymentNotification.id && query.payment_id) {
      paymentNotification.id = query.payment_id;
      paymentNotification.topic = 'payment';
    }

    console.log(`[Webhook] Notificação identificada: ${paymentNotification.topic}, ID: ${paymentNotification.id}`);

    // Validação final antes de processar
    if (!paymentNotification.id) {
      console.error('[Webhook] Falha ao extrair ID da notificação');
      // Respondemos 200 para evitar tentativas repetidas, mas logamos o erro
      return res.status(200).json({ 
        success: false, 
        message: 'ID de pagamento não identificado',
        received: { query, bodyKeys: Object.keys(body || {}) }
      });
    }

    // Processa a notificação do Mercado Pago
    const result = await processPaymentNotification(paymentNotification.topic, paymentNotification.id);

    if (!result.success) {
      console.warn(`[Webhook] Notificação não processável: ${result.message}`);
      // Para Mercado Pago, ainda retornamos 200 para evitar reenvios desnecessários
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

    // Busca a assinatura pendente ou qualquer assinatura recente para este usuário/plano
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .or(`status.eq.pending,payment_preference_id.ilike.%${paymentId}%`)
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

      // Criar uma nova assinatura
      const { data: newSubscription, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert([{
          user_id: userData.id,
          plan_id: planId,
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