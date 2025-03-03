// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'cdn.discordapp.com', 
      'avatars.steamstatic.com', 
      'community.cloudflare.steamstatic.com',
      'i.imgur.com',
      'media.steampowered.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Otimizações para o build
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
  },
};

module.exports = nextConfig;