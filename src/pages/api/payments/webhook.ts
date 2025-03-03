import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mercadopago from 'mercadopago';

// Configurar SDK do Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extrair dados da requisição
    const { type, data } = req.body;
    console.log('Webhook received:', { type, data });

    // Verificar se é notificação de pagamento
    if (type !== 'payment') {
      return res.status(200).json({ message: 'Webhook recebido, mas não é de pagamento' });
    }

    // Buscar detalhes do pagamento
    const paymentId = data.id;
    const payment = await mercadopago.payment.get(paymentId);
    
    console.log('Payment details:', payment.body);

    // Verificar se pagamento foi processado
    if (!payment || !payment.body) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    // Extrair dados do pagamento
    const { external_reference, status, status_detail } = payment.body;
    const subscriptionId = parseInt(external_reference, 10);

    if (!subscriptionId) {
      console.error('Invalid subscription ID in external_reference');
      return res.status(400).json({ error: 'ID de assinatura inválido' });
    }

    // Buscar assinatura no banco de dados
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return res.status(404).json({ error: 'Assinatura não encontrada' });
    }

    // Criar registro de pagamento
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        amount: payment.body.transaction_amount,
        payment_method: 'mercadopago',
        status: status === 'approved' ? 'completed' : status === 'rejected' ? 'failed' : 'pending',
        payment_id: paymentId.toString(),
        payment_data: payment.body,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }

    // Se o pagamento foi aprovado, ativar a assinatura
    if (status === 'approved') {
      // Calcular data de início e fim
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Assume que é assinatura mensal

      // Atualizar assinatura
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar assinatura' });
      }

      // Buscar plano da assinatura para obter o ID do cargo Discord
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();

      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        // Não falhar por causa disso
      } else if (plan.discord_role_id) {
        // Buscar conexão do Discord do usuário
        const { data: discordConnection } = await supabase
          .from('discord_connections')
          .select('*')
          .eq('user_id', subscription.user_id)
          .single();

        if (discordConnection) {
          // Atribuir cargo no Discord
          try {
            await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${plan.discord_role_id}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            });
            console.log('Discord role assigned successfully');
          } catch (discordError) {
            console.error('Error assigning Discord role:', discordError);
            // Não falhar por causa disso
          }
        }
      }
    } else if (status === 'rejected') {
      // Se o pagamento foi rejeitado, marcar assinatura como pendente
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Error updating subscription after rejection:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar assinatura rejeitada' });
      }
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}