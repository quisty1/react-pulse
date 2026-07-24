import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфиг Vite для SPA: алиасы FSD, корневой .env, proxy на API
export default defineConfig({
  plugins: [react()],
  // Читаем VITE_* из корня монорепо, а не из apps/web
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Source shared напрямую в dev, без предварительной сборки пакета
      '@pulse/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Прокси /api на бэкенд в dev (без CORS-проблем)
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
        // Разделяем тяжёлые зависимости по чанкам
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          markdown: ['react-markdown', 'rehype-sanitize'],
        },
      },
    },
  },
});
