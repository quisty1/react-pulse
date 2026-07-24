import { defineConfig } from 'vitest/config';

// Unit-тесты API в Node-окружении
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
