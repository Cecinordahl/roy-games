import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F4F1E8',
        surface: '#FBF9F2',
        sage: {
          DEFAULT: '#A8C09A',
          dark: '#6B8A5E',
        },
        pink: {
          DEFAULT: '#E8B4B8',
        },
        yellow: {
          DEFAULT: '#F0DFA8',
        },
        ink: '#3D4A3A',
        positive: '#6B8A5E',
        negative: '#B06A6A',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '0px',
      },
      boxShadow: {
        chunky: '4px 4px 0 0 #3D4A3A',
        'chunky-sm': '2px 2px 0 0 #3D4A3A',
        'chunky-pressed': '1px 1px 0 0 #3D4A3A',
      },
    },
  },
  plugins: [],
} satisfies Config;
