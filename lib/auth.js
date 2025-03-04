import { getSession } from 'next-auth/react';
import { supabase, supabaseAdmin } from './supabase';
import { createOrUpdateUser } from './auth-api';

/**
 * Verifica se o usuário está autenticado, redireciona caso não esteja
 * @param {Object} context - Contexto da requisição Next.js
 * @returns {Promise<Object>} - Sessão do usuário ou redirecionamento
 */
export async function requireAuth(context) {
  const session = await getSession(context);

  // Se não estiver autenticado, redireciona para a página inicial
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

/**
 * Sincroniza dados do usuário Discord com o Supabase
 * @param {Object} userData - Dados do usuário do Discord
 * @returns {Promise<Object>} - Dados atualizados do usuário
 */
export async function syncUserData(userData) {
  try {
    const result = await createOrUpdateUser(userData);
    return result;
  } catch (error) {
    console.error('Falha ao sincronizar dados do usuário:', error);
    return null;
  }
}

/**
 * Atualiza o Steam ID do usuário
 * @param {string} discordId - ID do usuário no Discord
 * @param {string} steamId - SteamID do usuário
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function updateSteamId(discordId, steamId) {
  try {
    // Atualiza o SteamID do usuário no Supabase usando o cliente admin
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: steamId })
      .eq('discord_id', discordId);

    if (error) {
      console.error('Erro ao atualizar SteamID:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar SteamID:', error);
    return false;
  }
}