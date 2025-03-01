/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'api.rustmaps.com',
      'rustmaps.com',
      'cdn.discordapp.com',
      'steamuserimages-a.akamaihd.net'
    ],
  },
  async redirects() {
    return [
      {
        source: '/discord',
        destination: process.env.DISCORD_INVITE_URL || 'https://discord.gg/your-invite-link',
        permanent: false,
      },
      {
        source: '/steam',
        destination: 'steam://connect/game.phanteongames.com:28015',
        permanent: false,
      },
    ];
  },
  // Modificação para Vercel
  poweredByHeader: false,
  // Configuração para otimizar imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.rustmaps.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'steamuserimages-a.akamaihd.net',
      },
    ],
  }
};

module.exports = nextConfig;