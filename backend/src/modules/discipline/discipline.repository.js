import { pool } from '../../config/db.js';

// Целевой сотрудник для штрафа/qora — только в своей организации, не удалён.
export function findStaffInOrg(targetUserId, orgId, client = pool) {
  return client
    .query(
      `SELECT id, role, organization_id, branch_id, status,
              first_name, last_name
         FROM users
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [targetUserId, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function insertPenalty(
  { organizationId, branchId, targetUserId, targetRole, issuedBy, issuerRole, type, amount, reason },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO staff_penalties
         (organization_id, branch_id, target_user_id, target_role, issued_by, issuer_role, type, amount, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, target_user_id, target_role, issued_by, issuer_role, type, amount, reason, created_at`,
      [organizationId, branchId ?? null, targetUserId, targetRole, issuedBy, issuerRole, type, amount ?? null, reason],
    )
    .then((r) => r.rows[0]);
}

// Сменить статус пользователя в рамках организации (fire / reactivate).
export function setUserStatus(userId, orgId, status, client = pool) {
  return client
    .query(
      `UPDATE users SET status = $3, updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
        RETURNING id, status`,
      [userId, orgId, status],
    )
    .then((r) => r.rows[0] ?? null);
}

// Список штрафов организации (super — вся org; admin — сужаем branchId в сервисе).
export function listPenalties({ organizationId, branchId, issuedBy, targetUserId, type }, client = pool) {
  const cond = ['p.organization_id = $1'];
  const vals = [organizationId];
  let i = 2;
  if (branchId) {
    cond.push(`p.branch_id = $${i++}`);
    vals.push(branchId);
  }
  if (issuedBy) {
    cond.push(`p.issued_by = $${i++}`);
    vals.push(issuedBy);
  }
  if (targetUserId) {
    cond.push(`p.target_user_id = $${i++}`);
    vals.push(targetUserId);
  }
  if (type) {
    cond.push(`p.type = $${i++}`);
    vals.push(type);
  }
  return client
    .query(
      `SELECT p.id, p.type, p.amount, p.reason, p.created_at,
              p.target_user_id, p.target_role,
              tu.first_name || ' ' || tu.last_name AS target_name,
              p.issued_by, p.issuer_role,
              iu.first_name || ' ' || iu.last_name AS issued_by_name
         FROM staff_penalties p
         JOIN users tu ON tu.id = p.target_user_id
         JOIN users iu ON iu.id = p.issued_by
        WHERE ${cond.join(' AND ')}
        ORDER BY p.created_at DESC`,
      vals,
    )
    .then((r) => r.rows);
}

// Свои штрафы (для панели сотрудника).
export function listPenaltiesForUser(userId, client = pool) {
  return client
    .query(
      `SELECT p.id, p.type, p.amount, p.reason, p.created_at, p.issuer_role
         FROM staff_penalties p
        WHERE p.target_user_id = $1
        ORDER BY p.created_at DESC`,
      [userId],
    )
    .then((r) => r.rows);
}

export function getCharter(orgId, client = pool) {
  return client
    .query(
      `SELECT organization_id, title, content, updated_by, updated_at
         FROM org_charters WHERE organization_id = $1`,
      [orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function upsertCharter({ orgId, title, content, updatedBy }, client = pool) {
  return client
    .query(
      `INSERT INTO org_charters (organization_id, title, content, updated_by, updated_at)
       VALUES ($1, COALESCE($2, 'Устав'), $3, $4, now())
       ON CONFLICT (organization_id) DO UPDATE
         SET title = COALESCE($2, org_charters.title),
             content = $3,
             updated_by = $4,
             updated_at = now()
       RETURNING organization_id, title, content, updated_by, updated_at`,
      [orgId, title ?? null, content ?? '', updatedBy],
    )
    .then((r) => r.rows[0]);
}
