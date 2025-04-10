import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    reporters: ['dot', 'github-actions'],
    coverage: {
      enabled: true,
      reporter: ['json-summary', 'json', 'html'],
      reportOnFailure: true,
      include: ['projects/**/*.ts', 'packages/**/*.ts'],
      all: true,
      cleanOnRerun: false
    },
    outputFile: 'test-results.json',
    setupFiles: 'test/setup.ts',
    globalSetup: 'test/globalSetup.ts',
    include: ['./FastGPT/test/test.ts', './projects/app/test/**/*.test.ts'],
    testTimeout: 5000,
    fileParallelism: false,
    pool: 'threads',
    alias: {
      '@': resolve('projects/app/src'),
      '@fastgpt': resolve('FastGPT/packages'),
      '@test': resolve('FastGPT/test')
    }
  }
  // resolve: {
  //   alias: {
  //     '@': resolve('projects/app/src'),
  //     '@fastgpt': resolve('FastGPT/packages'),
  //     '@test': resolve('FastGPT/test')
  //   }
  // }
});
