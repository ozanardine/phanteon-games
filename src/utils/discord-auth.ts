import { supabase } from '@/lib/supabase';
import { Provider } from '@supabase/supabase-js';

/**
 * Configuração para autenticação com Discord
 * 
 * 1. Crie um aplicativo no Discord Developer Portal: https://discord.com/developers/applications
 * 2. Configure as URLs de redirecionamento para incluir:
 *    - https://[seu-projeto-supabase].supabase.co/auth/v1/callback
 *    - http://localhost:3000/auth/callback (para desenvolvimento)
 *    - https://[seu-dominio-producao]/auth/callback (para produção)
 * 3. Adicione as credenciais do Discord ao seu projeto Supabase em:
 *    Autenticação -> Provedores -> Discord
 */

export async function signInWithDiscord() {
  return supabase.auth.signInWithOAuth({
    provider: 'discord' as Provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'identify email', // Permissões necessárias
    },
  });
}

export async function unlinkDiscord(userId: string) {
  // Esta função deve ser implementada com um endpoint de API seguro
  // pois requer acesso admin ao Supabase
  const response = await fetch('/api/auth/unlink-discord', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  
  return response.json();
}