import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import mercadopago from 'mercadopago';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar chave secreta para autorizar essa API (usar com cron job)
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.CRON_API_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Configurar SDK do Mercado Pago
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_PRODUCTION_ACCESS_TOKEN || '',
    });

    // Encontrar assinaturas ativas que vencem em 3 dias ou menos
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    const { data: subscriptionsToRenew, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user:profiles(*),
        plan:subscription_plans(*)
      `)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('end_date', threeDaysLater.toISOString())
      .gt('end_date', now.toISOString());

    if (error) {
      console.error('Error fetching subscriptions to renew:', error);
      return res.status(500).json({ error: 'Erro ao buscar assinaturas para renovação' });
    }

    // Processar cada assinatura
    const results = [];
    for (const subscription of subscriptionsToRenew || []) {
      try {
        // Se já existe uma assinatura recorrente no Mercado Pago, verificar status
        if (subscription.mercadopago_subscription_id) {
          const mpSub = await mercadopago.preapproval.get(subscription.mercadopago_subscription_id);
          
          if (mpSub.body && (mpSub.body.status === 'authorized' || mpSub.body.status === 'active')) {
            // Assinatura recorrente já está ativa, não precisa fazer nada
            results.push({
              subscription_id: subscription.id,
              status: 'already_active_recurring',
              mp_subscription_id: subscription.mercadopago_subscription_id
            });
            continue;
          }
        }

        // Caso contrário, temos que criar uma nova cobrança
        // Verificar se o usuário tem preferência de pagamento salva
        if (subscription.mercadopago_customer_id && subscription.user.email) {
          // Criar nova preferência de pagamento para renovação
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
          const successUrl = `${baseUrl}/payment/success?subscription_id=${subscription.id}&renewal=true`;
          const failureUrl = `${baseUrl}/payment/failure?subscription_id=${subscription.id}&renewal=true`;
          
          const preference = {
            items: [
              {
                id: `renewal_plan_${subscription.plan.id}`,
                title: `Renovação: ${subscription.plan.name}`,
                description: `Renovação da assinatura ${subscription.plan.name}`,
                unit_price: Number(subscription.plan.price),
                quantity: 1,
                currency_id: 'BRL',
              }
            ],
            payer: {
              email: subscription.user.email,
              ...(subscription.mercadopago_customer_id && {
                id: subscription.mercadopago_customer_id
              })
            },
            external_reference: subscription.id.toString(),
            back_urls: {
              success: successUrl,
              failure: failureUrl,
            },
            auto_return: 'approved',
            notification_url: `${baseUrl}/api/payments/webhook`,
            metadata: {
              user_id: subscription.user.id,
              subscription_id: subscription.id,
              renewal: true
            }
          };

          const response = await mercadopago.preferences.create(preference);

          // Registrar tentativa de renovação
          const { error: logError } = await supabase
            .from('renewal_attempts')
            .insert({
              subscription_id: subscription.id,
              preference_id: response.body.id,
              status: 'pending',
              amount: subscription.plan.price,
              attempt_date: new Date().toISOString()
            });

          if (logError) {
            console.error('Error logging renewal attempt:', logError);
          }

          // Enviar email de notificação para usuário (implementar serviço de email)
          console.log(`[Email] Tentativa de renovação para assinatura ${subscription.id}`);

          results.push({
            subscription_id: subscription.id,
            status: 'renewal_initiated',
            preference_id: response.body.id,
            init_point: response.body.init_point
          });
        } else {
          // Sem dados de pagamento, enviar email solicitando atualização
          // Implementar lógica de envio de email aqui
          console.log(`[Email] Solicitação de atualização de método de pagamento para assinatura ${subscription.id}`);

          results.push({
            subscription_id: subscription.id,
            status: 'payment_method_required'
          });
        }
      } catch (subError) {
        console.error(`Error processing subscription ${subscription.id}:`, subError);
        results.push({
          subscription_id: subscription.id,
          status: 'error',
          error: subError instanceof Error ? subError.message : String(subError)
        });
      }
    }

    // Encontrar assinaturas que já expiraram
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('status', 'active')
      .lt('end_date', now.toISOString());

    if (expiredError) {
      console.error('Error fetching expired subscriptions:', expiredError);
    } else {
      // Processar assinaturas expiradas
      for (const subscription of expiredSubscriptions || []) {
        try {
          // Atualizar status para expirado
          await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);

          // Remover benefícios
          await removeMembershipBenefits(subscription);

          // Enviar email informando sobre expiração
          console.log(`[Email] Assinatura ${subscription.id} expirada`);

          results.push({
            subscription_id: subscription.id,
            status: 'expired'
          });
        } catch (expError) {
          console.error(`Error processing expired subscription ${subscription.id}:`, expError);
          results.push({
            subscription_id: subscription.id,
            status: 'error_expiring',
            error: expError instanceof Error ? expError.message : String(expError)
          });
        }
      }
    }

    return res.status(200).json({
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Error checking renewals:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro ao verificar renovações' 
    });
  }
}

// Reutilizar a função do webhook.ts
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
  } catch (error) {
    console.error('Error removing membership benefits:', error);
  }
}