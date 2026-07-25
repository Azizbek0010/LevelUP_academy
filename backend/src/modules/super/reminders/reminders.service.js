import { AppError } from '../../../utils/AppError.js';
import { notificationQueue } from '../../../queues/notification.queue.js';
import * as repo from './reminders.repository.js';

function mapRow(r) {
  return {
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    parentName: r.parent_name ?? '—',
    message: r.message,
    status: r.status,
    error: r.error,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  };
}

export async function listReminders(orgId) {
  const rows = await repo.listByOrg(orgId);
  const items = rows.map(mapRow);
  return { items, reminders: items, total: items.length };
}

/**
 * Повторная постановка того же job'а в очередь с тем же payload. История не
 * переписывается — старая (failed) строка остаётся как есть, новая попытка
 * появится отдельной строкой, когда слушатель увидит её completed/failed.
 */
export async function resendReminder(orgId, id) {
  const row = await repo.getById(orgId, id);
  if (!row) throw new AppError(404, 'Reminder not found');

  await notificationQueue.add(row.kind, row.payload);
  return { id: row.id, requeued: true };
}

export async function deleteReminder(orgId, id) {
  const row = await repo.deleteById(orgId, id);
  if (!row) throw new AppError(404, 'Reminder not found');
  return { id: row.id };
}
