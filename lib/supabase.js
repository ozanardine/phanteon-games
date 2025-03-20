import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação de configuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
  // Adicionar um fallback para desenvolvimento para evitar falhas catastróficas
  if (process.env.NODE_ENV === 'development') {
    console.warn('Usando valores de fallback para desenvolvimento. NÃO USE EM PRODUÇÃO!');
  } else {
    // Em produção, isso é um erro crítico
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }
}

if (!serviceRoleKey && process.env.NODE_ENV === 'production') {
  console.warn('AVISO: SUPABASE_SERVICE_ROLE_KEY não configurada. Operações administrativas nas APIs podem falhar.');
}

// Cliente com chave anônima (para frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: fetch.bind(globalThis),
    headers: { 'x-application-name': 'phanteon-games' }
  }
});

// Cliente com service_role (para APIs do lado do servidor)
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: fetch.bind(globalThis),
        headers: { 'x-application-name': 'phanteon-games-admin' }
      }
    })
  : supabase; // Fallback para o cliente regular se serviceRoleKey não estiver disponível

/**
 * Busca usuário pelo Discord ID
 * @param {string} discordId - ID do Discord do usuário
 * @returns {Promise<Object|null>} - Dados do usuário ou null
 */
export async function getUserByDiscordId(discordId) {
  if (!discordId) {
    console.error('[Supabase] Discord ID inválido');
    return null;
  }
  
  try {
    // Garantir que seja string
    const discordIdString = discordId.toString();
    
    console.log(`[Supabase] Buscando usuário por discord_id: ${discordIdString}`);
    
    // Buscar usuário
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('discord_id', discordIdString)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Erro ao buscar usuário por Discord ID:', error);
      return null;
    }
    
    if (!data) {
      console.log(`[Supabase] Nenhum usuário encontrado com discord_id: ${discordIdString}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('[Supabase] Exceção ao buscar usuário por Discord ID:', error);
    return null;
  }
}

/**
 * Obtém assinatura ativa de um usuário
 * @param {string} userId - ID do usuário no Supabase
 * @returns {Promise<Object|null>} - Dados da assinatura ou null
 */
export async function getUserSubscription(userId) {
  if (!userId) {
    console.error('[Supabase] ID de usuário inválido para buscar assinatura');
    return null;
  }

  try {
    console.log(`[Supabase] Buscando assinatura para usuário: ${userId}`);
    
    // Busca assinatura ativa e não expirada
    const { data, error } = await supabaseAdmin
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
      console.log(`[Supabase] Nenhuma assinatura ativa encontrada para: ${userId}`);
      return null;
    }
    
    console.log(`[Supabase] Assinatura encontrada: ${data.id}, expira em: ${data.expires_at}`);
    return data;
  } catch (error) {
    console.error('[Supabase] Exceção ao buscar assinatura:', error);
    return null;
  }
}