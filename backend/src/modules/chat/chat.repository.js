import { pool } from '../../config/db.js';

export async function insertMessage({ chatType, roomKey, senderId, branchId, body, attachmentKey }) {
  const { rows: [message] } = await pool.query(
    `INSERT INTO chat_messages (chat_type, room_key, sender_id, branch_id, body, attachment_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, chat_type, room_key, sender_id, branch_id, body, attachment_key, created_at`,
    [chatType, roomKey, senderId, branchId ?? null, body, attachmentKey ?? null],
  );
  return message;
}

/** Cursor-пагинация: сообщения старше `before` (ISO timestamp), новые сверху. */
export async function findByRoom(roomKey, { limit = 50, before = null } = {}) {
  const { rows } = await pool.query(
    `SELECT m.id, m.chat_type, m.room_key, m.sender_id, m.body, m.attachment_key, m.created_at,
            u.first_name AS sender_first_name, u.last_name AS sender_last_name, u.role AS sender_role
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
      WHERE m.room_key = $1
        AND m.deleted_at IS NULL
        AND ($2::timestamptz IS NULL OR m.created_at < $2)
      ORDER BY m.created_at DESC
      LIMIT $3`,
    [roomKey, before, limit],
  );
  return rows;
}
