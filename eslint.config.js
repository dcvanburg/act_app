const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

/**
 * Minimal flat-config for the Expo app.
 *
 * The full `eslint-config-expo` preset expects @typescript-eslint v7 (uses the
 * now-removed `ban-types` rule). We replace it with a slim hand-rolled config
 * that covers: TS parsing, no-console, no-explicit-any, no-unused-vars, and
 * the React Hooks rules of hooks + exhaustive-deps.
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
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
