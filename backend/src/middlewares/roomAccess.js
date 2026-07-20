import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { assertDmAccess } from '../modules/chat/chat.access.js';

const STAFF = new Set(['main_admin', 'superadmin', 'admin', 'mentor']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Доступ к комнате чата по `:roomKey` (требует authenticate до себя):
 *   - global      — все, кроме студентов;
 *   - dm:<staffId>:<parentId> — только эти двое (см. chat.access.js);
 *   - group:<id>  — staff уровня филиала+ или участник группы (ментор/студент).
 *
 * Тип `parent:<id>` УДАЛЁН: одна общая комната на родителя означала, что любой
 * сотрудник читает переписку любого другого сотрудника с этим родителем, а
 * проверка «просто staff» пропускала и чужие организации. Личные диалоги теперь
 * живут в `dm:` с проверкой реальной связи в данных.
 */
export async function requireRoomAccess(req, _res, next) {
  try {
    const { user } = req;
    if (!user) return next(new AppError(401, 'Authentication required'));

    const roomKey = req.params.roomKey ?? '';

    if (roomKey === 'global') {
      if (user.role === 'student') return next(new AppError(403, 'No access to this room'));
      return next();
    }

    const sep = roomKey.indexOf(':');
    const type = sep === -1 ? roomKey : roomKey.slice(0, sep);
    const id = sep === -1 ? '' : roomKey.slice(sep + 1);

    // dm:<staffId>:<parentId> — разбирается целиком, участников ровно двое.
    if (type === 'dm') {
      await assertDmAccess(user, roomKey);
      return next();
    }

    if (!UUID_RE.test(id)) return next(new AppError(400, 'Invalid room key'));

    if (type === 'group') {
      // управленцы видят любые группы; ментор/студент — только свои
      if (user.role === 'main_admin' || user.role === 'superadmin' || user.role === 'admin') {
        return next();
      }
      const { rows } = await pool.query(
        `SELECT 1
           FROM groups g
          WHERE g.id = $1
            AND (g.mentor_id = $2
                 OR EXISTS (SELECT 1 FROM group_students gs
                             WHERE gs.group_id = g.id
                               AND gs.student_id = $2
                               AND gs.left_at IS NULL))
          LIMIT 1`,
        [id, user.id],
      );
      if (rows.length) return next();
      return next(new AppError(403, 'No access to this room'));
    }

    return next(new AppError(400, 'Unknown room type'));
  } catch (err) {
    next(err);
  }
}
