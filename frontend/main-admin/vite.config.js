import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev-прокси: фронт зовёт /api/... как свой origin → без CORS/куки-головной боли
// VITE_API_URL — боевой бэкенд (Render) для build / preview
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
