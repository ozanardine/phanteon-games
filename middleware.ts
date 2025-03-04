import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Criar cliente Supabase específico para middleware
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Atualizar a sessão se houver uma
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Middleware auth error:', error);
      return redirectToLogin(req);
    }

    // Verificar autenticação
    if (!session) {
      console.log('No session found, redirecting to login');
      return redirectToLogin(req);
    }

    // Verificar acesso a rotas de administração
    const adminPaths = ['/admin', '/dashboard'];
    const isAdminRoute = adminPaths.some(path => req.nextUrl.pathname.startsWith(path));
    
    if (isAdminRoute) {
      // Verificar se o usuário é administrador
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (!profile?.is_admin) {
        console.log('Non-admin user attempting to access admin route');
        return NextResponse.redirect(new URL('/home', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware execution error:', error);
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = '/auth/login';
  redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

// Expandir os matchers para incluir todas as rotas protegidas
export const config = {
  matcher: [
    '/api/auth/:path*', 
    '/profile',
    '/vip', 
    '/subscriptions',
    '/admin/:path*',
    '/dashboard/:path*',
    '/payment/:path*'
  ],
};