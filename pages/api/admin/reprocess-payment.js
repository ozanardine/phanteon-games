// pages/api/admin/reprocess-payment.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

// Chave de acesso para proteção adicional
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verificação de autenticação via sessão
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Acesso não autorizado' });
    }

    // Verificação adicional via API key (cabeçalho)
    const apiKey = req.headers['x-admin-key'];
    if (ADMIN_API_KEY && apiKey !== ADMIN_API_KEY) {
      return res.status(401).json({ success: false, message: 'Chave de API inválida' });
    }

    // Extrair detalhes da requisição
    const { paymentId, topic = 'payment' } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'ID de pagamento não fornecido' });
    }

    console.log(`[AdminAPI] Reprocessando ${topic} ID: ${paymentId}`);

    // Processar manualmente a notificação
    const result = await processPaymentNotification(topic, paymentId);

    if (!result.success) {
      console.warn(`[AdminAPI] Notificação não processável: ${result.message}`);
      return res.status(400).json({ success: false, message: result.message });
    }

    const { userId, planId, status, amount } = result.data;

    console.log(`[AdminAPI] Pagamento aprovado: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

    // Busca informações do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`discord_id.eq.${userId},discord_id.eq."${userId}"`)
      .maybeSingle();

    if (userError || !userData) {
      const errorMsg = userError ? userError.message : 'Usuário não encontrado';
      return res.status(404).json({ success: false, message: errorMsg });
    }

    // Busca a assinatura existente ou cria uma nova
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .or(`payment_id.eq.${paymentId},payment_preference_id.ilike.%${paymentId}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Data de expiração (30 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtISOString = expiresAt.toISOString();

    let subscriptionId;

    // Se não encontrar assinatura, cria uma nova
    if (!subscription) {
      console.log('[AdminAPI] Assinatura não encontrada, criando nova');
      
      // Obter nome do plano
      let planName = planId.replace('vip-', 'VIP ');
      planName = planName.replace('basic', 'Básico').replace('plus', 'Plus').replace('premium', 'Premium');

      // Buscar o ID do plano no banco
      let dbPlanId = planId;
      if (planId === 'vip-basic') {
        dbPlanId = '0b81cf06-ed81-49ce-8680-8f9d9edc932e';
      } else if (planId === 'vip-plus') {
        dbPlanId = '3994ff53-f110-4c8f-a492-ad988528006f';
      }

      // Criar assinatura
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
        return res.status(500).json({ success: false, message: 'Erro ao criar assinatura', details: createError });
      }

      subscriptionId = newSubscription.id;
    } else {
      // Atualiza a assinatura existente
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
        return res.status(500).json({ success: false, message: 'Erro ao atualizar assinatura', details: updateError });
      }

      subscriptionId = subscription.id;
    }

    // Adiciona permissões VIP no servidor Rust
    let rustSuccess = false;
    if (userData.steam_id) {
      try {
        const vipAdded = await addVipPermissions(userData.steam_id);
        
        if (vipAdded) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ rust_permission_assigned: true })
            .eq('id', subscriptionId);
          
          rustSuccess = true;
        }
      } catch (error) {
        console.error('[AdminAPI] Erro na integração Rust:', error);
      }
    }

    // Adiciona cargo VIP no Discord
    let discordSuccess = false;
    if (userData.discord_id) {
      try {
        const roleAdded = await addVipRole(userData.discord_id, planId);
        
        if (roleAdded) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ discord_role_assigned: true })
            .eq('id', subscriptionId);
          
          discordSuccess = true;
        }
      } catch (error) {
        console.error('[AdminAPI] Erro na integração Discord:', error);
      }
    }

    // Atualiza role do usuário
    let newRole = 'user';
    if (planId.includes('vip-plus') || planId.includes('vip_plus')) {
      newRole = 'vip-plus';
    } else if (planId.includes('vip')) {
      newRole = 'vip';
    }

    // Não rebaixa admin para vip
    let roleUpdated = false;
    if (userData.role !== 'admin') {
      const { error: roleError } = await supabaseAdmin
        .from('users')
        .update({ role: newRole })
        .eq('id', userData.id);
        
      roleUpdated = !roleError;
    }

    // Retorna resultado detalhado
    return res.status(200).json({ 
      success: true, 
      message: 'Pagamento reprocessado com sucesso',
      details: {
        subscription_id: subscriptionId,
        user_id: userData.id,
        discord_id: userData.discord_id,
        steam_id: userData.steam_id,
        plan_id: planId,
        payment_id: paymentId,
        integrations: {
          rust: rustSuccess,
          discord: discordSuccess,
          role_updated: roleUpdated
        }
      }
    });
  } catch (error) {
    console.error('[AdminAPI] Erro ao reprocessar pagamento:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao reprocessar pagamento',
      error: error.message
    });
  }
}