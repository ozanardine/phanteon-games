// src/lib/discord.ts
import { supabase } from './supabase';

/**
 * Inicia o processo de OAuth do Discord
 */
export async function initiateDiscordAuth() {
  try {
    // Obter configurações do processo
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/api/auth/discord/callback`;
    
    // Permissões que vamos solicitar
    const scope = 'identify guilds.join';
    
    // Gerar state para proteção CSRF
    const state = generateRandomString(16);
    
    // Armazenar o state no banco de dados associado ao usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Remover qualquer state anterior
    await supabase
      .from('auth_states')
      .delete()
      .eq('user_id', user.id);
    
    // Inserir o novo state
    await supabase
      .from('auth_states')
      .insert({
        user_id: user.id,
        state: state,
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hora
      });
    
    // Salvar state no sessionStorage também como backup
    sessionStorage.setItem('discord_oauth_state', state);
    
    // URL de autorização do Discord
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&prompt=consent`;
    
    // Redirecionar o usuário para a página de autorização do Discord
    window.location.href = authUrl;
  } catch (error) {
    console.error('Erro ao iniciar autenticação Discord:', error);
    alert('Erro ao conectar com Discord. Por favor, certifique-se de estar logado.');
  }
}

/**
 * Gera uma string aleatória para o state (proteção CSRF)
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  randomValues.forEach(val => result += chars[val % chars.length]);
  return result;
}

/**
 * Verifica se o usuário tem o Discord vinculado
 */
export async function checkDiscordConnection(): Promise<{
  connected: boolean;
  username?: string;
  error?: Error;
}> {
  try {
    // Verificar se o usuário está autenticado antes de fazer a solicitação
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuário não autenticado ao verificar conexão Discord');
      return { connected: false, error: new Error('Usuário não autenticado') };
    }
    
    // Adicionar timestamp para evitar cache
    const timestamp = Date.now();
    const response = await fetch(`/api/auth/discord/status?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      credentials: 'include', // Importante: enviar cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Usuário não autenticado');
      } else {
        throw new Error(`Erro ao verificar conexão com o Discord (Status ${response.status})`);
      }
    }

    const data = await response.json();
    return {
      connected: data.connected,
      username: data.username,
    };
  } catch (error) {
    console.error('Error checking Discord connection:', error);
    return {
      connected: false,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}

/**
 * Desvincula a conta do Discord
 */
export async function unlinkDiscord(): Promise<{
  success: boolean;
  error?: Error;
}> {
  try {
    // Verificar se o usuário está autenticado antes de fazer a solicitação
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: new Error('Usuário não autenticado') };
    }
    
    const response = await fetch('/api/auth/discord/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Importante: enviar cookies
    });

    if (!response.ok) {
      throw new Error(`Erro ao desvincular conta do Discord (Status ${response.status})`);
    }

    const data = await response.json();
    return { success: data.success };
  } catch (error) {
    console.error('Error unlinking Discord:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
    };
  }
}