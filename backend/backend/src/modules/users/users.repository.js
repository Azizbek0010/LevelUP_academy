import { pool } from '../../config/db.js';

const PUBLIC_COLUMNS = `id, organization_id, branch_id, role, status,
  first_name, last_name, phone, email, avatar_key, is_archived, created_at, updated_at`;

export async function findById(id, db = pool) {
  const { rows: [user] } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  return user ?? null;
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
