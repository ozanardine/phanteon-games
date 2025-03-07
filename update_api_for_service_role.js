// Este arquivo contém código que deve ser adaptado para seus arquivos API
// para usar a service_role do Supabase e contornar as políticas RLS

// 1. Primeiro, atualize o arquivo lib/supabase.js para incluir o cliente service_role

/*
  Adicione este código ao seu arquivo lib/supabase.js:
*/

import { createClient } from '@supabase/supabase-js';

// Cliente regular para operações do lado do cliente
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cliente com service_role para operações administrativas em APIs
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 2. Em seguida, atualize seus arquivos de API para usar o cliente supabaseAdmin

/*
  Em pages/api/subscriptions/create.js, pages/api/subscriptions/verify.js, 
  e pages/api/user/update-steam-id.js, substitua:
  
  import { supabase } from '../../../lib/supabase';
  
  Por:
*/

import { supabaseAdmin as supabase } from '../../../lib/supabase';

// 3. Certifique-se de adicionar a variável de ambiente SUPABASE_SERVICE_ROLE_KEY
// ao seu projeto no Vercel e ao seu arquivo .env.local para desenvolvimento:

/*
  .env.local (não comitar este arquivo):
  
  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
  SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
*/

// 4. IMPORTANTE: Nunca exponha a service_role key no navegador
// Ela só deve ser usada em chamadas de API no lado do servidor

// 5. Observações sobre segurança:

// - A service_role key tem permissões administrativas e ignora as políticas RLS
// - Use apenas em APIs do lado do servidor, nunca no lado do cliente
// - Mesmo com service_role, implemente validações em suas APIs para garantir
//   que os usuários só possam acessar seus próprios dados
// - Considere implementar um middleware de autorização para suas APIs
