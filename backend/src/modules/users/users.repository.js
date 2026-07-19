import { pool } from '../../config/db.js';

const PUBLIC_COLUMNS = `id, organization_id, branch_id, role, status,
  first_name, last_name, phone, email, avatar_key, is_archived, created_at, updated_at`;

// Тот же набор, но с префиксом таблицы — для запросов с JOIN. Без него
// `created_at` и `updated_at`, которые есть и в users, и в mentor_profiles,
// делают выборку неоднозначной, и Postgres отвечает 42702.
const USER_COLUMNS_PREFIXED = PUBLIC_COLUMNS
  .split(',')
  .map((c) => `u.${c.trim()}`)
  .join(', ');

/**
 * Карточка ментора подтягивается LEFT JOIN'ом: строки в mentor_profiles может
 * не быть (ментор её ещё не заполнял), и это не повод не отдать пользователя.
 * Для остальных ролей поля просто NULL.
 */
export async function findById(id, db = pool) {
  const { rows: [user] } = await db.query(
    `SELECT ${USER_COLUMNS_PREFIXED},
            mp.bio, mp.skills, mp.grade, mp.grade_set_at
       FROM users u
       LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [id],
  );
  return user ?? null;
}

/**
 * Карточка ментора. UPSERT, а не UPDATE: строки может ещё не существовать —
 * ментор заполняет её впервые. Грейд здесь не трогается вообще, для него
 * отдельный путь через админский модуль.
 */
export async function upsertMentorProfile(userId, { bio, skills }) {
  const { rows: [row] } = await pool.query(
    `INSERT INTO mentor_profiles (user_id, bio, skills)
          VALUES ($1, $2, COALESCE($3::text[], '{}'))
     ON CONFLICT (user_id) DO UPDATE
            SET bio        = COALESCE($2, mentor_profiles.bio),
                skills     = COALESCE($3::text[], mentor_profiles.skills),
                updated_at = now()
       RETURNING bio, skills, grade, grade_set_at`,
    [userId, bio ?? null, skills ?? null],
  );
  return row ?? null;
}

/** Список пользователей филиала с фильтром по роли/статусу и пагинацией. */
export async function findByBranch({ branchId, role, status, limit, offset }) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}
       FROM users
      WHERE branch_id = $1 AND deleted_at IS NULL
        AND ($2::user_role   IS NULL OR role = $2)
        AND ($3::user_status IS NULL OR status = $3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5`,
    [branchId, role ?? null, status ?? null, limit, offset],
  );
  return rows;
}

export async function countByBranch({ branchId, role, status }) {
  const { rows: [{ count }] } = await pool.query(
    `SELECT count(*)::int AS count
       FROM users
      WHERE branch_id = $1 AND deleted_at IS NULL
        AND ($2::user_role   IS NULL OR role = $2)
        AND ($3::user_status IS NULL OR status = $3)`,
    [branchId, role ?? null, status ?? null],
  );
  return count;
}

/** Обновление собственного профиля (ограниченный набор полей). */
export async function updateProfile(id, { firstName, lastName, email, avatarKey }) {
  const { rows: [user] } = await pool.query(
    `UPDATE users
        SET first_name = COALESCE($2, first_name),
            last_name  = COALESCE($3, last_name),
            email      = COALESCE($4, email),
            avatar_key = COALESCE($5, avatar_key),
            updated_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING ${PUBLIC_COLUMNS}`,
    [id, firstName ?? null, lastName ?? null, email ?? null, avatarKey ?? null],
  );
  return user ?? null;
}
