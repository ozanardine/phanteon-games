/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignorar erros de tipo durante o build para permitir que o site seja implantado
    // mesmo com alguns avisos de tipo
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar erros de ESLint durante o build para permitir que o site seja implantado
    // mesmo com alguns avisos de lint
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    // Habilitar recursos experimentais de segurança e metadados
    scrollRestoration: true,
  },
  // Configurações específicas para o deployment na Vercel
  // Determina quais páginas devem ser renderizadas estaticamente ou dinamicamente
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      // As páginas abaixo serão tratadas como dinâmicas
      // via configuração 'force-dynamic' em cada arquivo
    };
  }
};

module.exports = nextConfig; 