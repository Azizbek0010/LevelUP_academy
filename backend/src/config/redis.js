import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

function createClient(name, options = {}) {
  const testOptions = env.NODE_ENV === 'test'
    ? { retryStrategy: () => null, connectTimeout: 500, enableOfflineQueue: false }
    : {};
  const client = new Redis(env.REDIS_URL, { lazyConnect: false, ...testOptions, ...options });
  client.on('error', (err) => logger.error({ err, client: name }, 'Redis error'));
  return client;
}

/**
 * Main client: cache (orgAccessGate), rate limiter, presence, leaderboards.
 * `commandTimeout` — без него один запрос к деградировавшему Redis (Upstash,
 * квота исчерпана — 11.08.2026) реально висит ~2с (замерено), потому что
 * ioredis успевает переподключиться и повторить команду, прежде чем она
 * дойдёт до вызывающего кода. Весь этот путь и так уже обёрнут в try/catch
 * с фолбэком на Postgres — таймаут просто заставляет фолбэк срабатывать
 * быстро, а не после долгого ожидания. Только на `main`: у BullMQ-соединения
 * и pub/sub-пары свои долгоживущие блокирующие команды, которым короткий
 * таймаут сломает работу.
 */
export const redis = createClient('main', { commandTimeout: 400 });

/** Dedicated pub/sub pair for @socket.io/redis-adapter. */
export const redisPub = createClient('pub');
export const redisSub = createClient('sub');

/** BullMQ requires maxRetriesPerRequest: null on its connection. */
export const redisConnection = createClient('bullmq', { maxRetriesPerRequest: null });

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), redisPub.quit(), redisSub.quit(), redisConnection.quit()]);
}
