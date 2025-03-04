// middleware.ts - Versão simplificada e mais robusta
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const PROTECTED_ROUTES = [
  '/profile',
  '/vip',
  '/subscriptions',
  '/payment'
];

// Rotas de autenticação
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export async function middleware(req: NextRequest) {
  try {
    // Criar response padrão
    const res = NextResponse.next();
    
    // Criar cliente Supabase
    const supabase = createMiddlewareClient({ req, res });
    
    // Verificar sessão de forma simples
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    
    const path = req.nextUrl.pathname;
    
    // Se for rota de API, deixar passar para tratamento específico
    if (path.startsWith('/api/')) {
      return res;
    }
    
    // Usuário autenticado acessando rotas de auth: redirecionar para home
    if (session && AUTH_ROUTES.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    
    // Usuário não autenticado acessando rotas protegidas: redirecionar para login
    if (!session && PROTECTED_ROUTES.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Outros casos: continuar normalmente
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Em caso de erro no middleware, repassar rota normalmente
    // para evitar loops infinitos ou bloqueios
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/vip/:path*',
    '/subscriptions/:path*',
    '/payment/:path*',
    '/auth/:path*',
    '/api/auth/:path*'
  ],
};