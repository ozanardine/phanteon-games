// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'cdn.discordapp.com', 
      'avatars.steamstatic.com', 
      'community.cloudflare.steamstatic.com',
      'i.imgur.com',  // Adicionado para suporte a imagens do Imgur
      'media.steampowered.com',  // Adicionado para imagens do Steam
    ],
    // Configurações opcionais para otimização adicional
    formats: ['image/avif', 'image/webp'],
  },
  // Otimizações para o build
  swcMinify: true,
  compiler: {
    // Remover console.logs em produção (exceto erros)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
  // Configurações para solucionar problemas de memória durante o build
  experimental: {
    // Configuração para builds incrementais (melhora performance)
    incrementalCacheHandlerPath: require.resolve('./cache-handler.js'),
    // Se encontrar problemas com o tamanho dos pacotes:
    // outputFileTracingExcludes: {
    //   '*': [
    //     'node_modules/@swc/core-linux-x64-gnu',
    //     'node_modules/@swc/core-linux-x64-musl',
    //     'node_modules/@esbuild/linux-x64',
    //   ],
    // },
  },
}

module.exports = nextConfig