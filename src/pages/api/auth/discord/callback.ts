// src/pages/api/auth/discord/callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter o código de autorização da query string
  const { code, error: discordError, state } = req.query;

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
    // Criar cliente Supabase específico para o servidor
    const supabase = createServerSupabaseClient({ req, res });
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.redirect('/auth/login?error=Você precisa estar logado para conectar sua conta do Discord');
    }

    // Verificar CSRF state se presente
    if (state && typeof state === 'string') {
      // Implementar verificação do state para proteção CSRF
      const { data: storedState } = await supabase
        .from('auth_states')
        .select('state')
        .eq('user_id', session.user.id)
        .single();
        
      if (!storedState || storedState.state !== state) {
        console.error('Invalid state parameter (CSRF protection)');
        return res.redirect('/profile?error=Falha de validação de segurança');
      }
      
      // Limpar o state após uso
      await supabase
        .from('auth_states')
        .delete()
        .eq('user_id', session.user.id);
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Discord token error:', tokenResponse.status, errorData);
      return res.redirect('/auth/login?error=Erro ao obter token do Discord');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Missing access token in Discord response');
      return res.redirect('/auth/login?error=Erro ao obter token do Discord');
    }

    // Registrar tentativa de obtenção de token
    await supabase
      .from('auth_logs')
      .insert({
        user_id: session.user.id,
        action: 'discord_token_obtained',
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        success: true
      });

    // Obter informações do usuário do Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error('Discord user data error:', userResponse.status, errorData);
      return res.redirect('/auth/login?error=Erro ao obter dados do usuário do Discord');
    }

    const userData = await userResponse.json();

    // Adicionar usuário ao servidor Discord (se não estiver)
    let guildMember = null;
    try {
      // Primeiro, verificar se o usuário já está no servidor
      const checkResponse = await fetch(
        `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`,
        {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        }
      );
      
      if (checkResponse.status === 200) {
        guildMember = await checkResponse.json();
        console.log('User already in Discord server');
      } else if (checkResponse.status === 404) {
        // Usuário não está no servidor, adicionar
        const addResponse = await fetch(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            },
            body: JSON.stringify({
              access_token: tokenData.access_token,
              nick: userData.username, // Apelido inicial, opcional
            }),
          }
        );

        if (addResponse.status === 201 || addResponse.status === 204) {
          console.log('User added to Discord server');
          
          // Obter os detalhes do membro adicionado
          const memberResponse = await fetch(
            `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
          
          if (memberResponse.ok) {
            guildMember = await memberResponse.json();
          }
        } else {
          const errorData = await addResponse.json().catch(() => ({}));
          console.error('Failed to add user to Discord server:', addResponse.status, errorData);
        }
      } else {
        console.error('Unexpected response checking guild membership:', checkResponse.status);
      }
    } catch (guildError) {
      console.error('Error interacting with Discord guild API:', guildError);
    }

    // Calcular data de expiração do token
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expires_in || 604800));

    // Determinar formato correto do username
    let discordUsername = userData.username;
    if (userData.discriminator && userData.discriminator !== '0') {
      discordUsername += `#${userData.discriminator}`;
    }

    // Construir URL do avatar
    let avatarUrl = null;
    if (userData.avatar) {
      const format = userData.avatar.startsWith('a_') ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${format}`;
    }

    // Salvar a conexão no banco de dados
    const { error: dbError } = await supabase
      .from('discord_connections')
      .upsert({
        user_id: session.user.id,
        discord_user_id: userData.id,
        discord_username: discordUsername,
        discord_avatar: avatarUrl,
        discord_access_token: tokenData.access_token,
        discord_refresh_token: tokenData.refresh_token || null,
        discord_token_expires_at: expiryDate.toISOString(),
        discord_guild_joined: !!guildMember,
        discord_guild_roles: guildMember?.roles || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

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
        // Verificar se o usuário já tem o cargo
        const hasRole = guildMember?.roles?.includes(subscription.plan.discord_role_id);
        
        if (!hasRole) {
          // Atribuir cargo VIP no Discord
          const roleResponse = await fetch(
            `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${userData.id}/roles/${subscription.plan.discord_role_id}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              },
            }
          );
          
          if (roleResponse.ok) {
            console.log('Discord VIP role assigned successfully');
            
            // Registrar atribuição de cargo
            await supabase
              .from('discord_role_logs')
              .insert({
                user_id: session.user.id,
                discord_user_id: userData.id,
                discord_role_id: subscription.plan.discord_role_id,
                role_name: subscription.plan.name,
                action: 'added',
                reason: 'active_subscription'
              });
          } else {
            console.error('Error assigning Discord role:', roleResponse.status);
          }
        } else {
          console.log('User already has the VIP role');
        }
      }
    } catch (roleError) {
      console.error('Error handling Discord roles:', roleError);
    }

    // Redirecionar para o perfil com mensagem de sucesso
    return res.redirect('/profile?discord=success');

  } catch (error) {
    console.error('Discord callback error:', error);
    return res.redirect('/profile?error=Erro na integração com Discord');
  }
}