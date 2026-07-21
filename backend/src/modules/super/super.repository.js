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

// ---------- организация (профиль партнёра, Settings) ----------

export function getOrganization(orgId, client = pool) {
  return client
    .query(
      `SELECT id, name, domain, status, plan, lesson_duration_min,
              coins_per_student, created_at
         FROM organizations
        WHERE id = $1 AND deleted_at IS NULL`,
      [orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateOrganization(orgId, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['name', 'name'],
    ['domain', 'domain'],
    ['lessonDurationMin', 'lesson_duration_min'],
    ['coinsPerStudent', 'coins_per_student'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return getOrganization(orgId, client);
  vals.push(orgId);
  return client
    .query(
      `UPDATE organizations SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i} AND deleted_at IS NULL
        RETURNING id, name, domain, status, plan, lesson_duration_min,
                  coins_per_student, created_at`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- студенты организации (Super Students страница) ----------

export async function listOrgStudents(orgId, { search, frozen, page, limit }, client = pool) {
  const conds = ["u.organization_id = $1", "u.role = 'student'", 'u.deleted_at IS NULL'];
  const vals = [orgId];
  let i = 2;
  if (search) {
    conds.push(`(u.first_name ILIKE $${i} OR u.last_name ILIKE $${i} OR u.phone ILIKE $${i})`);
    vals.push(`%${search}%`);
    i++;
  }
  if (frozen === true) conds.push("u.status = 'frozen'");
  else if (frozen === false) conds.push("u.status <> 'frozen'");
  const where = conds.join(' AND ');
  const offset = (page - 1) * limit;
  const [rows, cnt] = await Promise.all([
    client.query(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.status, u.created_at,
              b.name AS branch_name
         FROM users u
         LEFT JOIN branches b ON b.id = u.branch_id
        WHERE ${where}
        ORDER BY u.created_at DESC
        LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset],
    ),
    client.query(`SELECT count(*)::int AS n FROM users u WHERE ${where}`, vals),
  ]);
  return { rows: rows.rows, total: cnt.rows[0].n };
}

export function softDeleteOrgStudent(id, orgId, client = pool) {
  return client
    .query(
      `UPDATE users SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND role = 'student' AND deleted_at IS NULL
        RETURNING id`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- группы организации (Super Groups страница) ----------

export function listOrgGroups(orgId, client = pool) {
  return client
    .query(
      `SELECT g.id, g.name, g.subject, g.monthly_price, g.schedule, g.room,
              g.is_archived, g.created_at, b.name AS branch_name,
              CASE WHEN m.id IS NULL THEN NULL
                   ELSE m.first_name || ' ' || m.last_name END AS mentor_name,
              (SELECT count(*) FROM group_students gs WHERE gs.group_id = g.id) AS students_count
         FROM groups g
         JOIN branches b ON b.id = g.branch_id
         LEFT JOIN users m ON m.id = g.mentor_id
        WHERE b.organization_id = $1 AND g.deleted_at IS NULL
        ORDER BY g.is_archived, g.name`,
      [orgId],
    )
    .then((r) => r.rows);
}

export function setOrgGroupArchived(id, orgId, archived, client = pool) {
  return client
    .query(
      `UPDATE groups g
          SET is_archived = $3,
              archived_at = CASE WHEN $3 THEN now() ELSE NULL END,
              updated_at = now()
         FROM branches b
        WHERE g.id = $1 AND g.branch_id = b.id AND b.organization_id = $2 AND g.deleted_at IS NULL
        RETURNING g.id`,
      [id, orgId, archived],
    )
    .then((r) => r.rows[0] ?? null);
}

export function softDeleteOrgGroup(id, orgId, client = pool) {
  return client
    .query(
      `UPDATE groups g SET deleted_at = now(), updated_at = now()
         FROM branches b
        WHERE g.id = $1 AND g.branch_id = b.id AND b.organization_id = $2 AND g.deleted_at IS NULL
        RETURNING g.id`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- объявления организации (Super Announcements) ----------

/** Сколько адресатов у объявления по типу аудитории (в пределах орг). */
export function countAnnouncementRecipients(orgId, targetType, client = pool) {
  const roleByTarget = {
    'all-staff': ['admin', 'mentor', 'methodist'],
    'all-admins': ['admin'],
    'all-mentors': ['mentor'],
    'all-parents': ['parent'],
    'all-students': ['student'],
  };
  const roles = roleByTarget[targetType] ?? [];
  return client
    .query(
      `SELECT count(*)::int AS n FROM users
        WHERE organization_id = $1 AND role = ANY($2)
          AND status = 'active' AND deleted_at IS NULL`,
      [orgId, roles],
    )
    .then((r) => r.rows[0].n);
}

/** id активных студентов орг — адресаты Telegram-доставки для parent/student рассылок. */
export function orgActiveStudentIds(orgId, client = pool) {
  return client
    .query(
      `SELECT id FROM users
        WHERE organization_id = $1 AND role = 'student'
          AND status = 'active' AND deleted_at IS NULL`,
      [orgId],
    )
    .then((r) => r.rows.map((row) => row.id));
}

export function insertAnnouncement(
  { orgId, senderId, title, body, targetType, recipientCount },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO org_announcements
         (organization_id, sender_id, title, body, target_type, recipient_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, body, target_type, recipient_count, created_at`,
      [orgId, senderId, title, body, targetType, recipientCount],
    )
    .then((r) => r.rows[0]);
}

export function listAnnouncements(orgId, client = pool) {
  return client
    .query(
      `SELECT a.id, a.title, a.body, a.target_type, a.recipient_count, a.created_at,
              (s.first_name || ' ' || s.last_name) AS sender_name
         FROM org_announcements a
         LEFT JOIN users s ON s.id = a.sender_id
        WHERE a.organization_id = $1 AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC`,
      [orgId],
    )
    .then((r) => r.rows);
}

export function softDeleteAnnouncement(id, orgId, client = pool) {
  return client
    .query(
      `UPDATE org_announcements SET deleted_at = now()
        WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL
        RETURNING id`,
      [id, orgId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- аудит-лог организации (Super Audit) ----------

export function insertAudit(entry, client = pool) {
  const {
    orgId, actorId, actorName, actorRole, action,
    entityType, entityId, entityLabel, success, ip, userAgent, meta,
  } = entry;
  return client
    .query(
      // actor_name не передан → берём из users по actor_id (денормализация: аккаунт
      // могут позже удалить, а в аудите имя должно остаться).
      `INSERT INTO audit_log
         (organization_id, actor_id, actor_name, actor_role, action,
          entity_type, entity_id, entity_label, success, ip, user_agent, meta)
       VALUES ($1, $2,
               COALESCE($3, (SELECT first_name || ' ' || last_name FROM users WHERE id = $2)),
               $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
       RETURNING id`,
      [
        orgId, actorId ?? null, actorName ?? null, actorRole ?? null, action,
        entityType ?? null, entityId ?? null, entityLabel ?? null,
        success ?? true, ip ?? null, userAgent ?? null,
        meta ? JSON.stringify(meta) : null,
      ],
    )
    .then((r) => r.rows[0]);
}

export function listAudit(orgId, limit = 200, client = pool) {
  return client
    .query(
      `SELECT id, actor_id, actor_name, actor_role, action, entity_type,
              entity_id, entity_label, success, ip, user_agent, meta, created_at
         FROM audit_log
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [orgId, limit],
    )
    .then((r) => r.rows);
}

// ---------- статистика организации (Super Stats) ----------

/** Выручка по дням за период (из завершённых транзакций филиалов орг). */
export function revenueSeries(orgId, fromDate, client = pool) {
  return client
    .query(
      `SELECT date_trunc('day', t.created_at)::date AS day,
              COALESCE(SUM(t.amount), 0) AS revenue
         FROM transactions t
         JOIN branches b ON b.id = t.branch_id
        WHERE b.organization_id = $1 AND t.status = 'completed'
          AND t.created_at >= $2
        GROUP BY day
        ORDER BY day`,
      [orgId, fromDate],
    )
    .then((r) => r.rows);
}

/** Разбивка выручки по способу оплаты (за период). */
export function revenueByMethod(orgId, fromDate, client = pool) {
  return client
    .query(
      `SELECT t.method, COALESCE(SUM(t.amount), 0) AS amount
         FROM transactions t
         JOIN branches b ON b.id = t.branch_id
        WHERE b.organization_id = $1 AND t.status = 'completed'
          AND t.created_at >= $2
        GROUP BY t.method`,
      [orgId, fromDate],
    )
    .then((r) => r.rows);
}

// ---------- посещаемость организации (Super Attendance страница) ----------

export function orgAttendance(orgId, { groupId, date }, client = pool) {
  const conds = ['b.organization_id = $1'];
  const vals = [orgId];
  let i = 2;
  if (groupId) { conds.push(`a.group_id = $${i++}`); vals.push(groupId); }
  if (date) { conds.push(`a.lesson_date = $${i++}`); vals.push(date); }
  return client
    .query(
      `SELECT a.id, a.group_id, a.student_id, a.lesson_date, a.status,
              u.first_name, u.last_name, g.name AS group_name
         FROM attendance a
         JOIN branches b ON b.id = a.branch_id
         JOIN users u ON u.id = a.student_id
         JOIN groups g ON g.id = a.group_id
        WHERE ${conds.join(' AND ')}
        ORDER BY a.lesson_date DESC
        LIMIT 500`,
      vals,
    )
    .then((r) => r.rows);
}
