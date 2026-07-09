import { pool } from '../../config/db.js';

// ---------- цены платформы (синглтон id=1) ----------

const mapPricing = (row) =>
  row && {
    baseFirstBranch: Number(row.base_first_branch),
    perExtraBranch: Number(row.per_extra_branch),
    perStudent: Number(row.per_student),
    currency: row.currency,
    updatedAt: row.updated_at,
  };

export function getPricing(client = pool) {
  return client
    .query(`SELECT * FROM platform_pricing WHERE id = 1`)
    .then((r) => mapPricing(r.rows[0]));
}

/** Частичное обновление: меняем только переданные поля (все — в сумах). */
export function updatePricing(fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['baseFirstBranch', 'base_first_branch'],
    ['perExtraBranch', 'per_extra_branch'],
    ['perStudent', 'per_student'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return getPricing(client);
  return client
    .query(
      `UPDATE platform_pricing SET ${cols.join(', ')}, updated_at = now()
        WHERE id = 1 RETURNING *`,
      vals,
    )
    .then((r) => mapPricing(r.rows[0]));
}

export function findOrgByDomain(domain, client = pool) {
  return client
    .query(`SELECT id FROM organizations WHERE domain = $1 AND deleted_at IS NULL`, [domain])
    .then((r) => r.rows[0] ?? null);
}

export function insertOrganization({ name, domain, plan = null }, client = pool) {
  return client
    .query(
      `INSERT INTO organizations (name, plan, domain, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, name, plan, domain, status, created_at`,
      [name, plan, domain ?? null],
    )
    .then((r) => r.rows[0]);
}

export function insertSuperadmin(
  { orgId, firstName, lastName, email, phone, passwordHash },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO users (organization_id, role, first_name, last_name, email, phone, password_hash)
       VALUES ($1, 'superadmin', $2, $3, $4, $5, $6)
       RETURNING id, role, organization_id, first_name, last_name, email`,
      [orgId, firstName, lastName, email, phone ?? null, passwordHash],
    )
    .then((r) => r.rows[0]);
}

export function setOrgOwner(orgId, userId, client = pool) {
  return client.query(
    `UPDATE organizations SET owner_user_id = $1, updated_at = now() WHERE id = $2`,
    [userId, orgId],
  );
}

/** Список партнёров с числом филиалов и студентов (для дашборда/списка). */
export function listPartners(client = pool) {
  return client
    .query(
      `SELECT o.id, o.name, o.plan, o.domain, o.status, o.created_at,
              (SELECT count(*) FROM branches b
                 WHERE b.organization_id = o.id AND b.deleted_at IS NULL) AS branches,
              (SELECT count(*) FROM users u
                 WHERE u.organization_id = o.id AND u.role = 'student' AND u.deleted_at IS NULL) AS students
         FROM organizations o
        WHERE o.deleted_at IS NULL
        ORDER BY o.created_at DESC`,
    )
    .then((r) => r.rows);
}

export function findOrgById(id, client = pool) {
  return client
    .query(`SELECT id, name, status FROM organizations WHERE id = $1 AND deleted_at IS NULL`, [id])
    .then((r) => r.rows[0] ?? null);
}

export function setOrgStatus(id, status, client = pool) {
  return client
    .query(
      `UPDATE organizations SET status = $2, updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, name, status`,
      [id, status],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- заявки с лендинга (leads) ----------

const LEAD_COLS = 'id, name, phone, center_name, center_size, message, status, notes, organization_id, created_at';

export function insertLead({ name, phone, centerName, centerSize, message }, client = pool) {
  return client
    .query(
      `INSERT INTO leads (name, phone, center_name, center_size, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${LEAD_COLS}`,
      [name, phone, centerName ?? '', centerSize ?? null, message ?? null],
    )
    .then((r) => r.rows[0]);
}

/** Список заявок; опционально фильтр по статусу. */
export function listLeads(status, client = pool) {
  const where = status ? 'WHERE status = $1' : '';
  const params = status ? [status] : [];
  return client
    .query(`SELECT ${LEAD_COLS} FROM leads ${where} ORDER BY created_at DESC`, params)
    .then((r) => r.rows);
}

export function findLead(id, client = pool) {
  return client
    .query(`SELECT ${LEAD_COLS} FROM leads WHERE id = $1`, [id])
    .then((r) => r.rows[0] ?? null);
}

export function updateLead(id, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['status', 'status'],
    ['notes', 'notes'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return findLead(id, client);
  vals.push(id);
  return client
    .query(
      `UPDATE leads SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i} RETURNING ${LEAD_COLS}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

/** Пометить заявку онбордингом: status=onboarded + привязка к организации. */
export function markLeadOnboarded(id, orgId, client = pool) {
  return client.query(
    `UPDATE leads SET status = 'onboarded', organization_id = $2, updated_at = now()
      WHERE id = $1`,
    [id, orgId],
  );
}
