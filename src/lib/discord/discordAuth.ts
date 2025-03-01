// src/lib/discord/discordAuth.ts
import { supabase } from '../supabase/client';
import { DiscordToken, DiscordUser } from '@/types/auth';

const DISCORD_API_URL = 'https://discord.com/api/v10';
const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || '';
const DISCORD_VIP_ROLE_ID = process.env.DISCORD_VIP_ROLE_ID || '';
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

/**
 * Gera a URL para autorização do Discord
 */
export const getDiscordAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email guilds.join',
  });

  return `${DISCORD_API_URL}/oauth2/authorize?${params.toString()}`;
};

/**
 * Troca o código de autorização por tokens de acesso e atualização
 * @param code O código de autorização retornado pelo Discord
 */
export const getDiscordTokens = async (code: string): Promise<DiscordToken> => {
  const response = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`Failed to get Discord tokens: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

/**
 * Obtém informações do usuário Discord a partir do token de acesso
 * @param accessToken Token de acesso do Discord
 */
export const getDiscordUser = async (accessToken: string): Promise<DiscordUser> => {
  const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`Failed to get Discord user: ${JSON.stringify(errorData)}`);
  }

  return response.json();
};

/**
 * Processa a autenticação do Discord após o retorno do OAuth
 * @param code O código de autorização retornado pelo Discord
 */
export const handleDiscordAuth = async (code: string) => {
  try {
    // 1. Trocar o código por tokens
    const tokenData = await getDiscordTokens(code);

    // 2. Obter informações do usuário
    const userData = await getDiscordUser(tokenData.access_token);

    // 3. Obter sessão atual do Supabase para identificar o usuário
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Error getting session: ${sessionError.message}`);
    }

    // Se não houver usuário autenticado, tentar autenticar com o Discord
    if (!sessionData.session?.user) {
      // Verificar se existe um usuário com esse ID do Discord
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('discord_id', userData.id)
        .maybeSingle();

      if (existingProfile) {
        // Usuário já existe, fazer login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: existingProfile.email,
          password: `discord_${userData.id}`,  // Senha especial para contas Discord
        });

        if (authError) {
          // Se não conseguir fazer login (talvez a senha tenha mudado), tentar recriar
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: existingProfile.email,
            password: `discord_${userData.id}`,
          });

          if (signUpError) {
            throw new Error(`Error recreating Discord user account: ${signUpError.message}`);
          }
        }
      } else {
        // Novo usuário, criar conta
        // Gerar email único baseado no ID do Discord se o usuário não fornecer email
        const email = userData.email || `discord_${userData.id}@phanteongames.com`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: `discord_${userData.id}`,  // Senha especial para contas Discord
          options: {
            data: {
              discord_id: userData.id,
              discord_username: userData.username,
            }
          }
        });

        if (signUpError) {
          throw new Error(`Error creating Discord user account: ${signUpError.message}`);
        }

        // Criar perfil para o novo usuário
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email,
              discord_id: userData.id,
              discord_username: userData.username,
              avatar_url: userData.avatar 
                ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
                : null,
              created_at: new Date().toISOString()
            });

          if (profileError) {
            throw new Error(`Error creating profile: ${profileError.message}`);
          }
        }
      }

      // Obter a sessão atualizada
      const { data: newSessionData, error: newSessionError } = await supabase.auth.getSession();
      
      if (newSessionError) {
        throw new Error(`Error getting updated session: ${newSessionError.message}`);
      }
      
      if (!newSessionData.session?.user) {
        throw new Error('User authentication failed');
      }
      
      // Atualizar o userId para o usuário recém-autenticado
      const userId = newSessionData.session.user.id;

      // 4. Armazenar tokens e informações do Discord no banco de dados
      const { error: discordAuthError } = await supabase
        .from('discord_auth')
        .upsert({
          user_id: userId,
          discord_id: userData.id,
          discord_username: userData.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          created_at: new Date().toISOString(),
        });

      if (discordAuthError) {
        throw new Error(`Error saving Discord authentication: ${discordAuthError.message}`);
      }

      // 5. Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          discord_id: userData.id,
          discord_username: userData.username,
          avatar_url: userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : null,
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Error updating profile: ${profileError.message}`);
      }

      // 6. Verificar se o usuário tem VIP e adicionar ao servidor/papel
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscriptionData) {
        await syncDiscordVipStatus(userId);
      }

      return {
        success: true,
        discordId: userData.id,
        discordUsername: userData.username,
      };
    } else {
      // Usuário já está autenticado, só atualizar as informações do Discord
      const userId = sessionData.session.user.id;

      // 4. Armazenar tokens e informações do Discord no banco de dados
      const { error: discordAuthError } = await supabase
        .from('discord_auth')
        .upsert({
          user_id: userId,
          discord_id: userData.id,
          discord_username: userData.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          created_at: new Date().toISOString(),
        });

      if (discordAuthError) {
        throw new Error(`Error saving Discord authentication: ${discordAuthError.message}`);
      }

      // 5. Atualizar o perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          discord_id: userData.id,
          discord_username: userData.username,
          avatar_url: userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : null,
        })
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Error updating profile: ${profileError.message}`);
      }

      // 6. Verificar se o usuário tem VIP e adicionar ao servidor/papel
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (subscriptionData) {
        await syncDiscordVipStatus(userId);
      }

      return {
        success: true,
        discordId: userData.id,
        discordUsername: userData.username,
      };
    }
  } catch (error) {
    console.error('Error in Discord authentication:', error);
    throw error;
  }
};

/**
 * Adiciona um usuário ao servidor Discord usando o bot
 * @param discordId ID do usuário no Discord
 * @param accessToken Token de acesso do usuário
 */
export const addUserToDiscordServer = async (discordId: string, accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(`${DISCORD_API_URL}/guilds/${DISCORD_SERVER_ID}/members/${discordId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    });

    return response.status === 201 || response.status === 204;
  } catch (error) {
    console.error('Error adding user to Discord server:', error);
    return false;
  }
};

/**
 * Adiciona ou remove papel VIP de um usuário no Discord
 * @param discordId ID do usuário no Discord
 * @param addRole Verdadeiro para adicionar, falso para remover
 */
export const modifyDiscordVipRole = async (discordId: string, addRole: boolean): Promise<boolean> => {
  try {
    const response = await fetch(`${DISCORD_API_URL}/guilds/${DISCORD_SERVER_ID}/members/${discordId}/roles/${DISCORD_VIP_ROLE_ID}`, {
      method: addRole ? 'PUT' : 'DELETE',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });

    return response.status === 204;
  } catch (error) {
    console.error(`Error ${addRole ? 'adding' : 'removing'} VIP role:`, error);
    return false;
  }
};

/**
 * Sincroniza o status VIP do usuário com o Discord
 * @param userId ID do usuário no sistema
 */
export const syncDiscordVipStatus = async (userId: string): Promise<boolean> => {
  try {
    // 1. Verificar se o usuário tem assinatura ativa
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') { // PGRST116 = Not Found
      console.error('Error checking subscription:', subscriptionError);
      return false;
    }

    // 2. Obter informações de autenticação do Discord do usuário
    const { data: discordAuth, error: discordAuthError } = await supabase
      .from('discord_auth')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (discordAuthError) {
      console.warn(`User ${userId} doesn't have a linked Discord account`);
      return false;
    }

    const discordId = discordAuth.discord_id;
    const isSubscriptionActive = !!subscription && new Date(subscription.current_period_end) > new Date();

    // 3. Adicionar usuário ao servidor Discord (se ainda não estiver)
    try {
      await addUserToDiscordServer(discordId, discordAuth.access_token);
    } catch (error) {
      console.error('Error adding user to Discord server:', error);
    }

    // 4. Adicionar ou remover papel VIP com base no status da assinatura
    return await modifyDiscordVipRole(discordId, isSubscriptionActive);

  } catch (error) {
    console.error('Error syncing Discord VIP status:', error);
    return false;
  }
};

/**
 * Atualiza os tokens do Discord quando expirados
 * @param userId ID do usuário no sistema
 */
export const refreshDiscordTokens = async (userId: string): Promise<boolean> => {
  try {
    // Obter tokens atuais
    const { data: discordAuth, error: discordAuthError } = await supabase
      .from('discord_auth')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (discordAuthError) {
      console.error('Error getting Discord auth data:', discordAuthError);
      return false;
    }

    // Verificar se o token ainda é válido
    if (new Date(discordAuth.expires_at) > new Date()) {
      return true; // Token ainda válido
    }

    // Atualizar token
    const response = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: discordAuth.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Discord token: ${response.statusText}`);
    }

    const tokenData = await response.json();

    // Atualizar tokens no banco de dados
    const { error: updateError } = await supabase
      .from('discord_auth')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Error updating Discord tokens: ${updateError.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error refreshing Discord tokens:', error);
    return false;
  }
};