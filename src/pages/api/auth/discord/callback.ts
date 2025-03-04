import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter parâmetros da query
  const { code, error: discordError, state } = req.query;

  // Verificar erros do Discord
  if (discordError) {
    console.error('Erro na autenticação do Discord:', discordError);
    return res.redirect('/profile?error=Discord+auth+error');
  }

  // Verificar código de autorização
  if (!code) {
    return res.redirect('/profile?error=Missing+auth+code');
  }

  try {
    // Criar cliente Supabase para o servidor
    const supabase = createPagesServerClient({ req, res });
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Usando apenas caracteres ASCII aqui
      return res.redirect('/auth/login?error=Session+expired');
    }

    // Trocar o código por tokens de acesso
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
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Erro ao obter token do Discord:', tokenResponse.status);
      return res.redirect('/profile?error=Token+error');
    }

    const tokens = await tokenResponse.json();
    
    // Obter dados do usuário do Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Erro ao obter dados do usuário do Discord:', userResponse.status);
      return res.redirect('/profile?error=User+data+error');
    }

    const userData = await userResponse.json();
    
    // Formatar nome de usuário
    let username = userData.username;
    if (userData.discriminator && userData.discriminator !== '0') {
      username += `#${userData.discriminator}`;
    }
    
    // Formatar URL do avatar
    let avatarUrl = null;
    if (userData.avatar) {
      const format = userData.avatar.startsWith('a_') ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${format}`;
    }
    
    // Calcular expiração do token
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in || 604800);
    
    // Salvar dados na tabela discord_connections
    const { error: saveError } = await supabase
      .from('discord_connections')
      .upsert({
        user_id: session.user.id,
        discord_user_id: userData.id,
        discord_username: username,
        discord_avatar: avatarUrl,
        discord_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (saveError) {
      console.error('Erro ao salvar conexão com Discord:', saveError);
      return res.redirect('/profile?error=Save+connection+error');
    }

    // Atribuir cargo VIP se o usuário tiver assinatura ativa
    await assignDiscordRoleIfSubscribed(supabase, session.user.id, userData.id);

    // Sucesso - redirecionar de volta para o perfil
    return res.redirect('/profile?discord=success');
  } catch (error) {
    console.error('Erro no callback do Discord:', error);
    return res.redirect('/profile?error=Unexpected+error');
  }
}

// Função auxiliar para atribuir cargo VIP no Discord
async function assignDiscordRoleIfSubscribed(supabase, userId, discordId) {
  try {
    // Verificar assinatura ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription?.plan?.discord_role_id) {
      return; // Sem assinatura ativa ou sem role definida
    }

    // Adicionar o usuário ao servidor Discord e atribuir cargo VIP
    await fetch(
      `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${discordId}/roles/${subscription.plan.discord_role_id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    // Registrar adição de cargo
    await supabase
      .from('discord_role_logs')
      .insert({
        user_id: userId,
        discord_user_id: discordId,
        discord_role_id: subscription.plan.discord_role_id,
        role_name: subscription.plan.name,
        action: 'added',
        reason: 'active_subscription'
      });
      
  } catch (error) {
    console.error('Erro ao atribuir cargo VIP no Discord:', error);
  }
}