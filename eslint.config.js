// https://docs.expo.dev/guides/using-eslint/
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
});

module.exports = [
  ...compat.extends('expo', 'prettier'),
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },
];
