import { createClient } from '@supabase/supabase-js';

// Criando cliente do Supabase com variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.');
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
  : supabase; // Fallback para o cliente regular se a chave de serviço não estiver disponível

/**
 * Busca um usuário pelo Discord ID
 * @param {string} discordId - ID do usuário no Discord
 * @returns {Promise<Object>} - Dados do usuário ou null
 */
export async function getUserByDiscordId(discordId) {
  if (!discordId) {
    console.error('[Supabase] Discord ID inválido');
    return null;
  }
  
  try {
    // Garantir que discordId seja uma string
    const discordIdString = discordId.toString();
    
    console.log(`[Supabase] Buscando usuário com discord_id: ${discordIdString}`);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();
    
    if (error) {
      console.error('[Supabase] Erro ao buscar usuário por Discord ID:', error);
      return null;
    }
    
    if (!data) {
      console.log(`[Supabase] Nenhum usuário encontrado com discord_id: ${discordIdString}`);
      return null;
    }
    
    console.log(`[Supabase] Usuário encontrado: ${data.id}, nome: ${data.name}`);
    return data;
  } catch (error) {
    console.error('[Supabase] Exceção ao buscar usuário por Discord ID:', error);
    return null;
  }
}

/**
 * Obtém os dados da assinatura de um usuário
 * @param {string} userId - ID do usuário no sistema
 * @returns {Promise<Object>} - Dados da assinatura ou null
 */
export async function getUserSubscription(userId) {
  if (!userId) {
    console.error('[Supabase] User ID inválido');
    return null;
  }

  try {
    console.log(`[Supabase] Buscando assinatura para user_id: ${userId}`);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Erro ao buscar assinatura:', error);
      return null;
    }

    if (!data) {
      console.log(`[Supabase] Nenhuma assinatura ativa encontrada para user_id: ${userId}`);
      return null;
    }
    
    console.log(`[Supabase] Assinatura encontrada: ${data.id}, plano: ${data.plan_name}`);
    return data;
  } catch (error) {
    console.error('[Supabase] Exceção ao buscar assinatura:', error);
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
    console.error('[Supabase] Cliente Supabase Admin não inicializado');
    throw new Error('Falha ao salvar assinatura: cliente não inicializado');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Erro ao criar/atualizar assinatura:', error);
      throw new Error('Falha ao salvar assinatura');
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Exceção ao salvar assinatura:', error);
    throw error;
  }
}