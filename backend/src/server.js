import { createServer } from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';
import { initTelegramWebhook } from './modules/telegram/bot.js';
import { notificationWorker } from './queues/workers/notification.worker.js';
import { overdueWorker, scheduleOverdueCron } from './queues/workers/overdue.worker.js';
import { billingWorker, scheduleBillingCron } from './queues/workers/billing.worker.js';
import { dueSoonWorker, scheduleDueSoonCron } from './queues/workers/dueSoon.worker.js';
import { aiReviewWorker } from './queues/workers/aiReview.worker.js';
import { dailyDigestWorker, scheduleDailyDigestCron } from './queues/workers/dailyDigest.worker.js';
import { startReminderLogging, stopReminderLogging } from './modules/super/reminders/reminders.listener.js';

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

// WORKER-MERGE (11.08.2026): раньше это был отдельный процесс (worker.js,
// npm run worker) — второй платный Render-сервис только под очереди. Один
// Starter-инстанс тянет оба: BullMQ-воркеры стартуют сайд-эффектом импорта
// выше, здесь только регистрируются крон-джобы (то же самое, что раньше
// делал worker.js на старте, до всех остальных импортов).
// ⚠️ Trade-off: баг в обработчике очереди теперь может уронить весь процесс,
// а не только доставку уведомлений — для одного учебного центра это принято.
await scheduleOverdueCron();
await scheduleBillingCron();
await scheduleDueSoonCron();
await scheduleDailyDigestCron();
startReminderLogging(); // AB-SUPER-REM: логирует payment.due/due_soon/debt.overdue в reminders (SEO)
logger.info(
  'Queues+crons running in web process: notifications + overdue cron (09:00) + billing cron (1st 00:05, overdue 09:30) + due-soon cron (08:00) + ai-review + daily-digest cron (00:00 Tashkent) + reminder logging',
);

// --- graceful shutdown: stop accepting → drain sockets → close workers/pool/redis ---
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
    await Promise.allSettled([
      notificationWorker.close(),
      overdueWorker.close(),
      billingWorker.close(),
      dueSoonWorker.close(),
      aiReviewWorker.close(),
      dailyDigestWorker.close(),
      stopReminderLogging(),
    ]);
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
