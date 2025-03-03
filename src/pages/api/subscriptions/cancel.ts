import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'ID da assinatura não informado' });
    }

    // Buscar assinatura para garantir que pertence ao usuário
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError);
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Se a assinatura estiver ativa no Mercado Pago, cancelar lá também
    if (subscription.mercadopago_subscription_id) {
      try {
        // Você precisaria implementar a lógica para cancelar no Mercado Pago
        // Isso depende de como você configurou as assinaturas recorrentes
        console.log('Would cancel MercadoPago subscription:', subscription.mercadopago_subscription_id);
      } catch (mpError) {
        console.error('Error canceling MercadoPago subscription:', mpError);
        // Não falhar por causa disso
      }
    }

    // Atualizar status da assinatura
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error canceling subscription:', updateError);
      return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
    }

    // Buscar plano da assinatura para obter o ID do cargo Discord
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (!planError && plan && plan.discord_role_id) {
      // Buscar conexão do Discord do usuário
      const { data: discordConnection } = await supabase
        .from('discord_connections')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (discordConnection) {
        // Remover cargo no Discord
        try {
          await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${plan.discord_role_id}`, {
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

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
}