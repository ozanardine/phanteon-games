import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validação de configuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!');
}

// Cliente com chave anônima (para frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Cliente com chave de serviço (para operações admin)
export const supabaseAdmin = serviceRoleKey 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : supabase;

/**
 * Busca usuário pelo Discord ID
 */
export async function getUserByDiscordId(discordId) {
  if (!discordId) {
    console.error('Discord ID inválido');
    return null;
  }
  
  try {
    // Garantir que seja string
    const discordIdString = discordId.toString();
    
    // Buscar usuário
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
    
    return data;
  } catch (error) {
    console.error('Exceção ao buscar usuário por Discord ID:', error);
    return null;
  }
}

/**
 * Obtém assinatura ativa de um usuário
 */
export async function getUserSubscription(userId) {
  if (!userId) {
    return null;
  }

  try {
    // Função auxiliar para tentar diferentes estratégias de busca
    async function tryQuery(field, value) {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq(field, value)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!error) return { data, error: null };
        return { data: null, error };
      } catch (e) {
        return { data: null, error: e };
      }
    }
    
    // Lista de campos para tentar, em ordem de prioridade
    const fieldsToTry = [
      ['status', 'active'],
      ['payment_status', 'active'],
      ['is_active', true]
    ];
    
    // Tenta cada estratégia até encontrar uma que funcione
    for (const [field, value] of fieldsToTry) {
      const { data, error } = await tryQuery(field, value);
      if (error) {
        if (error.code === '42703') {
          // Coluna não existe, tenta a próxima estratégia
          continue;
        }
        console.error(`Erro ao buscar assinatura usando ${field}:`, error);
      }
      
      if (data) {
        return data;
      }
    }
    
    // Como último recurso, busca qualquer assinatura não expirada
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (fallbackError) {
      console.error('Erro na consulta fallback:', fallbackError);
      return null;
    }
    
    return fallbackData;
  } catch (error) {
    console.error('Exceção ao buscar assinatura:', error);
    return null;
  }
}