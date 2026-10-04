import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: { 50: '#FFF5F9', 100: '#FCE4EF', 300: '#F48FB1', 600: '#D81B60', 700: '#AD1457' },
        plum: { 900: '#2A1433', 500: '#6E5A7A' },
        lavender: { 100: '#EFE7FB', 600: '#7E57C2' },
        mint: { 100: '#E2F4EC', 700: '#0F7B5F' },
        gold: { 100: '#FDF0D3', 500: '#F2B33D' },
        coral: { 100: '#FDE4E5', 600: '#E5484D' },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '16px', input: '12px' },
    },
  },
  plugins: [],
};
export default config;
