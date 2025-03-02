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
  // Limitar a quantidade de recursos para o build na Vercel
  experimental: {
    // Resolver problemas de memória com a exclusão de pacotes grandes
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
        'node_modules/typescript',
      ],
    },
  },
  
  // Excluir API routes da geração estática
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // Filtrar as páginas para remover rotas de API da exportação estática
    const filteredPaths = {};
    
    for (const [path, config] of Object.entries(defaultPathMap)) {
      // Excluir rotas de API e rotas dinâmicas específicas que estão causando problemas
      if (!path.includes('/api/') && 
          !path.includes('/servers/[id]/events') &&
          !path.includes('/servers/[id]/players') &&
          !path.includes('/servers/[id]/plugins') &&
          !path.includes('/servers/[id]/sync') &&
          !path.includes('/servers/battlemetrics/[id]')) {
        filteredPaths[path] = config;
      }
    }
    
    return filteredPaths;
  },
};

module.exports = nextConfig;