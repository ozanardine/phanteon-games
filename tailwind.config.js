/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'rust-orange': '#EC4D2D', // Atualizado para a cor solicitada
        'rust-brown': '#A1856D',
        'rust-dark': '#1c1c1c',
      },
      backgroundImage: {
        'hero-pattern': "url('/images/rust-background.jpg')",
        'vip-pattern': "url('/images/rust-vip.jpg')",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};