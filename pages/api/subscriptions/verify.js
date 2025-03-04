import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Aceita apenas método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Verificação de autenticação
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Garantir que o Discord ID seja uma string
    const discordIdString = session.user.discord_id.toString();
    
    console.log(`[API:verify] Verificando assinaturas para usuário: ${discordIdString}`);

    // Buscar usuário no Supabase pelo discord_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordIdString)
      .maybeSingle();

    if (userError) {
      console.error('[API:verify] Erro ao buscar usuário:', userError);
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }

    if (!userData) {
      console.error('[API:verify] Usuário não encontrado, discord_id:', discordIdString);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar assinaturas ativas do usuário
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userData.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: false });

    if (subscriptionError) {
      console.error('[API:verify] Erro ao buscar assinaturas:', subscriptionError);
      return res.status(500).json({ message: 'Erro ao verificar assinaturas' });
    }

    // Verifica se há assinaturas ativas
    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    const currentSubscription = hasActiveSubscription ? subscriptions[0] : null;

    console.log(`[API:verify] Usuário ${discordIdString} tem assinatura ativa: ${hasActiveSubscription}`);

    // Retorna o status da assinatura e dados da assinatura ativa (se houver)
    return res.status(200).json({
      active: hasActiveSubscription,
      subscription: currentSubscription,
      subscriptions: subscriptions || []
    });
  } catch (error) {
    console.error('[API:verify] Erro no servidor:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}