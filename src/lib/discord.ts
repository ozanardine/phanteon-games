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
    // Primeiro verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Checking Discord connection failed: No active session');
      return { connected: false };
    }
    
    // Adicionar um timestamp para evitar cache e header de autorização explícito
    const timestamp = Date.now();
    const response = await fetch(`/api/auth/discord/status?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Authorization': `Bearer ${session.access_token}`
      },
      credentials: 'include', // Crucial para enviar cookies
    });

    // Tratar problemas comuns
    if (response.status === 401 || response.status === 403) {
      console.log('Discord check auth failed with status:', response.status);
      return { connected: false };
    }

    if (!response.ok) {
      console.error('Discord check failed with status:', response.status);
      return { connected: false };
    }

    // Processar resposta
    const data = await response.json();
    return {
      connected: data.connected,
      username: data.username,
      avatar: data.avatar
    };
  } catch (error) {
    console.error('Discord connection check error:', error);
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