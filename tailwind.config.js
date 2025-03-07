module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EC4D2D',
        phanteon: {
          orange: '#EC4D2D',
          dark: '#121212',
          gray: '#1E1E1E',
          light: '#2A2A2A',
        },
        dark: {
          100: '#2D2D2D',
          200: '#252525',
          300: '#1A1A1A',
          400: '#121212',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}