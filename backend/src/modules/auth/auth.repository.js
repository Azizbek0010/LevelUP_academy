import { pool } from '../../config/db.js';

/**
 * Все запросы принимают опциональный `client` — чтобы работать как в пуле,
 * так и внутри транзакции (withTransaction).
 */

// вход по email (email-роли) ИЛИ по login_code (parent/student). Оба нормализованы в lower.
export function findUserByLogin(login, client = pool) {
  return client
    .query(
      `SELECT id, role, organization_id, branch_id, status, password_hash,
              email, phone, first_name, last_name
         FROM users
        WHERE (email = $1 OR login_code = $1) AND deleted_at IS NULL`,
      [login],
    )
    .then((r) => r.rows[0] ?? null);
}

export function findUserByEmail(email, client = pool) {
  return client
    .query(
      `SELECT id, role, organization_id, branch_id, status, password_hash,
              email, phone, first_name, last_name
         FROM users
        WHERE email = $1 AND deleted_at IS NULL`,
      [email],
    )
    .then((r) => r.rows[0] ?? null);
}

export function findUserByPhone(phone, client = pool) {
  return client
    .query(
      `SELECT id, role, organization_id, branch_id, status, password_hash,
              email, first_name, last_name
         FROM users
        WHERE phone = $1 AND deleted_at IS NULL`,
      [phone],
    )
    .then((r) => r.rows[0] ?? null);
}

export function findUserById(id, client = pool) {
  return client
    .query(
      `SELECT id, role, organization_id, branch_id, status, first_name, last_name
         FROM users
        WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    )
    .then((r) => r.rows[0] ?? null);
}

export function insertRefreshToken({ userId, tokenHash, expiresAt }, client = pool) {
  return client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export function findRefreshByHash(tokenHash, client = pool) {
  return client
    .query(`SELECT * FROM refresh_tokens WHERE token_hash = $1`, [tokenHash])
    .then((r) => r.rows[0] ?? null);
}

/** Берёт строку под блокировку (только внутри транзакции) — против гонки параллельных refresh. */
export function lockRefreshById(id, client) {
  return client
    .query(`SELECT * FROM refresh_tokens WHERE id = $1 FOR UPDATE`, [id])
    .then((r) => r.rows[0] ?? null);
}

export function revokeRefreshToken(id, client = pool) {
  return client.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [id],
  );
}

/** reuse-detection / logout-all / смена пароля — гасим всю "семью" токенов юзера. */
export function revokeAllUserTokens(userId, client = pool) {
  return client.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}

export function updatePassword(userId, passwordHash, client = pool) {
  return client.query(
    `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
    [passwordHash, userId],
  );
}
