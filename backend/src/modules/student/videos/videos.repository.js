import { pool } from '../../../config/db.js';

/** Видео по группам студента, без архивных. */
export async function listForGroups(groupIds) {
  if (groupIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT id, group_id, title, duration_sec, created_at
       FROM videos
      WHERE group_id = ANY($1) AND deleted_at IS NULL AND is_archived = false
      ORDER BY created_at DESC`,
    [groupIds],
  );
  return rows;
}

export async function getById(videoId) {
  const { rows: [video] } = await pool.query(
    `SELECT id, group_id, title, video_key, duration_sec
       FROM videos
      WHERE id = $1 AND deleted_at IS NULL AND is_archived = false`,
    [videoId],
  );
  return video ?? null;
}
