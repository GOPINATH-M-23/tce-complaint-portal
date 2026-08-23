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
        tce: {
          dark:    '#1f4d3a',
          green:   '#2e6b52',
          light:   '#3d8c6a',
          cream:   '#f7f5ef',
          muted:   '#4a7c68',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'float':     'float 3s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
