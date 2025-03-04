import { createClient } from '@supabase/supabase-js';

// Criando cliente do Supabase com variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.');
}

if (!serviceRoleKey) {
  console.warn('AVISO: SUPABASE_SERVICE_ROLE_KEY não está definida. Algumas funcionalidades administrativas podem não funcionar corretamente.');
}

// Cliente para uso no frontend (com chave pública)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'phanteon-games-website'
    }
  }
});

// Cliente para uso em operações seguras no servidor (com chave de serviço)
// Só deve ser usado em funções API serverless, nunca no cliente
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-client-info': 'phanteon-games-admin'
        }
      }
    })
  : null;

/**
 * Obtém os dados da assinatura de um usuário
 * @param {string} userId - ID do usuário no sistema
 * @returns {Promise<Object>} - Dados da assinatura ou null
 */
export async function getUserSubscription(userId) {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 = no rows returned (não é realmente um erro)
        return null;
      }
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exceção ao buscar assinatura:', error);
    return null;
  }
}

/**
 * Cria ou atualiza uma assinatura
 * @param {Object} subscriptionData - Dados da assinatura
 * @returns {Promise<Object>} - Resultado da operação
 */
export async function upsertSubscription(subscriptionData) {
  if (!supabaseAdmin) {
    console.error('Cliente Supabase Admin não inicializado');
    throw new Error('Falha ao salvar assinatura: cliente não inicializado');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar/atualizar assinatura:', error);
      throw new Error('Falha ao salvar assinatura');
    }

    return data;
  } catch (error) {
    console.error('Exceção ao salvar assinatura:', error);
    throw error;
  }
}

/**
 * Busca um usuário pelo Discord ID
 * @param {string} discordId - ID do usuário no Discord
 * @returns {Promise<Object>} - Dados do usuário ou null
 */
export async function getUserByDiscordId(discordId) {
  if (!discordId) {
    console.error('Discord ID inválido');
    return null;
  }
  
  try {
    // Garantir que discordId seja uma string
    const discordIdString = discordId.toString();
    
    console.log(`Buscando usuário com discord_id: ${discordIdString}`);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao buscar usuário por Discord ID:', error);
      return null;
    }
    
    if (!data) {
      console.log(`Nenhum usuário encontrado com discord_id: ${discordIdString}`);
      return null;
    }
    
    console.log(`Usuário encontrado: ${data.id}, nome: ${data.name}`);
    return data;
  } catch (error) {
    console.error('Exceção ao buscar usuário por Discord ID:', error);
    return null;
  }
}