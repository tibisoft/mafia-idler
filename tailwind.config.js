/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mob-black': '#0a0a0a',
        'mob-dark': '#111111',
        'mob-card': '#1a1a1a',
        'mob-border': '#2a2a2a',
        'mob-gold': '#c9a84c',
        'mob-gold-light': '#e8c97a',
        'mob-red': '#8b1a1a',
        'mob-red-bright': '#cc2222',
        'mob-amber': '#b8860b',
        'mob-blue': '#1a3a5c',
        'mob-text': '#d4c9a8',
        'mob-muted': '#7a7264',
      },
      fontFamily: {
        'serif': ['Georgia', 'Times New Roman', 'serif'],
        'mono': ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}

