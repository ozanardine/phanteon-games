import { NextResponse } from 'next/server'

declare module 'next/server' {
  export interface NextRequest extends Request {
    nextUrl: URL
  }
  
  export interface NextResponseType {
    json: (body: any, init?: ResponseInit) => NextResponse
    redirect: (url: string | URL) => NextResponse
    next: () => NextResponse
    rewrite: (url: string | URL) => NextResponse
    // Adicione outros métodos conforme necessário
  }
  
  export const NextResponse: NextResponseType
} 