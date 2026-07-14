import { pool } from '../../../config/db.js';
import { AppError } from '../../../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../../../utils/pagination.js';
import { changeCoins, getStudentHistory } from '../../coins/coins.service.js';

/**
 * Право actor'а трогать коины конкретного ученика:
 *   - mentor → ученик должен состоять хотя бы в одной ЕГО группе;
 *   - admin  → ученик должен быть в филиале админа.
 * Чужой/несуществующий ученик → 404 (существование не раскрываем, K-AUTH §2).
 */
async function assertActorOwnsStudent(actor, studentId, db = pool) {
  if (actor.role === 'mentor') {
    const { rowCount } = await db.query(
      `SELECT 1
         FROM group_students gs
         JOIN groups g ON g.id = gs.group_id
        WHERE gs.student_id = $1 AND gs.left_at IS NULL
          AND g.mentor_id = $2 AND g.deleted_at IS NULL`,
      [studentId, actor.id],
    );
    if (!rowCount) throw new AppError(404, 'Student not found');
    return;
  }
  // admin — скоуп по своему филиалу
  const { rowCount } = await db.query(
    `SELECT 1 FROM users
      WHERE id = $1 AND role = 'student' AND deleted_at IS NULL AND branch_id = $2`,
    [studentId, actor.branchId],
  );
  if (!rowCount) throw new AppError(404, 'Student not found');
}

/** Начислить (+) или списать (−) коины с обязательной причиной. */
export async function grantCoins(actor, { studentId, amount, reason }) {
  await assertActorOwnsStudent(actor, studentId);
  const operation = amount > 0 ? 'reward' : 'deduction';
  const { history, balanceAfter } = await changeCoins({
    studentId,
    actorId: actor.id,
    amount,
    operation,
    reason,
    refType: 'manual',
  });
  return { balanceAfter, entry: history };
}

/** История коинов ученика (только для ученика, доступного actor'у). */
export async function studentHistory(actor, studentId, query) {
  await assertActorOwnsStudent(actor, studentId);
  const { page, limit, offset } = parsePagination(query);
  const { items, total } = await getStudentHistory(studentId, { limit, offset, page });
  return { items, meta: buildPageMeta(total, page, limit) };
}
