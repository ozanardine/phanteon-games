// src/lib/discord.ts
// Este arquivo trata da integração com a API do Discord

/**
 * Inicia o processo de OAuth do Discord
 */
export function initiateDiscordAuth() {
  // Obter configurações do processo
  const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/api/auth/discord/callback`;
  
  // Permissões que vamos solicitar
  const scope = 'identify guilds.join';
  
  // Gerar state para proteção CSRF
  const state = generateRandomString(16);
  
  // Salvar state no sessionStorage
  sessionStorage.setItem('discord_oauth_state', state);
  
  // URL de autorização do Discord
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  // Redirecionar o usuário para a página de autorização do Discord
  window.location.href = authUrl;
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