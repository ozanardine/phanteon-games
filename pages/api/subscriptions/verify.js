import { getSession } from 'next-auth/react';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Apenas método GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const userId = req.query.userId || session.user.discord_id;

    // Busca dados da assinatura ativa
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 é o código para 'no rows returned'
      console.error('Erro ao verificar assinatura:', subError);
      return res.status(500).json({ message: 'Erro ao verificar assinatura' });
    }

    // Se não encontrou assinatura ativa
    if (!subscriptionData) {
      return res.status(200).json({
        active: false,
        message: 'Nenhuma assinatura ativa encontrada',
      });
    }

    // Calcula dias restantes
    const expiresAt = new Date(subscriptionData.expires_at);
    const today = new Date();
    const diffTime = expiresAt - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      active: true,
      subscription: {
        id: subscriptionData.id,
        plan_id: subscriptionData.plan_id,
        plan_name: subscriptionData.plan_name,
        expires_at: subscriptionData.expires_at,
        days_remaining: diffDays,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}