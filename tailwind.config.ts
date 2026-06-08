import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/providers/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand tokens — Praktijk Vitalis. See .claude/rules/frontend.md.
        primary: {
          DEFAULT: '#2A9D8F',
          dark: '#1F7A6E',
          light: '#3DC4B4',
        },
        crisis: '#C25B2B',
        background: '#F7FAF9',
        surface: '#FFFFFF',
        border: '#D1E3E0',
        text: {
          DEFAULT: '#1A2B2F',
          muted: '#5A7A82',
        },
      },
    },
  },
  plugins: [],
};

export default config;
