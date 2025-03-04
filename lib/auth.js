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
    if (!supabaseAdmin) {
      console.error('Erro: Cliente Supabase Admin não está inicializado');
      console.error('Verifique se SUPABASE_SERVICE_ROLE_KEY está definido em .env.local');
      return false;
    }

    // Primeiro, obtenha o UUID do usuário a partir do discord_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return false;
    }

    if (!userData || !userData.id) {
      console.error('Usuário não encontrado');
      return false;
    }

    // Agora atualize o SteamID usando o UUID correto
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: steamId })
      .eq('id', userData.id);

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