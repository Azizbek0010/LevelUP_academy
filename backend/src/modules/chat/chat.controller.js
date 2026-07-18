import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as chatService from './chat.service.js';
import { listStaffContacts } from './chat.access.js';

/** GET /api/chat/contacts — родители, с которыми сотрудник вправе переписываться. */
export const getContacts = asyncHandler(async (req, res) => {
  const data = await listStaffContacts(req.user);
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
