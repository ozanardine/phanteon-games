import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

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
    // Obter token JWT do NextAuth
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    const isAuthenticated = !!token;
    const path = req.nextUrl.pathname;
    
    // Se for rota de API, deixar passar para tratamento específico
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // Usuário autenticado acessando rotas de auth: redirecionar para home
    if (isAuthenticated && AUTH_ROUTES.some(route => path.startsWith(route))) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    
    // Usuário não autenticado acessando rotas protegidas: redirecionar para login
    if (!isAuthenticated && PROTECTED_ROUTES.some(route => path.startsWith(route))) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Verificar acesso a rotas administrativas
    if (path.startsWith('/admin') && (!isAuthenticated || !token.isAdmin)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    // Outros casos: continuar normalmente
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Em caso de erro no middleware, repassar rota normalmente
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
    '/admin/:path*',
    '/api/auth/:path*'
  ],
};