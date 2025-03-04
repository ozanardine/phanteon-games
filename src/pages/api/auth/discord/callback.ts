// src/pages/api/auth/discord/callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { createHash } from 'crypto';

// Função para encriptar tokens sensíveis antes de armazenar
function encryptToken(token: string): string {
  // Em produção, substitua por uma técnica mais robusta de criptografia
  // Esta é apenas uma forma básica de não armazenar o token em texto simples
  const hash = createHash('sha256');
  const salt = process.env.TOKEN_ENCRYPTION_KEY || 'phanteon-games-salt';
  return hash.update(token + salt).digest('hex').substring(0, 32); // Armazenar apenas hash parcial como referência
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Criar cliente Supabase específico para o servidor
  const supabase = createPagesServerClient({ req, res });
  
  // Verificar se é uma requisição GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter o código de autorização da query string
  const { code, error: discordError, state } = req.query;

  // Primeiro verificar se o usuário está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.error('No active session found in Discord callback');
    return res.redirect('/auth/login?error=Sessao%20expirada%20ou%20invalida.%20Faca%20login%20novamente');
  }

  // Se houver erro no retorno do Discord
  if (discordError) {
    console.error('Discord auth error:', discordError);
    return res.redirect(`/auth/login?error=${encodeURIComponent('Erro na autenticacao do Discord: ' + discordError)}`);
  }

  // Se não houver código
  if (!code) {
    return res.redirect('/auth/login?error=Codigo%20de%20autorizacao%20ausente');
  }

  try {
    // Verificar CSRF state se presente - Versão melhorada
    if (!state || typeof state !== 'string') {
      console.error('Missing state parameter (CSRF protection)');
      return res.redirect('/profile?error=Erro%20de%20seguranca%3A%20Parametro%20state%20ausente');
    }
    
    // Buscar o state armazenado
    const { data: storedState, error: stateError } = await supabase
      .from('auth_states')
      .select('state, expires_at')
      .eq('user_id', session.user.id)
      .eq('state', state)  // Verificamos diretamente se o state corresponde
      .single();
    
    // Verificar se o state é válido e não expirou
    if (stateError || !storedState) {
      console.error('Invalid state parameter (CSRF protection):', stateError);
      return res.redirect('/profile?error=Erro%20de%20seguranca%3A%20Estado%20invalido');
    }
    
    // Verificar expiração
    if (new Date(storedState.expires_at) < new Date()) {
      console.error('Expired state token');
      
      // Limpar o state expirado
      await supabase
        .from('auth_states')
        .delete()
        .eq('user_id', session.user.id);
        
      return res.redirect('/profile?error=Token%20expirado.%20Tente%20novamente.');
    }
    
    // Limpar o state após uso para evitar replay attacks
    await supabase
      .from('auth_states')
      .delete()
      .eq('user_id', session.user.id);

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
      console.error('Discord token error status:', tokenResponse.status);
      return res.redirect('/profile?error=Erro%20ao%20obter%20token%20do%20Discord');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Missing access token in Discord response');
      return res.redirect('/profile?error=Erro%20ao%20obter%20token%20do%20Discord');
    }

    // Registrar tentativa de obtenção de token (sem expor o token real nos logs)
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
      console.error('Discord user data error status:', userResponse.status);
      return res.redirect('/profile?error=Erro%20ao%20obter%20dados%20do%20usuario%20do%20Discord');
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
              nick: userData.username,
            }),
          }
        );

        if (addResponse.status === 201 || addResponse.status === 204) {
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
        }
      }
    } catch (guildError) {
      console.error('Error interacting with Discord guild API');
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

    // Gerar hashes para armazenamento seguro dos tokens
    const accessTokenHash = encryptToken(tokenData.access_token);
    const refreshTokenHash = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;

    // Salvar a conexão no banco de dados
    const { error: dbError } = await supabase
      .from('discord_connections')
      .upsert({
        user_id: session.user.id,
        discord_user_id: userData.id,
        discord_username: discordUsername,
        discord_avatar: avatarUrl,
        discord_access_token: accessTokenHash, // Armazenar hash em vez do token real
        discord_refresh_token: refreshTokenHash, // Armazenar hash em vez do token real
        discord_token_expires_at: expiryDate.toISOString(),
        discord_guild_joined: !!guildMember,
        discord_guild_roles: guildMember?.roles || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database error saving Discord connection');
      return res.redirect('/profile?error=Erro%20ao%20salvar%20conexao%20com%20Discord');
    }

    // Verificar assinatura atual e atribuir cargo no Discord
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
          }
        }
      }
    } catch (roleError) {
      console.error('Error handling Discord roles');
    }

    // Redirecionar para o perfil com mensagem de sucesso
    return res.redirect('/profile?discord=success');

  } catch (error) {
    console.error('Discord callback error');
    return res.redirect('/profile?error=Erro%20na%20integracao%20com%20Discord');
  }
}