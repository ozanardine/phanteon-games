import { getSession } from 'next-auth/react';
import { createPaymentPreference } from '../../../lib/mercadopago';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Apenas método POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const { title, price, quantity, userId, planId } = req.body;

    // Validação básica
    if (!title || !price || !userId || !planId) {
      return res.status(400).json({ message: 'Dados incompletos para criar assinatura' });
    }

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar se o SteamID está configurado
    if (!userData.steam_id) {
      return res.status(400).json({ message: 'Steam ID não configurado' });
    }

    // Criar preferência de pagamento no Mercado Pago
    const preference = await createPaymentPreference(req.body);

    // Criar registro de assinatura pendente no Supabase
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      plan_name: title.replace(' - Phanteon Games', ''),
      status: 'pending',
      amount: price,
      payment_id: null,
      created_at: new Date().toISOString(),
      expires_at: null, // Será definido quando o pagamento for confirmado
      steam_id: userData.steam_id,
      payment_preference_id: preference.id
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
      return res.status(500).json({ message: 'Erro ao criar assinatura' });
    }

    // Retorna a URL de pagamento do Mercado Pago
    return res.status(200).json({
      success: true,
      subscription_id: subscription.id,
      init_point: preference.init_point,
    });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}