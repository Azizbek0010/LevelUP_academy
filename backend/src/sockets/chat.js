import { pool } from '../config/db.js';
import { saveMessage } from '../modules/chat/chat.service.js';
import {
  canStaffChatParent,
  canStaffChatPeer,
  dmRoom,
  userRoom,
  isUuid,
  DM_STAFF_ROLES,
} from '../modules/chat/chat.access.js';

const GLOBAL_ROLES = new Set(['main_admin', 'superadmin', 'admin', 'mentor']);

/**
 * Сокеты — только транспорт live-доставки; история персистится в chat_messages
 * и подгружается по REST GET /api/chat/:roomKey/messages.
 *
 * ЛИЧНЫЕ ДИАЛОГИ (staff ↔ parent)
 * -------------------------------
 * Доставка адресная: сообщение уходит ровно в две личные комнаты `user:<id>` —
 * отправителю и получателю. Событий вида `join(<чужая комната>)` здесь намеренно
 * НЕТ: раньше `chat:parent:join` пускал в комнату родителя любого сотрудника,
 * без проверки филиала и организации, из-за чего переписку читали и посторонние
 * сотрудники, и чужие организации. Без join'а подписаться на чужой диалог нечем.
 *
 * Право на диалог проверяется по данным (ребёнок родителя в группе ментора /
 * в филиале админа / в организации супер-админа) при КАЖДОЙ отправке —
 * см. chat.access.js.
 */
export function registerChat(io, socket, _redis) {
  const { user } = socket;

  // Личная комната — единственный адрес доставки для этого пользователя.
  socket.join(userRoom(user.id));

  // Общий чат сотрудников остаётся комнатой (он и задуман публичным внутри staff).
  if (GLOBAL_ROLES.has(user.role)) socket.join('global');

  // --- глобальный чат сотрудников ---
  socket.on('chat:global:send', async ({ body } = {}, ack) => {
    try {
      if (!GLOBAL_ROLES.has(user.role)) throw new Error('Forbidden');

      const message = await saveMessage({
        chatType: 'global',
        roomKey: 'global',
        senderId: user.id,
        branchId: user.branchId,
        body,
      });

      io.to('global').emit('chat:global:message', message);
      ack?.({ ok: true, id: message.id });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  /* --- личный диалог: сотрудник → родитель ИЛИ ученик ---
     `peerId` — новое имя поля: собеседником может быть и тот и другой, а
     `parentId` принимается по-прежнему, чтобы уже открытые вкладки со старым
     кодом не начали получать отказ на первое же сообщение. */
  socket.on('chat:dm:send', async ({ peerId, parentId, body } = {}, ack) => {
    try {
      const target = peerId ?? parentId;
      if (!DM_STAFF_ROLES.has(user.role)) throw new Error('Forbidden');
      if (!(await canStaffChatPeer(user, target))) throw new Error('Forbidden');

      const roomKey = dmRoom(user.id, target);
      const message = await saveMessage({
        chatType: 'direct',
        roomKey,
        senderId: user.id,
        branchId: user.branchId,
        body,
      });

      // Только двое: сам отправитель (эхо для других его вкладок) и собеседник.
      io.to(userRoom(user.id)).to(userRoom(target)).emit('chat:dm:message', message);
      ack?.({ ok: true, id: message.id, roomKey });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  // --- личный диалог: родитель → сотрудник ---
  // Родитель отвечает в существующую комнату, поэтому staffId берётся из неё,
  // а не из произвольного ввода: писать первым родитель не может.
  socket.on('chat:dm:reply', async ({ staffId, body } = {}, ack) => {
    try {
      if (user.role !== 'parent') throw new Error('Forbidden');

      const roomKey = dmRoom(staffId, user.id);
      // Сотрудник должен сохранять право на этот диалог — иначе отвечать некому.
      const staff = await findDmStaff(staffId);
      if (!staff || !(await canStaffChatParent(staff, user.id))) throw new Error('Forbidden');

      const message = await saveMessage({
        chatType: 'direct',
        roomKey,
        senderId: user.id,
        branchId: user.branchId,
        body,
      });

      io.to(userRoom(user.id)).to(userRoom(staffId)).emit('chat:dm:message', message);
      ack?.({ ok: true, id: message.id, roomKey });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });
}

/** Минимальный профиль сотрудника для повторной проверки прав (роль + скоуп). */
async function findDmStaff(staffId) {
  if (!isUuid(staffId)) return null;
  const { rows: [row] } = await pool.query(
    `SELECT id, role, organization_id, branch_id
       FROM users
      WHERE id = $1 AND deleted_at IS NULL AND status = 'active'`,
    [staffId],
  );
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    organizationId: row.organization_id,
    branchId: row.branch_id,
  };
}
