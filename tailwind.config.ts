import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4fa',
          100: '#d9e2f2',
          200: '#b3c8e5',
          300: '#8daed8',
          400: '#6694cb',
          500: '#407abe',
          600: '#1a56a4',
          700: '#154583',
          800: '#103462',
          900: '#0b2341',
        },
        gold: {
          50: '#fef9ee',
          100: '#fdf0d5',
          200: '#fae0aa',
          300: '#f5cb75',
          400: '#efb03e',
          500: '#e8991a',
          600: '#c97a10',
          700: '#a05c11',
          800: '#824915',
          900: '#6c3d14',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
