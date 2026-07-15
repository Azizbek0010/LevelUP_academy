import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// loadEnv нужен, т.к. process.env НЕ читает .env автоматически внутри vite.config.js
// (Vite грузит .env только в import.meta.env для клиентского кода)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://api.levelup-academy.uz',
          changeOrigin: true,
        },
      },
    },
  };
});
