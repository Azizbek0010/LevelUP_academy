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

export function insertSeo(
  { orgId, firstName, lastName, email, phone, passwordHash },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO users (organization_id, role, first_name, last_name, email, phone, password_hash)
       VALUES ($1, 'seo', $2, $3, $4, $5, $6)
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

/**
 * Список партнёров с числом филиалов и студентов.
 *
 * Здесь СОЗНАТЕЛЬНО нет выручки и расходов партнёра. Раньше запрос тянул
 * SUM(transactions.amount) и SUM(expenses.amount) по всем филиалам организации,
 * то есть оборот и траты чужого бизнеса, и отдавал их наружу в /main/dashboard
 * и /main/revenue. В интерфейсе эти числа не показывались, но лежали в ответе —
 * владелец платформы мог открыть devtools и посмотреть, сколько зарабатывает
 * каждый учебный центр.
 *
 * Нам как платформе нужно ровно одно денежное число — сколько партнёр должен
 * НАМ, а оно считается из числа активных учеников (computeBill), а не из его
 * оборота. Поэтому количество студентов остаётся, деньги партнёра — нет.
 */
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

// ---------- объявления платформы (Main Admin → «Анонсы») ----------

/**
 * Сколько адресатов у объявления на момент отправки.
 * `all-partners` — активные организации (адресат = центр как таковой),
 * `all-seo` — активные владельцы организаций (адресат = человек).
 * Считаем в момент создания и сохраняем: список меняется, а «кому отправили»
 * должно остаться историческим фактом.
 */
export function countAnnouncementRecipients(targetType, client = pool) {
  if (targetType === 'all-seo') {
    return client
      .query(
        `SELECT count(*)::int AS n FROM users
          WHERE role = 'seo' AND status = 'active' AND deleted_at IS NULL`,
      )
      .then((r) => r.rows[0].n);
  }
  return client
    .query(
      `SELECT count(*)::int AS n FROM organizations
        WHERE status = 'active' AND deleted_at IS NULL`,
    )
    .then((r) => r.rows[0].n);
}

export function insertAnnouncement({ senderId, title, body, targetType, recipientCount }, client = pool) {
  return client
    .query(
      `INSERT INTO platform_announcements
         (sender_id, title, body, target_type, recipient_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, body, target_type, recipient_count, created_at`,
      [senderId, title, body, targetType, recipientCount],
    )
    .then((r) => r.rows[0]);
}

export function listAnnouncements(client = pool) {
  return client
    .query(
      `SELECT a.id, a.title, a.body, a.target_type, a.recipient_count, a.created_at,
              (s.first_name || ' ' || s.last_name) AS sender_name
         FROM platform_announcements a
         LEFT JOIN users s ON s.id = a.sender_id
        WHERE a.deleted_at IS NULL
        ORDER BY a.created_at DESC`,
    )
    .then((r) => r.rows);
}

export function softDeleteAnnouncement(id, client = pool) {
  return client
    .query(
      `UPDATE platform_announcements SET deleted_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id`,
      [id],
    )
    .then((r) => r.rows[0] ?? null);
}

// ---------- профиль main_admin ----------

const PROFILE_COLS = 'id, first_name, last_name, email, phone, role';

export function findUserById(id, client = pool) {
  return client
    .query(`SELECT ${PROFILE_COLS} FROM users WHERE id = $1 AND deleted_at IS NULL`, [id])
    .then((r) => r.rows[0] ?? null);
}

/**
 * Занят ли email/телефон кем-то другим.
 * В БД на это стоят `uq_users_email` (частичный, среди живых) и `uq_users_phone`.
 * Проверяем заранее, чтобы отдать понятную 409, а не сырую ошибку уникальности.
 */
export function emailTakenByOther(email, userId, client = pool) {
  return client
    .query(
      `SELECT 1 FROM users
        WHERE lower(email) = lower($1) AND id <> $2 AND deleted_at IS NULL
        LIMIT 1`,
      [email, userId],
    )
    .then((r) => r.rowCount > 0);
}

export function phoneTakenByOther(phone, userId, client = pool) {
  return client
    .query(`SELECT 1 FROM users WHERE phone = $1 AND id <> $2 LIMIT 1`, [phone, userId])
    .then((r) => r.rowCount > 0);
}

/** Частичное обновление профиля: только переданные поля. */
export function updateProfile(id, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['firstName', 'first_name'],
    ['lastName', 'last_name'],
    ['email', 'email'],
    ['phone', 'phone'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (cols.length === 0) return findUserById(id, client);
  vals.push(id);
  return client
    .query(
      `UPDATE users SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i} AND deleted_at IS NULL
        RETURNING ${PROFILE_COLS}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

/* Запросы по staff_penalties отсюда убраны: платформа не читает дисциплину
 * сотрудников партнёров. Эти данные принадлежат организации и доступны её
 * SEO через /api/super/penalties. */
