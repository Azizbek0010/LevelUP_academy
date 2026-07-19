import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * DATE отдаём строкой «YYYY-MM-DD», как он лежит в базе.
 *
 * По умолчанию драйвер превращает DATE в JS-Date, подставляя ЛОКАЛЬНУЮ полночь
 * сервера. В зоне UTC+5 дата урока 2026-07-17 становится объектом, который в
 * JSON сериализуется как «2026-07-16T19:00:00.000Z», — клиент отрезает первые
 * десять символов и получает 16-е июля. Журнал давомата целиком съезжал на
 * день назад; проверено на живой базе: в таблице 17-е, в ответе API 16-е.
 *
 * Календарной дате часовой пояс не нужен по определению: дата урока, срок
 * оплаты, месяц периода и день рождения не «происходят» в момент времени.
 * Поэтому правка стоит на уровне драйвера, а не в отдельном запросе, — иначе
 * тот же сдвиг ждал бы каждую из семи DATE-колонок при первом же обращении.
 *
 * 1082 — OID типа DATE в Postgres. TIMESTAMPTZ (например homework.deadline)
 * это не затрагивает: там момент времени, и часовой пояс уместен.
 */
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/** Shortcut for one-off queries (no transaction). */
export const query = (text, params) => pool.query(text, params);

/**
 * Runs `fn(client)` inside a transaction. Commits on success, rolls back on error.
 *   await withTransaction(async (client) => { ... });
 * If ROLLBACK itself fails (dead connection mid-transaction), the original
 * error is preserved and the client is destroyed instead of returning a
 * possibly-dirty connection to the pool.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  let released = false;
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      logger.error({ err: rollbackErr }, 'ROLLBACK failed after transaction error');
      released = true;
      client.release(rollbackErr); // не возвращаем в пул потенциально битое соединение
    }
    throw err;
  } finally {
    if (!released) client.release();
  }
}
