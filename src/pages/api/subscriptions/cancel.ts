import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mercadopago from 'mercadopago';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Extrair ID da assinatura da requisição
    const { subscriptionId, reason, removeImmediately = false } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'ID da assinatura não informado' });
    }

    // Buscar assinatura para garantir que pertence ao usuário
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Configurar SDK do Mercado Pago para o ambiente correto
    // Para isso, verificamos se há ID de assinatura do Mercado Pago
    // e checamos seu ambiente via prefixo (sandbox_ vs prod_)
    const mpSubscriptionId = subscription.mercadopago_subscription_id;
    const isSandbox = mpSubscriptionId && mpSubscriptionId.startsWith('sandbox_');
    
    const accessToken = isSandbox 
      ? process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN 
      : process.env.MERCADOPAGO_PRODUCTION_ACCESS_TOKEN;
    
    mercadopago.configure({
      access_token: accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    });

    // Se a assinatura estiver ativa no Mercado Pago, cancelar lá também
    let mpCanceled = false;
    if (mpSubscriptionId) {
      try {
        // Verificar status atual no Mercado Pago
        const mpSubscription = await mercadopago.preapproval.get(mpSubscriptionId);
        
        if (mpSubscription.body && ['authorized', 'active', 'paused'].includes(mpSubscription.body.status)) {
          // Só tenta cancelar se estiver em um estado que permita cancelamento
          const cancelResult = await mercadopago.preapproval.update({
            id: mpSubscriptionId,
            status: "cancelled"
          });
          
          if (cancelResult.body && cancelResult.body.status === 'cancelled') {
            mpCanceled = true;
            console.log(`Mercado Pago subscription ${mpSubscriptionId} canceled successfully`);
          } else {
            console.error('Error canceling MercadoPago subscription:', cancelResult);
          }
        } else {
          console.log(`Mercado Pago subscription ${mpSubscriptionId} already in status: ${mpSubscription.body?.status || 'unknown'}`);
        }
      } catch (mpError) {
        console.error('Error interacting with MercadoPago subscription:', mpError);
        // Não falhar por causa disso, continuamos com o cancelamento local
      }
    }

    // Calcular data em que benefícios serão removidos
    let benefitsUntil = new Date();
    
    if (!removeImmediately && subscription.status === 'active' && subscription.end_date) {
      // Manter benefícios até o fim do período pago, se requisitado
      benefitsUntil = new Date(subscription.end_date);
    }

    // Atualizar status da assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        auto_renew: false,
        cancel_reason: reason || 'user_requested',
        canceled_at: new Date().toISOString(),
        benefits_until: benefitsUntil.toISOString(),
        updated_at: new Date().toISOString(),
        mercadopago_canceled: mpCanceled
      })
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error canceling subscription:', updateError);
      return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
    }

    // Registrar o cancelamento
    const { error: logError } = await supabase
      .from('subscription_logs')
      .insert({
        user_id: session.user.id,
        subscription_id: subscriptionId,
        action: 'canceled',
        details: {
          reason: reason || 'user_requested',
          remove_immediately: removeImmediately,
          mercadopago_canceled: mpCanceled,
          benefits_until: benefitsUntil.toISOString()
        }
      });

    if (logError) {
      console.error('Error logging subscription cancellation:', logError);
    }

    // Se for solicitado remover benefícios imediatamente ou já expirou
    if (removeImmediately || benefitsUntil <= new Date()) {
      // Buscar conexão do Discord do usuário
      const { data: discordConnection } = await supabase
        .from('discord_connections')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (discordConnection && subscription.plan?.discord_role_id) {
        // Remover cargo no Discord
        try {
          await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${subscription.plan.discord_role_id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          });
          console.log('Discord role removed successfully');
        } catch (discordError) {
          console.error('Error removing Discord role:', discordError);
          // Não falhar por causa disso
        }
      }
    }

    // Enviar email confirmando o cancelamento
    console.log(`[Email] Assinatura ${subscriptionId} cancelada pelo usuário`);

    return res.status(200).json({ 
      success: true,
      benefitsUntil: benefitsUntil.toISOString(),
      retainBenefits: benefitsUntil > new Date()
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
}