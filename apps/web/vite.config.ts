import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the SPA: FSD aliases, root .env, API proxy
export default defineConfig({
  plugins: [react()],
  // Read VITE_* from the monorepo root, not apps/web
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Use shared source in dev, without pre-building the package
      '@pulse/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api to the backend in dev (avoids CORS issues)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split heavy dependencies into chunks
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          markdown: ['react-markdown', 'rehype-sanitize'],
        },
      },
    },
  },
});
