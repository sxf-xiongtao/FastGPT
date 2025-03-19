import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    reporters: ['dot', 'github-actions'],
    coverage: {
      enabled: true,
      reporter: ['text', 'json', 'html'],
      all: false
    },
    outputFile: 'test-results.json',
    setupFiles: ['./test/setup.ts'],
    include: ['./FastGPT/test/test.ts', './test/cases/**/*.test.ts'],
    testTimeout: 5000
  },
  resolve: {
    alias: {
      '@': resolve('projects/app/src'),
      '@fastgpt': resolve('FastGPT/packages'),
      '@test': resolve('FastGPT/test')
    }
  }
});
