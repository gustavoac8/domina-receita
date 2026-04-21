import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B6E99',
          50: '#E8F3F9',
          100: '#CFE6F1',
          500: '#0B6E99',
          700: '#0A5278',
          900: '#083D5C',
        },
        accent: { DEFAULT: '#E8C547' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
