import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as chatService from './chat.service.js';
import { listStaffContacts, listStaffStudentContacts } from './chat.access.js';

/**
 * GET /api/chat/contacts — все, кому сотрудник вправе писать: родители и сами
 * ученики.
 *
 * `peer_type` обязателен клиенту: в списке рядом стоят мать и её ребёнок с
 * одной фамилией, и без пометки непонятно, кому пишешь. Сортировка общая — по
 * времени последнего сообщения, иначе свежий диалог с учеником уезжал бы под
 * список молчащих родителей.
 */
export const getContacts = asyncHandler(async (req, res) => {
  const [parents, students] = await Promise.all([
    listStaffContacts(req.user),
    listStaffStudentContacts(req.user),
  ]);

  const data = [
    ...parents.map((c) => ({ ...c, peer_type: 'parent' })),
    ...students.map((c) => ({ ...c, peer_type: 'student' })),
  ].sort((a, b) => {
    if (a.last_message_at && b.last_message_at) {
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    }
    if (a.last_message_at) return -1;
    if (b.last_message_at) return 1;
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });

  res.json({ success: true, data });
});

/** POST /api/chat/:roomKey/read — пометить входящие комнаты прочитанными. */
export const markRead = asyncHandler(async (req, res) => {
  const updated = await chatService.markRoomRead(req.params.roomKey, req.user.id);
  res.json({ success: true, data: { updated } });
});

/** GET /api/chat/:roomKey/messages?limit=50&cursor=<ISO timestamp> */
export const getMessages = asyncHandler(async (req, res) => {
  const { roomKey } = req.params;
  const { limit, cursor } = req.query;

  // границы на входе: limit ∈ [1, 100], cursor — валидный timestamp
  // (иначе отрицательный LIMIT / битый каст ::timestamptz = 500 из Postgres)
  if (cursor !== undefined && Number.isNaN(Date.parse(cursor))) {
    throw new AppError(400, 'cursor must be a valid ISO timestamp');
  }

  const data = await chatService.getRoomHistory(roomKey, {
    limit: Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 50)),
    before: cursor ?? null,
  });

  res.json({ success: true, data });
});
