import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev-прокси: фронт зовёт /api/... как свой origin → без CORS/куки-головной боли
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
