import { defineConfig } from 'vitest/config';

// API unit tests in a Node environment
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
