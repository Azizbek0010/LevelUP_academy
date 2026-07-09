import { pool } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { isoWeekKey, monthKey } from '../../shared/period.js';

/**
 * Лидерборды считаются из Redis ZSET, которые инкрементит coins.service.emitCoinsChanged
 * на положительных начислениях. Ключ на период (week/month) на филиал — «сброс»
 * рейтинга происходит сам при смене периода.
 */

const keyFor = (branchId, period) =>
  period === 'week'
    ? `lb:branch:${branchId}:week:${isoWeekKey()}`
    : `lb:branch:${branchId}:month:${monthKey()}`;

/** Топ-N с именами студентов + позиция запрашивающего. */
export async function getLeaderboard(branchId, period, { limit = 20, studentId = null } = {}) {
  const key = keyFor(branchId, period);

  // ZSET: [member, score, member, score, ...] по убыванию
  const flat = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
  const ranked = [];
  for (let i = 0; i < flat.length; i += 2) {
    ranked.push({ studentId: flat[i], coins: Number(flat[i + 1]), rank: i / 2 + 1 });
  }

  const names = await resolveNames(ranked.map((r) => r.studentId));
  const top = ranked.map((r) => ({ ...r, ...names[r.studentId] }));

  let me = null;
  if (studentId) {
    const [rank, score] = await Promise.all([
      redis.zrevrank(key, studentId),
      redis.zscore(key, studentId),
    ]);
    me =
      rank === null
        ? { rank: null, coins: 0 }
        : { rank: rank + 1, coins: Number(score) };
  }

  return { period, top, me };
}

async function resolveNames(ids) {
  if (ids.length === 0) return {};
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, avatar_key FROM users WHERE id = ANY($1)`,
    [ids],
  );
  return Object.fromEntries(
    rows.map((u) => [
      u.id,
      { firstName: u.first_name, lastName: u.last_name, avatarKey: u.avatar_key },
    ]),
  );
}
