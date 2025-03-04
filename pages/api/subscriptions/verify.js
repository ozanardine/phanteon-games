import { getServerSession } from 'next-auth/react';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Apenas método GET é permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getServerSession({ req, res, authOptions });
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const userId = req.query.userId || session.user.discord_id;
    
    console.log(`[API:verify] Verificando assinatura para discord_id: ${userId}`);

    // Busca o usuário pelo discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('[API:verify] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar usuário' });
    }

    if (!userData) {
      console.error('[API:verify] Usuário não encontrado:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Busca dados da assinatura ativa
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 é o código para 'no rows returned'
      console.error('[API:verify] Erro ao verificar assinatura:', subError);
      return res.status(500).json({ message: 'Erro ao verificar assinatura' });
    }

    // Se não encontrou assinatura ativa
    if (!subscriptionData) {
      console.log(`[API:verify] Nenhuma assinatura ativa encontrada para: ${userData.id}`);
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

    console.log(`[API:verify] Assinatura ativa encontrada: ${subscriptionData.id}, dias restantes: ${diffDays}`);

    return res.status(200).json({
      active: true,
      subscription: {
        id: subscriptionData.id,
        plan_id: subscriptionData.plan_id,
        plan_name: subscriptionData.plan_name,
        expires_at: subscriptionData.expires_at,
        days_remaining: diffDays,
        created_at: subscriptionData.created_at
      },
    });
  } catch (error) {
    console.error('[API:verify] Erro ao verificar assinatura:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}