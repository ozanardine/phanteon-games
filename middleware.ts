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

// Rotas que requerem privilégios de administrador
const ADMIN_ROUTES = [
  '/admin',
  '/dashboard'
];

// Rotas de autenticação (não devem ser acessadas quando já autenticado)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Inicializar o cliente Supabase
    const supabase = createMiddlewareClient({ req, res });
    
    // Verificar se há uma sessão ativa
    const { data: { session } } = await supabase.auth.getSession();
    
    const path = req.nextUrl.pathname;
    
    // Estamos em uma rota protegida?
    const isProtectedRoute = PROTECTED_ROUTES.some(route => path.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some(route => path.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some(route => path.startsWith(route));
    
    // Caso 1: Usuário está acessando rota de autenticação estando já autenticado
    if (session && isAuthRoute) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    
    // Caso 2: Usuário não autenticado tentando acessar rota protegida
    if (!session && (isProtectedRoute || isAdminRoute)) {
      // Redirecionar para login e guardar URL de origem
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Caso 3: Verificar permissão de administrador para rotas administrativas
    if (session && isAdminRoute) {
      // Buscar perfil do usuário para verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      // Se não for admin, redirecionar para home
      if (!profile?.is_admin) {
        return NextResponse.redirect(new URL('/home', req.url));
      }
    }
    
    // Continuar normalmente para todos os outros casos
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Em caso de erro, redirecionar para login por segurança
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
}

export const config = {
  matcher: [
    // Rotas protegidas
    '/profile/:path*',
    '/vip/:path*',
    '/subscriptions/:path*',
    '/payment/:path*',
    // Rotas de admin
    '/admin/:path*',
    '/dashboard/:path*',
    // Rotas de autenticação
    '/auth/:path*'
  ],
};