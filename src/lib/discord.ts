// src/lib/discord.ts
import { supabase } from './supabase';

/**
 * Inicia o processo de OAuth do Discord com proteção CSRF
 */
export async function initiateDiscordAuth() {
  try {
    // Obter configurações do processo
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/api/auth/discord/callback`;
    
    // Gerar state aleatório para proteção CSRF (32 caracteres)
    const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Armazenar o state no localStorage
    localStorage.setItem('discord_oauth_state', state);
    
    // URL de autorização do Discord
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=identify%20guilds.join&state=${state}&prompt=consent`;
    
    // Redirecionar o usuário para a página de autorização do Discord
    window.location.href = authUrl;
  } catch (error) {
    console.error('Erro ao iniciar autenticação Discord:', error);
    alert('Erro ao conectar com Discord. Por favor, tente novamente mais tarde.');
  }
}

/**
 * Verifica se o usuário tem o Discord vinculado
 */
export async function checkDiscordConnection() {
  try {
    const timestamp = Date.now(); // Para evitar cache
    const response = await fetch(`/api/auth/discord/status?t=${timestamp}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Auth error in Discord check: user not authenticated');
        return { connected: false };
      } else {
        console.error(`Error checking Discord: ${response.status}`);
        return { connected: false };
      }
    }

    const data = await response.json();
    return {
      connected: data.connected,
      username: data.username,
      avatar: data.avatar
    };
  } catch (error) {
    console.error('Exception checking Discord connection:', error);
    return { connected: false };
  }
}

/**
 * Desvincula a conta do Discord
 */
export async function unlinkDiscord() {
  try {
    const response = await fetch('/api/auth/discord/unlink', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao desvincular conta do Discord');
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao desvincular Discord:', error);
    return { success: false };
  }
}