import { AppError } from '../../utils/AppError.js';
import * as chatRepository from './chat.repository.js';

const MAX_BODY_LENGTH = 4000;

/** Единственная точка записи сообщений — используется и сокетами, и REST. */
export async function saveMessage({ chatType, roomKey, senderId, branchId, body, attachmentKey }) {
  const trimmed = body?.trim();
  if (!trimmed) throw new AppError(422, 'Message body is required');
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new AppError(422, `Message is too long (max ${MAX_BODY_LENGTH} chars)`);
  }

  return chatRepository.insertMessage({
    chatType,
    roomKey,
    senderId,
    branchId,
    body: trimmed,
    attachmentKey,
  });
}

/** Прочитано: доступ к комнате уже проверен middleware'ом requireRoomAccess. */
export async function markRoomRead(roomKey, readerId) {
  return chatRepository.markRoomRead(roomKey, readerId);
}

export async function getRoomHistory(roomKey, { limit, before }) {
  const messages = await chatRepository.findByRoom(roomKey, { limit, before });
  return {
    messages,
    nextCursor: messages.length === limit ? messages.at(-1).created_at : null,
  };
}
