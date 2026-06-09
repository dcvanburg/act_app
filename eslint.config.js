const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

/**
 * Minimal flat-config for the α1 scaffold.
 *
 * The full `eslint-config-expo` preset expects @typescript-eslint v7 (uses the
 * now-removed `ban-types` rule). Bringing it back without breaking the React
 * Native peer-dep chain lands in α2; until then this config covers the basics
 * we actually need: TS parsing, no-console, no-unused-vars.
 */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.next/**',
      'dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      'ios/**',
      'android/**',
      '*.config.js',
      '*.config.ts',
      'expo-env.d.ts',
      'nativewind-env.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
