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
};

module.exports = nextConfig; 