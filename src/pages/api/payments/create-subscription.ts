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

    // Extrair dados da requisição
    const { planId, subscriptionId, environment = 'sandbox' } = req.body;

    if (!planId || !subscriptionId) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Configurar SDK do Mercado Pago com token adequado
    const accessToken = environment === 'production'
      ? process.env.MERCADOPAGO_PRODUCTION_ACCESS_TOKEN
      : process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.error(`Missing ${environment} access token`);
      return res.status(500).json({ error: 'Configuração incompleta do Mercado Pago' });
    }

    mercadopago.configure({
      access_token: accessToken,
    });

    console.log(`Using ${environment} environment for Mercado Pago`);

    // Buscar plano e usuário
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Preparar URLs de retorno
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const successUrl = `${baseUrl}/payment/success?subscription_id=${subscriptionId}`;
    const failureUrl = `${baseUrl}/payment/failure?subscription_id=${subscriptionId}`;

    // Criar uma assinatura recorrente no Mercado Pago
    const preapproval_data = {
      payer_email: session.user.email || profile.email,
      back_url: successUrl,
      reason: `Phanteon Games - ${plan.name} (Assinatura)`,
      external_reference: subscriptionId.toString(),
      notification_url: `${baseUrl}/api/payments/webhook`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(plan.price),
        currency_id: "BRL"
      },
      status: environment === 'production' ? "authorized" : "pending",
      ...(environment === 'production' && {
        card_token_id: null, // Este parâmetro só é usado para produção
      })
    };

    const response = await mercadopago.preapproval.create(preapproval_data);

    if (!response.body || !response.body.id) {
      throw new Error('Erro ao criar assinatura recorrente no Mercado Pago');
    }

    console.log('Recurring subscription created:', response.body.id);

    // Registrar os detalhes da assinatura recorrente
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        user_id: session.user.id,
        subscription_id: subscriptionId,
        type: 'recurring_created',
        details: {
          mercadopago_id: response.body.id,
          environment: environment,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Error logging recurring creation:', logError);
    }

    // Atualizar registro da assinatura com ID da assinatura do Mercado Pago
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        mercadopago_subscription_id: response.body.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    }

    // Retornar URL de iniciação do pagamento
    return res.status(200).json({
      id: response.body.id,
      init_point: response.body.init_point || response.body.sandbox_init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creating recurring subscription:', error);
    return res.status(500).json({ error: 'Erro ao criar assinatura recorrente' });
  }
}