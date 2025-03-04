// src/lib/discord.ts
import { signIn } from 'next-auth/react';
import { supabase } from './supabase';

/**
 * Inicia o processo de OAuth do Discord com proteção CSRF
 */
export async function initiateDiscordAuth(redirectUrl?: string) {
  try {
    // Usar diretamente o signIn do NextAuth para redirecionar para o fluxo OAuth do Discord
    await signIn('discord', { callbackUrl: redirectUrl || window.location.href });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao iniciar autenticação Discord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao conectar com Discord'
    };
  }
}

/**
 * Verifica se o usuário tem o Discord vinculado
 */
export async function checkDiscordConnection() {
  try {
    // Verificar no banco de dados Supabase a conexão com o Discord
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session) {
      return { connected: false };
    }
    
    const { data, error } = await supabase
      .from('discord_connections')
      .select('discord_username, discord_avatar')
      .eq('user_id', session.session.user.id)
      .single();
    
    if (error || !data) {
      return { connected: false };
    }
    
    return { 
      connected: true, 
      username: data.discord_username,
      avatar: data.discord_avatar
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao desvincular conta do Discord');
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao desvincular Discord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}