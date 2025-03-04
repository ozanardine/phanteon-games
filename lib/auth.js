import { getSession } from 'next-auth/react';
import { supabase } from './supabase';

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
  const { id, email, name, image } = userData;

  if (!supabase) {
    console.error('Erro: Cliente Supabase não está inicializado');
    return null;
  }

  try {
    // Verifica se o usuário já existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', fetchError.message);
      return null;
    }
    // Se o usuário não existir ou precisar ser atualizado
    if (!existingUser) {
      // Cria um novo usuário
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            discord_id: id,
            email,
            name,
            discord_avatar: image,
            steam_id: null, // Será preenchido depois pelo usuário
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar usuário:', insertError);
        return null;
      }
      return newUser;
    } else {
      // Atualiza o usuário existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email,
          name,
          discord_avatar: image,
          updated_at: new Date(),
        })
        .eq('discord_id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        return existingUser; // Retorna os dados existentes em caso de falha
      }
      return updatedUser;
    }
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
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
    // Atualiza o SteamID do usuário no Supabase
    const { error } = await supabase
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