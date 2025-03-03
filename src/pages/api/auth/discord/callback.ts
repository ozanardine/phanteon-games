import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter o código de autorização da query string
  const { code, error: discordError } = req.query;

  // Se houver erro no retorno do Discord
  if (discordError) {
    console.error('Discord auth error:', discordError);
    return res.redirect(`/auth/login?error=${encodeURIComponent('Erro na autenticação do Discord: ' + discordError)}`);
  }

  // Se não houver código
  if (!code) {
    return res.redirect('/auth/login?error=Código de autorização ausente');
  }

  try {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.redirect('/auth/login?error=Você precisa estar logado para conectar sua conta do Discord');
    }

    // Trocar o código por um token de acesso
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/discord/callback`,
        scope: 'identify guilds.join',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('Discord token error:', tokenData);
      return res.redirect('/auth/login?error=Erro ao obter token do Discord');
    }

    // Obter informações do usuário do Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (userData.error) {
      console.error('Discord user data error:', userData);
      return res.redirect('/auth/login?error=Erro ao obter dados do usuário do Discord');
    }

    // Adicionar usuário ao servidor Discord (se não estiver)
    try {
      const guildResponse = await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
        body: JSON.stringify({
          access_token: tokenData.access_token,
        }),
      });

      // Verificar resposta do servidor
      if (guildResponse.status !== 201 && guildResponse.status !== 204) {
        console.warn('Failed to add user to Discord server:', await guildResponse.json());
      }
    } catch (guildError) {
      console.error('Error adding user to Discord server:', guildError);
      // Não falhar o fluxo por causa disso
    }

    // Salvar a conexão no banco de dados
    const { error: dbError } = await supabase
      .from('discord_connections')
      .upsert({
        user_id: session.user.id,
        discord_user_id: userData.id,
        discord_username: `${userData.username}${userData.discriminator ? '#' + userData.discriminator : ''}`,
        discord_avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
        discord_access_token: tokenData.access_token,
        discord_refresh_token: tokenData.refresh_token,
        discord_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, discord_user_id' });

    if (dbError) {
      console.error('Database error saving Discord connection:', dbError);
      return res.redirect('/profile?error=Erro ao salvar conexão com Discord');
    }

    // Verificar assinatura atual e atribuir cargo no Discord, se necessário
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

      if (subscription?.plan?.discord_role_id) {
        // Atribuir cargo VIP no Discord
        await fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}/roles/${subscription.plan.discord_role_id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        });
      }
    } catch (roleError) {
      console.error('Error assigning Discord role:', roleError);
      // Não falhar o fluxo por causa disso
    }

    // Redirecionar para o perfil com mensagem de sucesso
    return res.redirect('/profile?discord=success');

  } catch (error) {
    console.error('Discord callback error:', error);
    return res.redirect('/profile?error=Erro na integração com Discord');
  }
}