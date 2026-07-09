/**
 * Background worker — отдельный процесс от API (падение Telegram-доставки
 * не затрагивает HTTP). Run: npm run worker
 */
import { logger } from './src/config/logger.js';
import { pool } from './src/config/db.js';
import { closeRedis } from './src/config/redis.js';
import { notificationWorker } from './src/queues/workers/notification.worker.js';
import { overdueWorker, scheduleOverdueCron } from './src/queues/workers/overdue.worker.js';

await scheduleOverdueCron();
logger.info('Worker started: notifications + overdue cron (09:00 daily)');

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Worker shutting down...');

  try {
    await Promise.allSettled([notificationWorker.close(), overdueWorker.close()]);
    await pool.end();
    await closeRedis();
    logger.info('Worker shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during worker shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
