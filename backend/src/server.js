import { createServer } from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';
import { initTelegramWebhook } from './modules/telegram/bot.js';

const app = createApp();
const httpServer = createServer(app);
const io = initSockets(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);

  // После listen, а не до: Telegram проверяет webhook сразу после setWebhook,
  // и до открытия порта проверка пришлась бы в закрытую дверь.
  // Не await — падение регистрации бота не должно мешать API отвечать.
  initTelegramWebhook().catch((err) => logger.error({ err }, 'Telegram webhook init failed'));
});

// --- graceful shutdown: stop accepting → drain sockets → close pool/redis ---
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down...');

  const forceExit = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();

  try {
    await io.close(); // закрывает и переданный httpServer (socket.io ≥4.2)
    await pool.end();
    await closeRedis();
    clearTimeout(forceExit);
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
