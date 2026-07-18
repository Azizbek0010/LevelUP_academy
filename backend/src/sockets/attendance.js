import { pool } from '../config/db.js';

/**
 * Live-обновления davomat по группе.
 *
 * Ментор отмечает посещаемость обычным POST /api/mentor/attendance/groups/:id —
 * сервис после записи шлёт событие в комнату группы (см. attendance.service.js),
 * и открытый журнал у второго ментора той же группы или у админа филиала
 * обновляется без перезагрузки.
 *
 * Подписка — только на свои группы: право проверяется SQL-запросом при
 * `attendance:subscribe`, роли самой по себе недостаточно (иначе повторили бы
 * ошибку старого чата, где хватало быть «сотрудником»).
 */
export const attendanceRoom = (groupId) => `attendance:${groupId}`;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Может ли пользователь наблюдать журнал этой группы. */
async function canWatchGroup(user, groupId) {
  if (!UUID_RE.test(String(groupId ?? ''))) return false;

  const { rows: [group] } = await pool.query(
    `SELECT g.id, g.mentor_id, g.branch_id, b.organization_id
       FROM groups g
       JOIN branches b ON b.id = g.branch_id
      WHERE g.id = $1 AND g.deleted_at IS NULL`,
    [groupId],
  );
  if (!group) return false;

  if (user.role === 'mentor') return group.mentor_id === user.id;
  if (user.role === 'admin') return group.branch_id === user.branchId;
  if (user.role === 'superadmin') return group.organization_id === user.organizationId;
  return false;
}

export function registerAttendance(io, socket) {
  const { user } = socket;

  socket.on('attendance:subscribe', async ({ groupId } = {}, ack) => {
    try {
      if (!(await canWatchGroup(user, groupId))) throw new Error('Forbidden');
      socket.join(attendanceRoom(groupId));
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('attendance:unsubscribe', ({ groupId } = {}, ack) => {
    if (UUID_RE.test(String(groupId ?? ''))) socket.leave(attendanceRoom(groupId));
    ack?.({ ok: true });
  });
}
