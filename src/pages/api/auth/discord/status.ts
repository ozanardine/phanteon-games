import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Buscar conexão do Discord
    const { data, error } = await supabase
      .from('discord_connections')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Database error fetching Discord connection:', error);
      return res.status(500).json({ error: 'Erro ao verificar conexão com Discord' });
    }

    // Se não houver conexão
    if (!data) {
      return res.status(200).json({ connected: false });
    }

    // Verificar se o token expirou
    const tokenExpiry = new Date(data.discord_token_expires_at || '');
    const isExpired = tokenExpiry < new Date();

    // Se o token expirou e temos refresh token, renovar
    if (isExpired && data.discord_refresh_token) {
      try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID || '',
            client_secret: process.env.DISCORD_CLIENT_SECRET || '',
            grant_type: 'refresh_token',
            refresh_token: data.discord_refresh_token,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
          // Token de atualização inválido, desconectar
          await supabase
            .from('discord_connections')
            .delete()
            .eq('user_id', session.user.id);
          
          return res.status(200).json({ connected: false });
        }

        // Atualizar tokens no banco de dados
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

        await supabase
          .from('discord_connections')
          .update({
            discord_access_token: tokenData.access_token,
            discord_refresh_token: tokenData.refresh_token,
            discord_token_expires_at: expiryDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);

        return res.status(200).json({ 
          connected: true, 
          username: data.discord_username 
        });

      } catch (refreshError) {
        console.error('Error refreshing Discord token:', refreshError);
        return res.status(200).json({ connected: false });
      }
    }

    // Token válido
    return res.status(200).json({ 
      connected: true, 
      username: data.discord_username 
    });

  } catch (error) {
    console.error('Discord status check error:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do Discord' });
  }
}