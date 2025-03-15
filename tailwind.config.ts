import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // blue-500
          dark: '#1D4ED8',    // blue-700
          light: '#93C5FD',   // blue-300
        },
        secondary: {
          DEFAULT: '#10B981', // emerald-500
          dark: '#047857',    // emerald-700
          light: '#6EE7B7',   // emerald-300
        },
        error: {
          DEFAULT: '#EF4444', // red-500
          dark: '#B91C1C',    // red-700
          light: '#FCA5A5',   // red-300
        },
        success: {
          DEFAULT: '#10B981', // emerald-500
          dark: '#047857',    // emerald-700
          light: '#6EE7B7',   // emerald-300
        },
        background: {
          light: '#FFFFFF',
          dark: '#0A0A0A',
        },
        foreground: {
          light: '#171717',
          dark: '#EDEDED',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'media', // 'media' or 'class'
};

export default config;