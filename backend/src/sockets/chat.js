import { saveMessage } from '../modules/chat/chat.service.js';

const GLOBAL_ROLES = new Set(['main_admin', 'superadmin', 'admin', 'mentor', 'parent']);
const STAFF_ROLES = new Set(['main_admin', 'superadmin', 'admin', 'mentor']);
const parentRoom = (parentId) => `parent:${parentId}`;

/**
 * Сокеты — только транспорт live-доставки; история персистится в chat_messages
 * и подгружается по REST GET /api/chat/:roomKey/messages.
 */
export function registerChat(io, socket, _redis) {
  const { user } = socket;

  // --- вход в комнаты по роли ---
  if (GLOBAL_ROLES.has(user.role)) socket.join('global');
  if (user.role === 'parent') socket.join(parentRoom(user.id));

  // --- глобальный чат ---
  socket.on('chat:global:send', async ({ body }, ack) => {
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

  // --- директ Staff → Parent ---
  socket.on('chat:parent:send', async ({ parentId, body }, ack) => {
    try {
      if (!STAFF_ROLES.has(user.role)) throw new Error('Forbidden');

      const message = await saveMessage({
        chatType: 'direct',
        roomKey: parentRoom(parentId),
        senderId: user.id,
        branchId: user.branchId,
        body,
      });

      io.to(parentRoom(parentId)).emit('chat:parent:message', message);
      socket.emit('chat:parent:message', message); // эхо отправителю
      ack?.({ ok: true, id: message.id });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  // ответ родителя идёт в ту же комнату — staff просто join'ится
  socket.on('chat:parent:join', ({ parentId }) => {
    if (STAFF_ROLES.has(user.role)) {
      socket.join(parentRoom(parentId));
    }
  });
}
