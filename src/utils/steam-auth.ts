import { supabase } from '@/lib/supabase';
import { Provider } from '@supabase/supabase-js';

/**
 * Configuração para autenticação com Steam
 * 
 * 1. Obtenha uma API Key do Steam Web API: https://steamcommunity.com/dev/apikey
 * 2. Configure as URLs de redirecionamento no Supabase para incluir:
 *    - http://localhost:3000/auth/callback (para desenvolvimento)
 *    - https://[seu-dominio-producao]/auth/callback (para produção)
 * 3. Adicione as credenciais do Steam ao seu projeto Supabase em:
 *    Autenticação -> Provedores -> Steam
 */

export async function signInWithSteam() {
  return supabase.auth.signInWithOAuth({
    // Using type assertion to bypass the Provider type check
    provider: 'steam' as Provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function unlinkSteam(userId: string) {
  // Esta função deve ser implementada com um endpoint de API seguro
  // pois requer acesso admin ao Supabase
  const response = await fetch('/api/auth/unlink-steam', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
  
  return response.json();
}