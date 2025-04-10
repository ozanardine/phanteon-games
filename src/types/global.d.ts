// Declarações de tipos globais para o projeto

// Declaração para o React
declare module 'react' {
  export * from 'react';
}

// Declaração para o Next.js
declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
}

declare module 'next/link' {
  import { ComponentProps } from 'react';
  
  export interface LinkProps extends ComponentProps<'a'> {
    href: string;
    prefetch?: boolean;
  }
  
  export default function Link(props: LinkProps): JSX.Element;
}

declare module 'next/image' {
  import { ComponentProps } from 'react';
  
  export interface ImageProps extends ComponentProps<'img'> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    quality?: number;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
  }
  
  export default function Image(props: ImageProps): JSX.Element;
}

declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}

// Declaração para o Next-themes
declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    themes?: string[];
  }
  
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
}

// Variáveis de ambiente
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY: string;
    NEXT_PUBLIC_BATTLEMETRICS_API_KEY: string;
    NEXT_PUBLIC_SITE_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
} 