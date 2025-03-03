import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mercadopago from 'mercadopago';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ message: 'Only POST method allowed' }); // Retornar 200 para o Mercado Pago não reenviar
  }

  try {
    // Extrair dados da requisição
    const { type, data, action } = req.body;
    
    // Registrar webhook para depuração
    console.log('Webhook received:', JSON.stringify({ type, data, action }, null, 2));
    
    // Validar payload (Mercado Pago envia type e data.id ou action)
    if ((!type || !data || !data.id) && !action) {
      console.error('Invalid webhook payload', req.body);
      return res.status(200).json({ message: 'Invalid payload, but acknowledged' });
    }

    // Determinar qual token usar com base nos headers ou no corpo (ambiente)
    // Na prática você verificaria a assinatura do webhook aqui também
    let accessToken = process.env.MERCADOPAGO_PRODUCTION_ACCESS_TOKEN;
    if (req.headers['x-test'] === 'true' || req.body.test === true) {
      accessToken = process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN;
      console.log('Using sandbox token for webhook');
    }

    mercadopago.configure({
      access_token: accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });

    // Registrar o webhook no banco de dados
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_type: type || action,
        data_id: data?.id || '',
        raw_data: req.body,
        received_at: new Date().toISOString()
      });

    // Processar diferentes tipos de eventos
    if (type === 'payment') {
      await processPaymentWebhook(data.id);
    } else if (action === 'payment.created' || action === 'payment.updated') {
      // API v1 format
      const paymentId = req.body.data?.id;
      if (paymentId) {
        await processPaymentWebhook(paymentId);
      }
    } else if (type === 'plan') {
      // Processar eventos relacionados a planos
      console.log('Plan webhook not implemented yet');
    } else if (type === 'subscription' || action?.startsWith('subscription.')) {
      // Processar eventos relacionados a assinaturas
      const subscriptionId = data?.id || req.body.data?.id;
      if (subscriptionId) {
        await processSubscriptionWebhook(subscriptionId, type || action);
      }
    } else if (type === 'invoice') {
      // Processar eventos relacionados a faturas
      console.log('Invoice webhook not implemented yet');
    } else {
      console.log(`Webhook type ${type || action} not specifically handled, but acknowledged`);
    }

    // Sempre retornar sucesso para o Mercado Pago
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Sempre retornar 200 para webhooks, mesmo com erro,
    // para evitar que o Mercado Pago tente reenviar
    return res.status(200).json({ message: 'Error processed but acknowledged' });
  }
}

async function processPaymentWebhook(paymentId: string) {
  try {
    console.log(`Processing payment webhook for ID: ${paymentId}`);
    
    // Buscar detalhes do pagamento
    const payment = await mercadopago.payment.get(paymentId);
    
    if (!payment || !payment.body) {
      throw new Error('Pagamento não encontrado');
    }

    // Registrar dados completos do pagamento para referência
    const paymentData = payment.body;
    await supabase
      .from('payment_details')
      .upsert({
        payment_id: paymentId,
        raw_data: paymentData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'payment_id' });

    // Extrair dados do pagamento
    const { external_reference, status, status_detail } = paymentData;
    
    if (!external_reference) {
      console.error('Missing external_reference in payment', paymentId);
      return;
    }

    const subscriptionId = parseInt(external_reference, 10);

    if (!subscriptionId) {
      console.error('Invalid subscription ID in external_reference', external_reference);
      return;
    }

    // Buscar assinatura no banco de dados
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return;
    }

    // Determinar status do pagamento para nosso sistema
    let paymentStatus = 'pending';
    if (status === 'approved') {
      paymentStatus = 'completed';
    } else if (status === 'rejected' || status === 'cancelled') {
      paymentStatus = 'failed';
    } else if (status === 'refunded' || status === 'charged_back') {
      paymentStatus = 'refunded';
    }

    // Criar ou atualizar registro de pagamento
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('payment_id', paymentId)
      .single();

    if (existingPayment) {
      // Atualizar pagamento existente
      await supabase
        .from('payments')
        .update({
          status: paymentStatus,
          payment_data: paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);
    } else {
      // Criar novo registro de pagamento
      await supabase
        .from('payments')
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          amount: paymentData.transaction_amount,
          payment_method: 'mercadopago',
          status: paymentStatus,
          payment_id: paymentId,
          payment_data: paymentData,
        });
    }

    // Se o pagamento foi aprovado, ativar a assinatura
    if (status === 'approved') {
      // Calcular data de início e fim
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Assume que é assinatura mensal, ajustar se for anual

      // Atualizar assinatura
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
          // Se for uma renovação, incrementar contador de renovações
          renewals_count: subscription.renewals_count ? subscription.renewals_count + 1 : 1,
          // Armazenar ID do cliente do Mercado Pago se disponível
          mercadopago_customer_id: paymentData.payer?.id || subscription.mercadopago_customer_id,
        })
        .eq('id', subscription.id);

      // Processar benefícios VIP (Discord, etc.)
      await processMembershipBenefits(subscription);

      // Enviar email de confirmação (implementação depende do serviço de email)
      console.log(`[Email] Pagamento aprovado para assinatura ${subscription.id}`);
    } else if (status === 'rejected' || status === 'cancelled') {
      // Se for uma assinatura nova (não uma renovação), marcar como falha
      if (!subscription.start_date) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);
      }

      // Enviar email sobre falha no pagamento
      console.log(`[Email] Pagamento rejeitado para assinatura ${subscription.id}: ${status_detail}`);
    }

    console.log(`Payment webhook processed successfully for ID: ${paymentId}`);
  } catch (error) {
    console.error('Error processing payment webhook:', error);
  }
}

async function processSubscriptionWebhook(subscriptionId: string, eventType: string) {
  try {
    console.log(`Processing subscription webhook for ID: ${subscriptionId}, event: ${eventType}`);
    
    // Buscar detalhes da assinatura no Mercado Pago
    const mpSubscription = await mercadopago.preapproval.get(subscriptionId);
    
    if (!mpSubscription || !mpSubscription.body) {
      throw new Error('Assinatura não encontrada no Mercado Pago');
    }

    // Registrar dados completos da assinatura para referência
    const subscriptionData = mpSubscription.body;
    await supabase
      .from('mp_subscription_details')
      .upsert({
        mp_subscription_id: subscriptionId,
        raw_data: subscriptionData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'mp_subscription_id' });

    // Extrair referência externa para encontrar nossa assinatura
    const { external_reference, status } = subscriptionData;
    
    if (!external_reference) {
      console.error('Missing external_reference in subscription', subscriptionId);
      return;
    }

    const ourSubscriptionId = parseInt(external_reference, 10);

    if (!ourSubscriptionId) {
      console.error('Invalid our subscription ID in external_reference', external_reference);
      return;
    }

    // Buscar assinatura no nosso banco de dados
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', ourSubscriptionId)
      .single();

    if (subError || !subscription) {
      console.error('Error fetching subscription:', subError);
      return;
    }

    // Atualizar status da assinatura com base no evento
    let ourStatus = subscription.status;
    
    if (status === 'authorized' || status === 'active') {
      ourStatus = 'active';
    } else if (status === 'cancelled' || status === 'rejected') {
      ourStatus = 'canceled';
    } else if (status === 'paused') {
      ourStatus = 'paused';
    } else if (status === 'pending') {
      ourStatus = 'pending';
    }

    // Atualizar nossa assinatura
    await supabase
      .from('subscriptions')
      .update({
        status: ourStatus,
        mercadopago_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ourSubscriptionId);

    // Processar eventos específicos
    if (eventType === 'subscription.cancelled' || status === 'cancelled') {
      // Remover benefícios de assinatura se foi cancelada
      await removeMembershipBenefits(subscription);
    }

    console.log(`Subscription webhook processed successfully for ID: ${subscriptionId}`);
  } catch (error) {
    console.error('Error processing subscription webhook:', error);
  }
}

async function processMembershipBenefits(subscription: any) {
  try {
    // Buscar plano da assinatura para obter o ID do cargo Discord
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return;
    }

    if (plan.discord_role_id) {
      // Buscar conexão do Discord do usuário
      const { data: discordConnection } = await supabase
        .from('discord_connections')
        .select('*')
        .eq('user_id', subscription.user_id)
        .single();

      if (discordConnection) {
        // Atribuir cargo no Discord
        try {
          const response = await fetch(
            `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${plan.discord_role_id}`, 
            {
              method: 'PUT',
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
          
          if (response.ok) {
            console.log('Discord role assigned successfully');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error assigning Discord role:', response.status, errorData);
          }
        } catch (discordError) {
          console.error('Error assigning Discord role:', discordError);
        }
      }
    }

    // Aplicar outros benefícios conforme necessário
  } catch (error) {
    console.error('Error processing membership benefits:', error);
  }
}

async function removeMembershipBenefits(subscription: any) {
  try {
    // Buscar plano da assinatura para obter o ID do cargo Discord
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    if (planError || !plan || !plan.discord_role_id) {
      return;
    }

    // Buscar conexão do Discord do usuário
    const { data: discordConnection } = await supabase
      .from('discord_connections')
      .select('*')
      .eq('user_id', subscription.user_id)
      .single();

    if (discordConnection) {
      // Remover cargo no Discord
      try {
        const response = await fetch(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordConnection.discord_user_id}/roles/${plan.discord_role_id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
          }
        );
        
        if (response.ok) {
          console.log('Discord role removed successfully');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error removing Discord role:', response.status, errorData);
        }
      } catch (discordError) {
        console.error('Error removing Discord role:', discordError);
      }
    }

    // Remover outros benefícios conforme necessário
  } catch (error) {
    console.error('Error removing membership benefits:', error);
  }
}