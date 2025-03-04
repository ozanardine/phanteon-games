import { createClient } from '@supabase/supabase-js';

// Criando cliente do Supabase com variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente para uso no frontend (com chave pública)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    })
  : null;

// Cliente para uso em operações seguras no servidor (com chave de serviço)
// Só deve ser usado em funções API serverless, nunca no cliente
export const supabaseAdmin = supabaseUrl && serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      autoRefreshToken: true,
      persistSession: true
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

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Erro ao buscar assinatura:', error);
    return null;
  }

  return data;
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
}

/**
 * Verifica se o usuário tem uma assinatura ativa
 * @param {string} userId - ID do usuário no sistema
 * @returns {Promise<boolean>} - True se a assinatura está ativa
 */
export async function hasActiveSubscription(userId) {
  if (!supabase) {
    console.error('Cliente Supabase não inicializado');
    return false;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .limit(1);

  if (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }

  return data && data.length > 0;
}