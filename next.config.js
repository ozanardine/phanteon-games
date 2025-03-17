/** @type {import('next').NextConfig} */

// Verificação de ambiente para garantir que as configurações estejam corretas
const API_URL = process.env.API_URL || 'https://api.phanteongames.com';

// Verificar se a URL da API tem o formato correto (sem barra no final)
const formattedApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.discordapp.com', 'steamcdn-a.akamaihd.net'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_RUSTMAPS_API_KEY: process.env.RUSTMAPS_API_KEY,
    NEXT_PUBLIC_API_URL: formattedApiUrl, // URL da API formatada corretamente
    RUST_API_KEY: process.env.RUST_API_KEY || 'tpTM35o1Oe57ktRfbLYButef8gMEmRLwVMYTLwnNDZkGoOeLu1Y3o0K6KC0okI8F',
  },
  // Configuração para otimização de performance
  swcMinify: true,
  
  // Compressão avançada para melhor performance
  compress: true,
  
  // Cache de páginas estáticas
  onDemandEntries: {
    // Período (em ms) para verificar atualizações de páginas
    maxInactiveAge: 60 * 60 * 1000, // 1 hora
    // Número de páginas a manter em cache
    pagesBufferLength: 5,
  },
  
  // Otimização avançada para melhor tempo de carregamento
  experimental: {
    // Habilitar otimizações experimentais com configurações mais seguras
    optimizeCss: true,
    // Melhorias de cache para módulos
    esmExternals: true,
  },
  
  // Configurações para PWA e estratégias de cache
  headers: async () => {
    return [
      {
        // Aplicar essas configurações a todos os caminhos
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache mais longo para arquivos estáticos (imagens, fonts, etc)
        source: '/(.*).(jpg|jpeg|png|webp|avif|svg|ico|woff2|woff|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;