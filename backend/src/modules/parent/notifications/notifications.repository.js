import { pool } from '../../../config/db.js';

/**
 * Read-only доступ к событиям для ленты уведомлений родителя — своя же таблица
 * notifications не заводится: лента синтезируется из уже существующих данных
 * (оценки/посещаемость/платежи), см. notifications.service.js.
 */

/** ID всех детей этого родителя (student_profiles.parent_id). */
export async function getChildIdsForParent(parentId) {
  const { rows } = await pool.query(
    `SELECT user_id FROM student_profiles WHERE parent_id = $1`,
    [parentId],
  );
  return rows.map((r) => r.user_id);
}

/** Недавно оценённые ДЗ детей родителя. */
export async function getHomeworkGradeEvents(childIds, limit) {
  if (childIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT hs.id, hs.student_id, u.first_name, u.last_name,
            hw.title, hs.score, hw.max_score, hs.graded_at AS created_at
       FROM homework_submissions hs
       JOIN homework hw ON hw.id = hs.homework_id
       JOIN users u ON u.id = hs.student_id
      WHERE hs.student_id = ANY($1) AND hs.status = 'graded' AND hs.graded_at IS NOT NULL
      ORDER BY hs.graded_at DESC
      LIMIT $2`,
    [childIds, limit],
  );
  return rows;
}

/** Недавно завершённые тесты детей родителя. */
export async function getTestGradeEvents(childIds, limit) {
  if (childIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT tr.id, tr.student_id, u.first_name, u.last_name,
            t.title, tr.score, tr.finished_at AS created_at
       FROM test_results tr
       JOIN tests t ON t.id = tr.test_id
       JOIN users u ON u.id = tr.student_id
      WHERE tr.student_id = ANY($1) AND tr.finished_at IS NOT NULL
      ORDER BY tr.finished_at DESC
      LIMIT $2`,
    [childIds, limit],
  );
  return rows;
}

/** Недавние опоздания/пропуски детей родителя (только то, что требует внимания). */
export async function getAttendanceEvents(childIds, limit) {
  if (childIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT a.id, a.student_id, u.first_name, u.last_name,
            a.status, a.lesson_date, g.name AS group_name, a.created_at
       FROM attendance a
       JOIN groups g ON g.id = a.group_id
       JOIN users u ON u.id = a.student_id
      WHERE a.student_id = ANY($1) AND a.status IN ('absent', 'late')
      ORDER BY a.created_at DESC
      LIMIT $2`,
    [childIds, limit],
  );
  return rows;
}

/** Недавно принятые платежи по счетам детей родителя. */
export async function getPaymentReceivedEvents(childIds, limit) {
  if (childIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT t.id, i.student_id, u.first_name, u.last_name, t.amount, t.created_at
       FROM transactions t
       JOIN invoices i ON i.id = t.invoice_id
       JOIN users u ON u.id = i.student_id
      WHERE i.student_id = ANY($1) AND t.status = 'completed'
      ORDER BY t.created_at DESC
      LIMIT $2`,
    [childIds, limit],
  );
  return rows;
}

/** Просроченные счета детей родителя. */
export async function getOverdueInvoiceEvents(childIds, limit) {
  if (childIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT i.id, i.student_id, u.first_name, u.last_name,
            (i.total_amount - i.paid_amount) AS amount_due, i.updated_at AS created_at
       FROM invoices i
       JOIN users u ON u.id = i.student_id
      WHERE i.student_id = ANY($1) AND i.status = 'overdue' AND i.deleted_at IS NULL
      ORDER BY i.updated_at DESC
      LIMIT $2`,
    [childIds, limit],
  );
  return rows;
}
