import { processPaymentNotification } from '../../../lib/mercadopago';
import { supabase } from '../../../lib/supabase';
import { addVipPermissions } from '../../../lib/rust-server';
import { addVipRole } from '../../../lib/discord';

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { query } = req;
    const { topic, id } = query;

    console.log(`[Webhook] Recebido webhook MercadoPago: ${topic}, ID: ${id}`);

    // Processa a notificação do Mercado Pago
    const result = await processPaymentNotification(topic, id);

    if (!result.success) {
      console.error('[Webhook] Erro ao processar notificação:', result.message);
      return res.status(400).json({ message: result.message });
    }

    const { userId, planId, paymentId, status, amount } = result.data;

    console.log(`[Webhook] Pagamento aprovado: ID ${paymentId}, Usuário: ${userId}, Plano: ${planId}`);

    // Busca informações do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('[Webhook] Erro ao buscar dados do usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (!userData) {
      console.error('[Webhook] Usuário não encontrado para discord_id:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Busca a assinatura pendente
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('[Webhook] Erro ao buscar assinatura pendente:', subError);
      // Continua para tentar uma abordagem alternativa
    }

    let subscriptionId;

    if (!subscription) {
      console.log('[Webhook] Assinatura pendente não encontrada, criando nova assinatura');
      
      // Calcular data de expiração (30 dias)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Criar uma nova assinatura se não encontrar uma pendente
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert([{
          user_id: userData.id,
          plan_id: planId,
          plan_name: planId.replace('vip-', 'VIP ').replace('basic', 'Básico').replace('plus', 'Plus').replace('premium', 'Premium'),
          status: 'active',
          amount: amount,
          payment_id: paymentId,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          steam_id: userData.steam_id
        }])
        .select()
        .single();

      if (createError) {
        console.error('[Webhook] Erro ao criar nova assinatura:', createError);
        return res.status(500).json({ message: 'Erro ao criar assinatura' });
      }

      subscriptionId = newSubscription.id;
      console.log(`[Webhook] Nova assinatura criada, ID: ${subscriptionId}`);
    } else {
      // Calcular data de expiração (30 dias)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Atualiza a assinatura pendente para ativa
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          payment_id: paymentId,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('[Webhook] Erro ao atualizar assinatura:', updateError);
        return res.status(500).json({ message: 'Erro ao atualizar assinatura' });
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
          await supabase
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
        const roleAdded = await addVipRole(userData.discord_id);
        
        if (!roleAdded) {
          console.error('[Webhook] Erro ao adicionar cargo VIP no Discord');
        } else {
          console.log('[Webhook] Cargo VIP adicionado com sucesso no Discord');
          
          // Atualiza o status no banco de dados
          await supabase
            .from('subscriptions')
            .update({ discord_role_assigned: true })
            .eq('id', subscriptionId);
        }
      } catch (discordError) {
        console.error('[Webhook] Exceção ao adicionar cargo Discord:', discordError);
        // Não falha o webhook se a integração com o Discord falhar
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Webhook] Erro ao processar webhook:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}