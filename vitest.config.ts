import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest runs ONLY against pure-logic modules in α1 (progress engine, content
 * loader, types). RN component testing (with @testing-library/react-native) is
 * wired up in α3 once the first real components land — that needs jest-expo
 * preset which Vitest does not yet support natively.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', '.expo', 'dist', 'e2e'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/test/**', '**/*.config.*', 'src/types/**', 'app/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
