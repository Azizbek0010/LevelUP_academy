import { pool } from '../../config/db.js';

// ---------- филиалы ----------

export function countBranches(orgId, client = pool) {
  return client
    .query(
      `SELECT count(*)::int AS n FROM branches
        WHERE organization_id = $1 AND deleted_at IS NULL`,
      [orgId],
    )
    .then((r) => r.rows[0].n);
}

export function insertBranch({ orgId, name, address, phone, isMain }, client = pool) {
  return client
    .query(
      `INSERT INTO branches (organization_id, name, address, phone, is_main)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, address, phone, is_main, created_at`,
      [orgId, name, address ?? null, phone ?? null, isMain ?? false],
    )
    .then((r) => r.rows[0]);
}

/** Филиалы организации + число админов и учеников в каждом. */
export function listBranches(orgId, client = pool) {
  return client
    .query(
      `SELECT b.id, b.name, b.address, b.phone, b.is_main, b.created_at,
              (SELECT count(*) FROM users u
                 WHERE u.branch_id = b.id AND u.role = 'admin' AND u.deleted_at IS NULL) AS admins,
              (SELECT count(*) FROM users u
                 WHERE u.branch_id = b.id AND u.role = 'student' AND u.deleted_at IS NULL) AS students
         FROM branches b
        WHERE b.organization_id = $1 AND b.deleted_at IS NULL
        ORDER BY b.is_main DESC, b.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

/** Филиал по id ТОЛЬКО в пределах организации (защита от чужого филиала). */
export function findBranchInOrg(branchId, orgId, client = pool) {
  return client
    .query(
      `SELECT id FROM branches
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [branchId, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

const BRANCH_RETURN = 'id, name, address, phone, is_main, is_archived, created_at';

/** Частичное обновление филиала в пределах своей орг. */
export function updateBranch(id, orgId, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['name', 'name'],
    ['address', 'address'],
    ['phone', 'phone'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return findBranchFull(id, orgId, client);
  vals.push(id, orgId);
  return client
    .query(
      `UPDATE branches SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND organization_id = $${i} AND deleted_at IS NULL
        RETURNING ${BRANCH_RETURN}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function setBranchArchived(id, orgId, archived, client = pool) {
  return client
    .query(
      `UPDATE branches SET is_archived = $3, updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
        RETURNING ${BRANCH_RETURN}`,
      [id, orgId, archived],
    )
    .then((r) => r.rows[0] ?? null);
}

export function findBranchFull(id, orgId, client = pool) {
  return client
    .query(
      `SELECT ${BRANCH_RETURN} FROM branches
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

/** Админы конкретного филиала (для карточки филиала). */
export function listBranchAdmins(branchId, client = pool) {
  return client
    .query(
      `SELECT id, first_name, last_name, email, status
         FROM users
        WHERE branch_id = $1 AND role = 'admin' AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [branchId],
    )
    .then((r) => r.rows);
}

/** Группы филиала (сводка). */
export function listBranchGroups(branchId, client = pool) {
  return client
    .query(
      `SELECT id, name, subject, monthly_price
         FROM groups
        WHERE branch_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC`,
      [branchId],
    )
    .then((r) => r.rows);
}

// ---------- админы: правка / заморозка ----------

/** Админ по id ТОЛЬКО в своей орг. */
export function findAdminInOrg(id, orgId, client = pool) {
  return client
    .query(
      `SELECT id FROM users
        WHERE id = $1 AND organization_id = $2 AND role = 'admin' AND deleted_at IS NULL`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

const ADMIN_RETURN =
  'id, first_name, last_name, email, status, branch_id';

export function updateAdmin(id, orgId, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['branchId', 'branch_id'],
    ['phone', 'phone'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id, orgId);
  return client
    .query(
      `UPDATE users SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND organization_id = $${i} AND role = 'admin' AND deleted_at IS NULL
        RETURNING ${ADMIN_RETURN}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function setAdminStatus(id, orgId, status, client = pool) {
  return client
    .query(
      `UPDATE users SET status = $3, updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND role = 'admin' AND deleted_at IS NULL
        RETURNING ${ADMIN_RETURN}`,
      [id, orgId, status],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- дашборд организации ----------

export function orgTotals(orgId, client = pool) {
  return client
    .query(
      `SELECT
         (SELECT count(*) FROM branches
            WHERE organization_id = $1 AND deleted_at IS NULL) AS branches,
         (SELECT count(*) FROM users
            WHERE organization_id = $1 AND role = 'student'
              AND status = 'active' AND deleted_at IS NULL) AS active_students,
         (SELECT count(*) FROM users
            WHERE organization_id = $1 AND role = 'admin' AND deleted_at IS NULL) AS admins,
         (SELECT COALESCE(SUM(i.paid_amount), 0) FROM invoices i
            JOIN branches b ON b.id = i.branch_id
           WHERE b.organization_id = $1) AS revenue,
         (SELECT COALESCE(SUM(sp.total_debt), 0) FROM student_profiles sp
            JOIN branches b ON b.id = sp.branch_id
           WHERE b.organization_id = $1) AS outstanding_debt`,
      [orgId],
    )
    .then((r) => r.rows[0]);
}

/** Разбивка по филиалам: студенты, выручка, долг (для дашборда/обзора). */
export function branchBreakdown(orgId, client = pool) {
  return client
    .query(
      `SELECT b.id, b.name, b.is_main, b.is_archived,
              (SELECT count(*) FROM users u
                 WHERE u.branch_id = b.id AND u.role = 'student'
                   AND u.status = 'active' AND u.deleted_at IS NULL) AS students,
              (SELECT count(*) FROM users u
                 WHERE u.branch_id = b.id AND u.role = 'admin' AND u.deleted_at IS NULL) AS admins,
              (SELECT COALESCE(SUM(i.paid_amount), 0) FROM invoices i
                 WHERE i.branch_id = b.id) AS revenue,
              (SELECT COALESCE(SUM(sp.total_debt), 0) FROM student_profiles sp
                 WHERE sp.branch_id = b.id) AS debt
         FROM branches b
        WHERE b.organization_id = $1 AND b.deleted_at IS NULL
        ORDER BY b.is_main DESC, b.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

// ---------- админы ----------

export function insertAdmin(
  { orgId, branchId, firstName, lastName, email, phone, passwordHash },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO users (organization_id, branch_id, role, first_name, last_name, email, phone, password_hash)
       VALUES ($1, $2, 'admin', $3, $4, $5, $6, $7)
       RETURNING id, role, organization_id, branch_id, first_name, last_name, email`,
      [orgId, branchId, firstName, lastName, email, phone ?? null, passwordHash],
    )
    .then((r) => r.rows[0]);
}

/** Админы организации + название их филиала. */
export function listAdmins(orgId, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.created_at,
              u.branch_id, b.name AS branch_name
         FROM users u
         JOIN branches b ON b.id = u.branch_id
        WHERE u.organization_id = $1 AND u.role = 'admin' AND u.deleted_at IS NULL
        ORDER BY u.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

// ---------- методисты ----------

export function insertMethodist(
  { orgId, firstName, lastName, email, phone, passwordHash },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO users (organization_id, role, first_name, last_name, email, phone, password_hash)
       VALUES ($1, 'methodist', $2, $3, $4, $5, $6)
       RETURNING id, role, organization_id, first_name, last_name, email, phone`,
      [orgId, firstName, lastName, email, phone ?? null, passwordHash],
    )
    .then((r) => r.rows[0]);
}

export function listMethodists(orgId, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.phone, u.created_at
         FROM users u
        WHERE u.organization_id = $1 AND u.role = 'methodist' AND u.deleted_at IS NULL
        ORDER BY u.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

export function findMethodistInOrg(id, orgId, client = pool) {
  return client
    .query(
      `SELECT id FROM users
        WHERE id = $1 AND organization_id = $2 AND role = 'methodist' AND deleted_at IS NULL`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateMethodist(id, orgId, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['phone', 'phone'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return null;
  vals.push(id, orgId);
  return client
    .query(
      `UPDATE users SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND organization_id = $${i} AND role = 'methodist' AND deleted_at IS NULL
        RETURNING id, first_name, last_name, email, phone`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function setMethodistStatus(id, orgId, status, client = pool) {
  return client
    .query(
      `UPDATE users SET status = $3, updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND role = 'methodist' AND deleted_at IS NULL
        RETURNING id, first_name, last_name, email, phone`,
      [id, orgId, status],
    )
    .then((r) => r.rows[0] ?? null);
}
