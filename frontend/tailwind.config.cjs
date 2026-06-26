/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          dark: '#0F0A1C',
          darker: '#080510',
          card: '#160F29',
          light: '#21183C',
          plum: '#3A1C5C',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          hover: '#FF5A5F',
          light: '#FF8787',
        },
        electric: {
          violet: '#8A2BE2',
          cyan: '#00F5FF',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
