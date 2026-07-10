import { pool } from '../../../config/db.js';

/**
 * Read-only доступ parent-домена. Родитель никогда не пишет в эти таблицы —
 * только SELECT'ы (§6: «Остальные — SELECT»). Скоуп всегда ограничен детьми
 * этого родителя (student_profiles.parent_id) — проверяется в getChild().
 */

/** Дети родителя (краткая карточка): профиль + коины/долг + заморозка. */
export async function getChildrenForParent(parentId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_key,
            sp.branch_id, sp.coin_balance, sp.total_debt, sp.frozen_at
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
      WHERE sp.parent_id = $1
      ORDER BY u.first_name, u.last_name`,
    [parentId],
  );
  return rows.map(mapChild);
}

/**
 * Один ребёнок этого родителя. Возвращает профиль или null, если ребёнка
 * с таким id у родителя нет — вызывающий превращает null в 403 (guard).
 */
export async function getChild(parentId, childId) {
  const { rows: [row] } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_key,
            sp.branch_id, sp.coin_balance, sp.total_debt, sp.frozen_at
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
      WHERE sp.parent_id = $1 AND sp.user_id = $2`,
    [parentId, childId],
  );
  return row ? mapChild(row) : null;
}

/** Группы ребёнка (активное членство) с ФИО ментора. */
export async function getGroups(childId) {
  const { rows } = await pool.query(
    `SELECT g.id, g.name, g.subject,
            m.first_name AS mentor_first_name, m.last_name AS mentor_last_name
       FROM group_students gs
       JOIN groups g ON g.id = gs.group_id AND g.deleted_at IS NULL
       JOIN users m ON m.id = g.mentor_id
      WHERE gs.student_id = $1 AND gs.left_at IS NULL
      ORDER BY g.name`,
    [childId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    subject: r.subject,
    mentorName: `${r.mentor_first_name} ${r.mentor_last_name}`,
  }));
}

/** Сводка посещаемости по статусам за последние `days` дней. */
export async function getAttendanceSummary(childId, days) {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int AS count
       FROM attendance
      WHERE student_id = $1
        AND lesson_date >= CURRENT_DATE - $2::int
      GROUP BY status`,
    [childId, days],
  );
  const summary = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  for (const r of rows) {
    summary[r.status] = r.count;
    summary.total += r.count;
  }
  return summary;
}

/** Последние отметки посещаемости (для ленты обзора). */
export async function getRecentAttendance(childId, limit) {
  const { rows } = await pool.query(
    `SELECT a.lesson_date, a.status, a.comment, g.name AS group_name
       FROM attendance a
       JOIN groups g ON g.id = a.group_id
      WHERE a.student_id = $1
      ORDER BY a.lesson_date DESC
      LIMIT $2`,
    [childId, limit],
  );
  return rows.map((r) => ({
    lessonDate: r.lesson_date,
    status: r.status,
    comment: r.comment,
    groupName: r.group_name,
  }));
}

/** Последние оценённые ДЗ ребёнка. */
export async function getRecentHomeworkGrades(childId, limit) {
  const { rows } = await pool.query(
    `SELECT hw.title, hw.max_score, s.score, s.graded_at
       FROM homework_submissions s
       JOIN homework hw ON hw.id = s.homework_id
      WHERE s.student_id = $1 AND s.status = 'graded'
      ORDER BY s.graded_at DESC
      LIMIT $2`,
    [childId, limit],
  );
  return rows.map((r) => ({
    title: r.title,
    score: r.score,
    maxScore: r.max_score,
    gradedAt: r.graded_at,
  }));
}

/** Последние завершённые тесты/экзамены ребёнка. */
export async function getRecentTestResults(childId, limit) {
  const { rows } = await pool.query(
    `SELECT t.title,
            jsonb_array_length(t.questions) AS max_score,
            tr.score, tr.finished_at
       FROM test_results tr
       JOIN tests t ON t.id = tr.test_id
      WHERE tr.student_id = $1 AND tr.finished_at IS NOT NULL
      ORDER BY tr.finished_at DESC
      LIMIT $2`,
    [childId, limit],
  );
  return rows.map((r) => ({
    title: r.title,
    score: r.score,
    maxScore: r.max_score,
    finishedAt: r.finished_at,
  }));
}

function mapChild(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    avatarKey: r.avatar_key,
    branchId: r.branch_id,
    coins: r.coin_balance,
    totalDebt: r.total_debt,
    frozen: r.frozen_at !== null,
  };
}
