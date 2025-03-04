import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Usar a função recomendada pelo Supabase
    const supabase = createPagesServerClient({ req, res });

    // Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Verificar erro na obtenção da sessão
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return res.status(401).json({ error: 'Auth error' });
    }

    // Verificar se a sessão existe
    if (!session) {
      return res.status(401).json({ error: 'No session' });
    }

    // Com a sessão validada, buscar informações do Discord
    const { data: discordConnection, error: discordError } = await supabase
      .from('discord_connections')
      .select('discord_username, discord_user_id, discord_avatar')
      .eq('user_id', session.user.id)
      .single();

    if (discordError && discordError.code !== 'PGRST116') { // PGRST116 = não encontrado
      console.error('Error fetching Discord connection:', discordError);
      return res.status(500).json({ error: 'Discord data error' });
    }

    if (!discordConnection) {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({
      connected: true,
      username: discordConnection.discord_username,
      avatar: discordConnection.discord_avatar,
      user_id: discordConnection.discord_user_id
    });

  } catch (error) {
    console.error('Discord status check error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}