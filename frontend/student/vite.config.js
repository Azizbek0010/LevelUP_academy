import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// dev-прокси: фронт зовёт /api/... как свой origin → без CORS, и refresh-cookie
// (SameSite=Lax) доезжает. Target — DEV_API_PROXY (без VITE_ префикса: серверная
// переменная, в браузер не попадает). VITE_API_URL — только для build/preview;
// в dev должен быть ПУСТ, иначе api.js склеит абсолютный URL к Render прямо в
// браузере, прокси окажется в обходе → CORS + cookie не отправится.
// loadEnv нужен, т.к. process.env НЕ читает .env автоматически внутри vite.config.js
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      // 5175 занят панелью member (общий вход) — student слушает 5176,
      // именно этот порт member использует для редиректа роли student.
      port: 5176,
      proxy: {
        '/api': {
          target: env.DEV_API_PROXY || 'https://levelup-academy-1.onrender.com',
          changeOrigin: true,
        },
      },
    },
  };
});
