import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev-прокси: форма зовёт /api/leads как свой origin → без CORS-настроек на бэке
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
