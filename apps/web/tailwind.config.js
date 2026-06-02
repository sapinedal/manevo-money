/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#030303', // Obsidian dark backdrop
        panel: '#09090b', // Zinc dark panel card
        accent: {
          500: '#00e5a3', // Neon Emerald Green
          600: '#00cc90',
          700: '#00b37e',
        },
        border: 'rgba(255, 255, 255, 0.07)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.025em',
      },
    },
  },
  plugins: [],
};
