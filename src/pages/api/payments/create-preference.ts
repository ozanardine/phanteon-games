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
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Extrair dados da requisição
    const { planId, subscriptionId } = req.body;

    if (!planId || !subscriptionId) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

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

    // Preparar descrição do item
    const itemDescription = `Phanteon Games - ${plan.name} (1 ${plan.interval === 'month' ? 'mês' : 'ano'})`;

    // Preparar URL de retorno
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const successUrl = `${baseUrl}/payment/success?subscription_id=${subscriptionId}`;
    const failureUrl = `${baseUrl}/payment/failure?subscription_id=${subscriptionId}`;
    const pendingUrl = `${baseUrl}/payment/pending?subscription_id=${subscriptionId}`;

    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          id: `plan_${plan.id}`,
          title: itemDescription,
          description: plan.description || itemDescription,
          unit_price: Number(plan.price),
          quantity: 1,
          currency_id: 'BRL',
          category_id: 'gaming_subscriptions',
        },
      ],
      payer: {
        name: profile.display_name || profile.username || '',
        email: session.user.email || profile.email || '',
      },
      external_reference: subscriptionId.toString(),
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }, // Excluir boleto, por exemplo
        ],
        installments: 1, // Número de parcelas
      },
      statement_descriptor: 'PHANTEONGAMES',
      metadata: {
        user_id: session.user.id,
        subscription_id: subscriptionId,
        plan_id: plan.id,
      },
    };

    // Criar preferência no Mercado Pago
    const response = await mercadopago.preferences.create(preference);

    // Atualizar assinatura com o ID da preferência
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      // Não falhar por causa disso
    }

    // Retornar URLs de pagamento
    return res.status(200).json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
    });

  } catch (error) {
    console.error('Error creating payment preference:', error);
    return res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
  }
}