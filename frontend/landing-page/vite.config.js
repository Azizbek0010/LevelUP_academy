import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev-прокси: форма зовёт /api/leads как свой origin → без CORS-настроек на бэке
// VITE_API_URL — боевой бэкенд (Render) для build / preview
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
