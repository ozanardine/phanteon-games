import { getSession } from 'next-auth/react';
import { supabase, supabaseAdmin, getUserByDiscordId } from './supabase';
import { createOrUpdateUser } from './auth-api';

/**
 * Verifica se o usuário está autenticado, redireciona caso não esteja
 * @param {Object} context - Contexto da requisição Next.js
 * @returns {Promise<Object>} - Sessão do usuário ou redirecionamento
 */
export async function requireAuth(context) {
  const session = await getSession(context);

  // Log para depuração
  console.log('[Auth] requireAuth verificando sessão:', {
    autenticado: !!session,
    usuario: session?.user?.name,
    discord_id: session?.user?.discord_id
  });

  // Se não estiver autenticado, redireciona para a página inicial
  if (!session) {
    return {
      redirect: {
        destination: '/?auth=required',
        permanent: false,
      },
    };
  }

  // Verifica se tem discord_id na sessão
  if (!session.user?.discord_id) {
    console.error('[Auth] Sessão sem discord_id!', { session });
    return {
      redirect: {
        destination: '/api/auth/signin?error=missing_discord_id',
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
  if (!userData || !userData.id) {
    console.error('[Auth] Dados de usuário inválidos para sincronização:', userData);
    return null;
  }

  console.log('[Auth] Iniciando sincronização de usuário:', {
    discord_id: userData.id,
    nome: userData.name
  });

  try {
    // Verifica se o usuário já existe no Supabase
    const existingUser = await getUserByDiscordId(userData.id);
    
    if (existingUser) {
      console.log('[Auth] Usuário já existe, atualizando dados:', {
        id: existingUser.id,
        discord_id: existingUser.discord_id
      });
      
      // Atualiza dados caso necessário
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          discord_avatar: userData.image,
          // Adicionar o campo discord_username
          discord_username: userData.discord_username || userData.discord_global_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
      
      if (error) {
        console.error('[Auth] Erro ao atualizar usuário:', error);
        throw error;
      }
      
      return {
        id: existingUser.id,
        discord_id: userData.id.toString()
      };
    }
    
    // Se não existe, cria um novo usuário
    console.log('[Auth] Usuário não encontrado, criando novo usuário');
    const result = await createOrUpdateUser(userData);
    console.log('[Auth] Usuário criado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('[Auth] Falha ao sincronizar dados do usuário:', error);
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
    console.log('[Auth] Iniciando atualização de Steam ID:', {
      discord_id: discordId,
      steam_id: steamId
    });

    if (!supabaseAdmin) {
      console.error('[Auth] Erro: Cliente Supabase Admin não está inicializado');
      return false;
    }

    // Busca o usuário pelo Discord ID
    const existingUser = await getUserByDiscordId(discordId);
    
    if (!existingUser) {
      console.error('[Auth] Usuário não encontrado para atualizar Steam ID');
      return false;
    }

    console.log('[Auth] Usuário encontrado, atualizando Steam ID:', {
      id: existingUser.id,
      discord_id: existingUser.discord_id
    });

    // Atualiza o SteamID
    const { error } = await supabaseAdmin
      .from('users')
      .update({ steam_id: steamId })
      .eq('id', existingUser.id);

    if (error) {
      console.error('[Auth] Erro ao atualizar SteamID:', error);
      return false;
    }

    console.log('[Auth] Steam ID atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('[Auth] Erro ao atualizar SteamID:', error);
    return false;
  }
}