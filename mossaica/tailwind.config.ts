import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        grape: { 50: '#f6f1ff', 100: '#ebe0ff', 400: '#9b6bff', 500: '#7c3aed', 600: '#6528d4', 700: '#4c1d9e', 900: '#25104f' },
        sky: { 400: '#38bdf8', 500: '#2563eb' },
        sun: '#ffd23f',
        candy: '#ff4fa3',
        lime: { 400: '#7ee05a' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: { pop: '0 6px 0 0 rgba(37,16,79,.9)', soft: '0 10px 30px -12px rgba(76,29,158,.35)' },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0) rotate(-3deg)' }, '50%': { transform: 'translateY(-12px) rotate(3deg)' } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { float: 'float 5s ease-in-out infinite', slideIn: 'slideIn .3s ease-out', fadeIn: '.2s ease-out fadeIn' },
    },
  },
  plugins: [],
};
export default config;
