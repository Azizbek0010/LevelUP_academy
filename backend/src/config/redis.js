import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

function createClient(name, options = {}) {
  const client = new Redis(env.REDIS_URL, { lazyConnect: false, ...options });
  client.on('error', (err) => logger.error({ err, client: name }, 'Redis error'));
  return client;
}

/** Main client: cache, presence, leaderboards (ZSET). */
export const redis = createClient('main');

/** Dedicated pub/sub pair for @socket.io/redis-adapter. */
export const redisPub = createClient('pub');
export const redisSub = createClient('sub');

/** BullMQ requires maxRetriesPerRequest: null on its connection. */
export const redisConnection = createClient('bullmq', { maxRetriesPerRequest: null });

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), redisPub.quit(), redisSub.quit(), redisConnection.quit()]);
}
