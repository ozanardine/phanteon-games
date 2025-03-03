// src/lib/discord.ts
// Este arquivo trata da integração com a API do Discord

/**
 * Inicia o processo de OAuth do Discord
 */
export function initiateDiscordAuth() {
    // Substitua estas constantes pelos seus valores reais
    const DISCORD_CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/api/auth/discord/callback`;
    
    // Permissões que vamos solicitar
    const scope = 'identify guilds.join';
    
    // URL de autorização do Discord
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    // Redirecionar o usuário para a página de autorização do Discord
    window.location.href = authUrl;
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
      const response = await fetch('/api/auth/discord/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Erro ao verificar conexão com o Discord');
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
      });
  
      if (!response.ok) {
        throw new Error('Erro ao desvincular conta do Discord');
      }
  
      return { success: true };
    } catch (error) {
      console.error('Error unlinking Discord:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }