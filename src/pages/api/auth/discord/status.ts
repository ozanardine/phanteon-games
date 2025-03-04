// src/pages/api/auth/discord/status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Habilitar CORS para esta rota se necessário
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Criar cliente Supabase com opções melhoradas
    const supabase = createPagesServerClient({ 
      req, 
      res,
      options: {
        cookies: {
          name: 'sb-auth',
          lifetime: 60 * 60 * 24 * 7, // 1 semana
          domain: '',
          path: '/',
          sameSite: 'lax'
        }
      }
    });

    // Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Verificar erro na obtenção da sessão
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return res.status(401).json({ error: 'Auth error' });
    }

    // Verificar se a sessão existe
    if (!session) {
      // Tentativa de renovação de sessão automática
      try {
        const refreshResult = await supabase.auth.refreshSession();
        if (refreshResult.error || !refreshResult.data.session) {
          return res.status(401).json({ error: 'No session' });
        }
        
        // Renovação bem-sucedida, continuar com a sessão renovada
      } catch (refreshError) {
        console.error('Session refresh error:', refreshError);
        return res.status(401).json({ error: 'No session' });
      }
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