import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Mirror the mobile theme so admin + app feel related.
        primary: {
          DEFAULT: '#ED8B00',
          fg: '#FFFFFF',
          muted: '#FFE3B8',
        },
        ink: {
          900: '#0E1116',
          700: '#2A2F39',
          500: '#5B6271',
          300: '#9AA1AE',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F6F7F9',
          border: '#E5E7EB',
        },
        danger: '#D14343',
        success: '#1F8A4C',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
