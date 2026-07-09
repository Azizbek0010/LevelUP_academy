import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

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
