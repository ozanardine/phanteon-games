import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Atualiza o objeto de cookies caso tenha uma sessão
  await supabase.auth.getSession()
  
  return res
}

// Executar o middleware nas páginas que requerem autenticação 
// e no callback de autenticação OAuth
export const config = {
  matcher: ['/perfil/:path*', '/auth/callback'],
} 