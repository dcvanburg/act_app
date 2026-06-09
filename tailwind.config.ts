import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B6D11',
          dark: '#27500A',
          soft: '#EAF3DE',
          'border-soft': '#C0DD97',
        },
        secondary: '#639922',
        background: '#F5F0E8',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1EFE8',
        },
        text: {
          DEFAULT: '#2C2C2A',
          muted: '#888780',
          subtle: '#5F5E5A',
        },
        border: '#D3D1C7',
        locked: '#B4B2A9',
        crisis: {
          DEFAULT: '#D85A30',
          dark: '#993C1D',
          soft: '#FFF8F5',
          border: '#F5C4B3',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
