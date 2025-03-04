import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Criar cliente Supabase específico para middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Atualizar a sessão se houver uma
  const { data: { session } } = await supabase.auth.getSession();

  // Logging para depuração
  console.log('Middleware session check:', session?.user?.id || 'No session');
  
  return res;
}

// Executar o middleware em todas as rotas que queremos verificação de autenticação
export const config = {
  matcher: ['/api/auth/:path*', '/profile', '/vip', '/subscriptions'],
};