import { pool } from '../../config/db.js';

/**
 * K-ADMIN repository — всё жёстко скоуплено по branch_id (филиал админа).
 * organizationId проставляется при вставках (мульти-аренда).
 * Функции с параметром `client` умеют работать внутри транзакции.
 */

// ==================== ДАШБОРД ФИЛИАЛА ====================

export function branchDashboard(branchId, client = pool) {
  return client
    .query(
      `SELECT
         (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
            WHERE t.branch_id = $1 AND t.status = 'completed') AS revenue_total,
         (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
            WHERE t.branch_id = $1 AND t.status = 'completed'
              AND t.created_at >= date_trunc('month', now())) AS revenue_month,
         (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
            WHERE e.branch_id = $1 AND e.deleted_at IS NULL) AS expenses_total,
         (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
            WHERE e.branch_id = $1 AND e.deleted_at IS NULL
              AND e.spent_at >= date_trunc('month', now())::date) AS expenses_month,
         (SELECT COALESCE(SUM(sp.total_debt), 0) FROM student_profiles sp
            WHERE sp.branch_id = $1) AS outstanding_debt,
         (SELECT count(*) FROM users u
            WHERE u.branch_id = $1 AND u.role = 'student'
              AND u.status = 'active' AND u.deleted_at IS NULL) AS active_students,
         (SELECT count(*) FROM groups g
            WHERE g.branch_id = $1 AND g.is_archived = false AND g.deleted_at IS NULL) AS groups,
         (SELECT count(*) FROM invoices i
            WHERE i.branch_id = $1 AND i.status = 'overdue' AND i.deleted_at IS NULL) AS overdue_invoices`,
      [branchId],
    )
    .then((r) => r.rows[0]);
}

// ==================== РАСХОДЫ ====================

export function insertExpense(
  { orgId, branchId, category, amount, spentAt, note, createdBy },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO expenses (organization_id, branch_id, category, amount, spent_at, note, created_by)
       VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6, $7)
       RETURNING id, category, amount, spent_at, note, created_at`,
      [orgId, branchId, category, amount, spentAt ?? null, note ?? null, createdBy],
    )
    .then((r) => r.rows[0]);
}

export function listExpenses({ branchId, from, to, limit, offset }, client = pool) {
  return client
    .query(
      `SELECT e.id, e.category, e.amount, e.spent_at, e.note, e.created_at,
              u.first_name AS created_by_first, u.last_name AS created_by_last
         FROM expenses e
         JOIN users u ON u.id = e.created_by
        WHERE e.branch_id = $1 AND e.deleted_at IS NULL
          AND ($2::date IS NULL OR e.spent_at >= $2)
          AND ($3::date IS NULL OR e.spent_at <= $3)
        ORDER BY e.spent_at DESC, e.created_at DESC
        LIMIT $4 OFFSET $5`,
      [branchId, from ?? null, to ?? null, limit, offset],
    )
    .then((r) => r.rows);
}

export function countExpenses({ branchId, from, to }, client = pool) {
  return client
    .query(
      `SELECT count(*)::int AS n FROM expenses e
        WHERE e.branch_id = $1 AND e.deleted_at IS NULL
          AND ($2::date IS NULL OR e.spent_at >= $2)
          AND ($3::date IS NULL OR e.spent_at <= $3)`,
      [branchId, from ?? null, to ?? null],
    )
    .then((r) => r.rows[0].n);
}

export function softDeleteExpense(id, branchId, client = pool) {
  return client
    .query(
      `UPDATE expenses SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND deleted_at IS NULL
        RETURNING id`,
      [id, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ==================== СТУДЕНТЫ ====================

/** Создание user (student ИЛИ parent) с логин-кодом. Бросает 23505 при конфликте. */
export function insertCodeUser(
  { orgId, branchId, role, firstName, lastName, phone, loginCode, passwordHash },
  client = pool,
) {
  // parent — уровень организации, но заводится в филиале, храним branch_id для скоупа админа
  return client
    .query(
      `INSERT INTO users
         (organization_id, branch_id, role, first_name, last_name, phone, login_code, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, role, first_name, last_name, phone, login_code`,
      [orgId, branchId, role, firstName, lastName, phone, loginCode, passwordHash],
    )
    .then((r) => r.rows[0]);
}

export function insertStudentProfile({ userId, branchId, parentId, birthDate }, client = pool) {
  return client
    .query(
      `INSERT INTO student_profiles (user_id, branch_id, parent_id, birth_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, coin_balance, total_debt`,
      [userId, branchId, parentId ?? null, birthDate ?? null],
    )
    .then((r) => r.rows[0]);
}

export function addStudentToGroupRaw({ groupId, studentId }, client = pool) {
  return client
    .query(
      `INSERT INTO group_students (group_id, student_id) VALUES ($1, $2)
       ON CONFLICT (group_id, student_id) DO UPDATE SET left_at = NULL
       RETURNING id`,
      [groupId, studentId],
    )
    .then((r) => r.rows[0]);
}

export function listStudents({ branchId, search, groupId, limit, offset }, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.status, u.login_code, u.created_at,
              sp.coin_balance, sp.total_debt, sp.parent_id,
              EXISTS (
                SELECT 1 FROM invoices i
                 WHERE i.student_id = u.id AND i.status = 'overdue' AND i.deleted_at IS NULL
              ) AS has_overdue_invoice,
              COALESCE(
                (SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
                   FROM group_students gs
                   JOIN groups g ON g.id = gs.group_id
                  WHERE gs.student_id = u.id AND gs.left_at IS NULL AND g.deleted_at IS NULL),
                '[]'
              ) AS groups
         FROM users u
         JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.branch_id = $1 AND u.role = 'student' AND u.deleted_at IS NULL
          AND ($2::text IS NULL OR (u.first_name || ' ' || u.last_name) ILIKE '%' || $2 || '%'
                                    OR u.phone ILIKE '%' || $2 || '%'
                                    OR u.login_code ILIKE '%' || $2 || '%')
          AND ($3::uuid IS NULL OR EXISTS (
                SELECT 1 FROM group_students gs
                 WHERE gs.student_id = u.id AND gs.group_id = $3 AND gs.left_at IS NULL))
        ORDER BY u.created_at DESC
        LIMIT $4 OFFSET $5`,
      [branchId, search ?? null, groupId ?? null, limit, offset],
    )
    .then((r) => r.rows);
}

export function countStudents({ branchId, search, groupId }, client = pool) {
  return client
    .query(
      `SELECT count(*)::int AS n
         FROM users u
        WHERE u.branch_id = $1 AND u.role = 'student' AND u.deleted_at IS NULL
          AND ($2::text IS NULL OR (u.first_name || ' ' || u.last_name) ILIKE '%' || $2 || '%'
                                    OR u.phone ILIKE '%' || $2 || '%'
                                    OR u.login_code ILIKE '%' || $2 || '%')
          AND ($3::uuid IS NULL OR EXISTS (
                SELECT 1 FROM group_students gs
                 WHERE gs.student_id = u.id AND gs.group_id = $3 AND gs.left_at IS NULL))`,
      [branchId, search ?? null, groupId ?? null],
    )
    .then((r) => r.rows[0].n);
}

/** Студент по id строго в филиале. */
export function findStudentInBranch(id, branchId, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.status, u.login_code, u.created_at,
              sp.coin_balance, sp.total_debt, sp.parent_id, sp.birth_date,
              sp.frozen_at, sp.frozen_reason,
              EXISTS (
                SELECT 1 FROM invoices i
                 WHERE i.student_id = u.id AND i.status = 'overdue' AND i.deleted_at IS NULL
              ) AS has_overdue_invoice
         FROM users u
         JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.id = $1 AND u.branch_id = $2 AND u.role = 'student' AND u.deleted_at IS NULL`,
      [id, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function studentGroups(studentId, client = pool) {
  return client
    .query(
      `SELECT g.id, g.name, g.subject, g.monthly_price,
              m.first_name AS mentor_first, m.last_name AS mentor_last
         FROM group_students gs
         JOIN groups g ON g.id = gs.group_id
         JOIN users m ON m.id = g.mentor_id
        WHERE gs.student_id = $1 AND gs.left_at IS NULL AND g.deleted_at IS NULL
        ORDER BY g.name`,
      [studentId],
    )
    .then((r) => r.rows);
}

const STUDENT_RETURN = 'id, first_name, last_name, phone, status';

export function updateStudent(id, branchId, fields, client = pool) {
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
  if (cols.length === 0) return Promise.resolve(null);
  vals.push(id, branchId);
  return client
    .query(
      `UPDATE users SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND branch_id = $${i} AND role = 'student' AND deleted_at IS NULL
        RETURNING ${STUDENT_RETURN}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function updateStudentBirthDate(userId, birthDate, client = pool) {
  return client
    .query(
      `UPDATE student_profiles SET birth_date = $2, updated_at = now() WHERE user_id = $1`,
      [userId, birthDate],
    )
    .then(() => undefined);
}

/** Заморозка/разморозка: статус в users + метка в профиле. */
export function setStudentFrozen(id, branchId, frozen, reason, client = pool) {
  return client
    .query(
      `UPDATE users SET status = $3, updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND role = 'student' AND deleted_at IS NULL
        RETURNING ${STUDENT_RETURN}`,
      [id, branchId, frozen ? 'frozen' : 'active'],
    )
    .then(async (r) => {
      const row = r.rows[0] ?? null;
      if (row) {
        await client.query(
          `UPDATE student_profiles
              SET frozen_at = $2, frozen_reason = $3, updated_at = now()
            WHERE user_id = $1`,
          [id, frozen ? new Date() : null, frozen ? (reason ?? null) : null],
        );
      }
      return row;
    });
}

export function setStudentPassword(id, branchId, passwordHash, client = pool) {
  return client
    .query(
      `UPDATE users SET password_hash = $3, updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND role = 'student' AND deleted_at IS NULL
        RETURNING id`,
      [id, branchId, passwordHash],
    )
    .then((r) => r.rows[0] ?? null);
}

/** Мягкое удаление: deleted_at + статус dropped (email/код/телефон освобождаются). */
export function softDeleteStudent(id, branchId, client = pool) {
  return client
    .query(
      `UPDATE users SET deleted_at = now(), status = 'dropped', updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND role = 'student' AND deleted_at IS NULL
        RETURNING id`,
      [id, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function leaveAllGroups(studentId, client = pool) {
  return client
    .query(
      `UPDATE group_students SET left_at = now()
        WHERE student_id = $1 AND left_at IS NULL`,
      [studentId],
    )
    .then(() => undefined);
}

// ==================== МЕНТОРЫ ====================

export function insertMentor(
  { orgId, branchId, firstName, lastName, email, phone, passwordHash },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO users (organization_id, branch_id, role, first_name, last_name, email, phone, password_hash)
       VALUES ($1, $2, 'mentor', $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, phone, status`,
      [orgId, branchId, firstName, lastName, email, phone ?? null, passwordHash],
    )
    .then((r) => r.rows[0]);
}

export function listMentors(branchId, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status, u.created_at,
              (SELECT count(*) FROM groups g
                 WHERE g.mentor_id = u.id AND g.deleted_at IS NULL AND g.is_archived = false) AS groups
         FROM users u
        WHERE u.branch_id = $1 AND u.role = 'mentor' AND u.deleted_at IS NULL
        ORDER BY u.created_at DESC`,
      [branchId],
    )
    .then((r) => r.rows);
}

export function setMentorStatus(id, branchId, status, client = pool) {
  return client
    .query(
      `UPDATE users SET status = $3, updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND role = 'mentor' AND deleted_at IS NULL
        RETURNING id, first_name, last_name, email, phone, status`,
      [id, branchId, status],
    )
    .then((r) => r.rows[0] ?? null);
}

const MENTOR_RETURN = 'id, first_name, last_name, email, phone, status';

export function updateMentor(id, branchId, fields, client = pool) {
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
  if (cols.length === 0) return Promise.resolve(null);
  vals.push(id, branchId);
  return client
    .query(
      `UPDATE users SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND branch_id = $${i} AND role = 'mentor' AND deleted_at IS NULL
        RETURNING ${MENTOR_RETURN}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

/** Сколько живых неархивных групп ведёт ментор (нельзя удалить, пока ведёт). */
export function countMentorActiveGroups(mentorId, branchId, client = pool) {
  return client
    .query(
      `SELECT count(*)::int AS n FROM groups
        WHERE mentor_id = $1 AND branch_id = $2 AND deleted_at IS NULL AND is_archived = false`,
      [mentorId, branchId],
    )
    .then((r) => r.rows[0].n);
}

export function softDeleteMentor(id, branchId, client = pool) {
  return client
    .query(
      `UPDATE users SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND role = 'mentor' AND deleted_at IS NULL
        RETURNING id`,
      [id, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ==================== ГРУППЫ ====================

/** Ментор строго в филиале (для привязки к группе). */
export function findMentorInBranch(mentorId, branchId, client = pool) {
  return client
    .query(
      `SELECT id FROM users
        WHERE id = $1 AND branch_id = $2 AND role = 'mentor' AND deleted_at IS NULL`,
      [mentorId, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

// длительность урока организации (её задаёт Super Admin) — по филиалу
export function getOrgLessonDuration(branchId, client = pool) {
  return client
    .query(
      `SELECT o.lesson_duration_min
         FROM branches b
         JOIN organizations o ON o.id = b.organization_id
        WHERE b.id = $1`,
      [branchId],
    )
    .then((r) => r.rows[0]?.lesson_duration_min ?? 60);
}

export function insertGroup(
  { branchId, mentorId, name, subject, monthlyPrice, schedule, room },
  client = pool,
) {
  return client
    .query(
      `INSERT INTO groups (branch_id, mentor_id, name, subject, monthly_price, schedule, room)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING id, name, subject, monthly_price, schedule, room, is_archived, created_at`,
      [branchId, mentorId, name, subject, monthlyPrice, JSON.stringify(schedule ?? []), room ?? null],
    )
    .then((r) => r.rows[0]);
}

export function listGroups({ branchId, limit, offset }, client = pool) {
  return client
    .query(
      `SELECT g.id, g.name, g.subject, g.monthly_price, g.room, g.is_archived, g.created_at,
              g.mentor_id, m.first_name AS mentor_first, m.last_name AS mentor_last,
              (SELECT count(*) FROM group_students gs
                 WHERE gs.group_id = g.id AND gs.left_at IS NULL) AS students
         FROM groups g
         JOIN users m ON m.id = g.mentor_id
        WHERE g.branch_id = $1 AND g.deleted_at IS NULL
        ORDER BY g.is_archived, g.created_at DESC
        LIMIT $2 OFFSET $3`,
      [branchId, limit, offset],
    )
    .then((r) => r.rows);
}

export function countGroups({ branchId }, client = pool) {
  return client
    .query(
      `SELECT count(*)::int AS n FROM groups
        WHERE branch_id = $1 AND deleted_at IS NULL`,
      [branchId],
    )
    .then((r) => r.rows[0].n);
}

export function findGroupInBranch(id, branchId, client = pool) {
  return client
    .query(
      `SELECT g.id, g.name, g.subject, g.monthly_price, g.schedule, g.room,
              g.is_archived, g.created_at, g.mentor_id,
              m.first_name AS mentor_first, m.last_name AS mentor_last
         FROM groups g
         JOIN users m ON m.id = g.mentor_id
        WHERE g.id = $1 AND g.branch_id = $2 AND g.deleted_at IS NULL`,
      [id, branchId],
    )
    .then((r) => r.rows[0] ?? null);
}

export function groupStudents(groupId, client = pool) {
  return client
    .query(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.status,
              sp.total_debt, sp.coin_balance, gs.joined_at
         FROM group_students gs
         JOIN users u ON u.id = gs.student_id
         JOIN student_profiles sp ON sp.user_id = u.id
        WHERE gs.group_id = $1 AND gs.left_at IS NULL AND u.deleted_at IS NULL
        ORDER BY u.first_name`,
      [groupId],
    )
    .then((r) => r.rows);
}

const GROUP_RETURN =
  'id, name, subject, monthly_price, schedule, room, is_archived, created_at, mentor_id';

export function updateGroup(id, branchId, fields, client = pool) {
  const cols = [];
  const vals = [];
  let i = 1;
  for (const [key, col] of [
    ['name', 'name'],
    ['subject', 'subject'],
    ['mentorId', 'mentor_id'],
    ['monthlyPrice', 'monthly_price'],
    ['room', 'room'],
  ]) {
    if (fields[key] !== undefined) {
      cols.push(`${col} = $${i++}`);
      vals.push(fields[key]);
    }
  }
  if (fields.schedule !== undefined) {
    cols.push(`schedule = $${i++}::jsonb`);
    vals.push(JSON.stringify(fields.schedule));
  }
  if (cols.length === 0) return Promise.resolve(null);
  vals.push(id, branchId);
  return client
    .query(
      `UPDATE groups SET ${cols.join(', ')}, updated_at = now()
        WHERE id = $${i++} AND branch_id = $${i} AND deleted_at IS NULL
        RETURNING ${GROUP_RETURN}`,
      vals,
    )
    .then((r) => r.rows[0] ?? null);
}

export function setGroupArchived(id, branchId, archived, client = pool) {
  return client
    .query(
      `UPDATE groups
          SET is_archived = $3, archived_at = CASE WHEN $3 THEN now() ELSE NULL END, updated_at = now()
        WHERE id = $1 AND branch_id = $2 AND deleted_at IS NULL
        RETURNING ${GROUP_RETURN}`,
      [id, branchId, archived],
    )
    .then((r) => r.rows[0] ?? null);
}

export function removeStudentFromGroup(groupId, studentId, client = pool) {
  return client
    .query(
      `UPDATE group_students SET left_at = now()
        WHERE group_id = $1 AND student_id = $2 AND left_at IS NULL
        RETURNING id`,
      [groupId, studentId],
    )
    .then((r) => r.rows[0] ?? null);
}

// ==================== ОБЪЯВЛЕНИЯ ====================

/** id активных студентов филиала; при groupId — только участники этой группы. */
export function listActiveStudentIds({ branchId, groupId }, client = pool) {
  return client
    .query(
      `SELECT u.id
         FROM users u
        WHERE u.branch_id = $1 AND u.role = 'student'
          AND u.status = 'active' AND u.deleted_at IS NULL
          AND ($2::uuid IS NULL OR EXISTS (
                SELECT 1 FROM group_students gs
                 WHERE gs.student_id = u.id AND gs.group_id = $2 AND gs.left_at IS NULL))`,
      [branchId, groupId ?? null],
    )
    .then((r) => r.rows.map((row) => row.id));
}
