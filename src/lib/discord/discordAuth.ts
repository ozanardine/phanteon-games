// src/lib/discord/discordAuth.ts
import { supabase } from '../supabase/client';

const DISCORD_API_URL = 'https://discord.com/api/v10';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || '';
const DISCORD_VIP_ROLE_ID = process.env.DISCORD_VIP_ROLE_ID || '';
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

/**
 * Processa a autenticação do Discord após o retorno do OAuth
 * @param code O código de autorização retornado pelo Discord
 */
export const handleDiscordAuth = async (code: string) => {
  try {
    // 1. Trocar o código por tokens
    const tokenResponse = await fetch(`${DISCORD_API_URL}/oauth2/token`, {
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

    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter tokens do Discord');
    }

    const tokenData = await tokenResponse.json();

    // 2. Obter informações do usuário
    const userResponse = await fetch(`${DISCORD_API_URL}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Falha ao obter informações do usuário do Discord');
    }

    const userData = await userResponse.json();

    // 3. Obter sessão atual do Supabase para identificar o usuário
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const userId = sessionData.session.user.id;

    // 4. Armazenar tokens e informações do Discord no banco de dados
    const { error: discordAuthError } = await supabase
      .from('discord_auth')
      .upsert({
        user_id: userId,
        discord_id: userData.id,
        discord_username: `${userData.username}`,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });

    if (discordAuthError) {
      throw new Error(`Erro ao salvar autenticação Discord: ${discordAuthError.message}`);
    }

    // 5. Atualizar o perfil do usuário
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        discord_id: userData.id,
        discord_username: `${userData.username}`,
        avatar_url: userData.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          : null,
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
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
  } catch (error) {
    console.error('Erro na autenticação do Discord:', error);
    throw error;
  }
};

/**
 * Sincroniza o status VIP do usuário com o Discord
 * @param userId ID do usuário no sistema
 */
export const syncDiscordVipStatus = async (userId: string) => {
  try {
    // 1. Verificar se o usuário tem assinatura ativa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // 2. Obter informações de autenticação do Discord do usuário
    const { data: discordAuth } = await supabase
      .from('discord_auth')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!discordAuth || !discordAuth.discord_id) {
      console.warn(`Usuário ${userId} não tem conta Discord vinculada`);
      return false;
    }

    const discordId = discordAuth.discord_id;

    // 3. Verificar se o usuário tem VIP ativo
    if (subscription && new Date(subscription.current_period_end) > new Date()) {
      // Adicionar usuário ao servidor Discord (se ainda não estiver)
      try {
        await fetch(`${DISCORD_API_URL}/guilds/${DISCORD_SERVER_ID}/members/${discordId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: discordAuth.access_token,
          }),
        });
      } catch (error) {
        console.error('Erro ao adicionar usuário ao servidor Discord:', error);
      }

      // Adicionar papel VIP ao usuário
      try {
        await fetch(`${DISCORD_API_URL}/guilds/${DISCORD_SERVER_ID}/members/${discordId}/roles/${DISCORD_VIP_ROLE_ID}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          },
        });
        return true;
      } catch (error) {
        console.error('Erro ao adicionar papel VIP ao usuário:', error);
        return false;
      }
    } else {
      // Remover papel VIP se a assinatura não estiver mais ativa
      try {
        await fetch(`${DISCORD_API_URL}/guilds/${DISCORD_SERVER_ID}/members/${discordId}/roles/${DISCORD_VIP_ROLE_ID}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          },
        });
        return true;
      } catch (error) {
        console.error('Erro ao remover papel VIP do usuário:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar status VIP do Discord:', error);
    return false;
  }
};