import { requireMentorGroup } from '../shared/groupAccess.js';
import * as repo from './attendance.repository.js';

/** Проставить/обновить davomat группы на дату урока — только свой ментор. */
export async function markAttendance({ mentorId, groupId, lessonDate, records }) {
  const group = await requireMentorGroup(mentorId, groupId);
  return repo.upsertMany({ branchId: group.branch_id, groupId, markedBy: mentorId, lessonDate, records });
}

/** Чтение davomat группы: точная дата либо диапазон дат. */
export async function getGroupAttendance({ mentorId, groupId, date, from, to }) {
  await requireMentorGroup(mentorId, groupId);
  if (date) return repo.findByGroupAndDate(groupId, date);
  return repo.findByGroupAndRange(groupId, from, to);
}
