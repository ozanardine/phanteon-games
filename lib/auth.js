import { getSession } from 'next-auth/react';
import { supabase, supabaseAdmin } from './supabase';

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

  // Verificar os dados recebidos para depuração
  console.log('Dados do usuário recebidos:', { id, email, name, image });

  if (!supabaseAdmin) {
    console.error('Erro: Cliente Supabase Admin não está inicializado');
    console.error('Verifique se SUPABASE_SERVICE_ROLE_KEY está definido em .env.local');
    return null;
  }

  try {
    // Verifica se o usuário já existe usando o cliente admin
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', id)
      .single();

    console.log('Resultado da busca por usuário existente:', { existingUser, error: fetchError });

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', fetchError.message);
      return null;
    }
    
    // Se o usuário não existir ou precisar ser atualizado
    if (!existingUser) {
      // Cria um novo usuário usando o cliente admin
      const userData = {
        discord_id: id,
        email,
        name,
        discord_avatar: image,
        steam_id: null, // Será preenchido depois pelo usuário
      };
      
      console.log('Criando novo usuário com dados:', userData);

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar usuário:', insertError);
        console.error('Detalhes do erro:', JSON.stringify(insertError));
        return null;
      }
      return newUser;
    } else {
      // Atualiza o usuário existente usando o cliente admin
      console.log('Atualizando usuário existente:', existingUser.id);
      
      const updateData = {
        email,
        name,
        discord_avatar: image,
        updated_at: new Date()
      };
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('discord_id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        console.error('Detalhes do erro:', JSON.stringify(updateError));
        return existingUser; // Retorna os dados existentes em caso de falha
      }
      return updatedUser;
    }
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    console.error('Detalhes do erro:', JSON.stringify(error));
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