import { requireMentorGroup } from '../shared/groupAccess.js';
import { emitTo } from '../../../sockets/io.js';
import { attendanceRoom } from '../../../sockets/attendance.js';
import { AppError } from '../../../utils/AppError.js';
import * as repo from './attendance.repository.js';

/* Ментор отмечает журнал только за сегодняшний урок: ни вчерашний, ни
   завтрашний. Проверка живёт ЗДЕСЬ, а не в контроллере, потому что этот сервис
   — единственная общая точка REST-эндпоинта и сокет-события `attendance:mark`;
   поставь её выше по стеку, и второй транспорт прошёл бы мимо.

   Дата считается по ташкентскому времени, а не по UTC. С полуночи до пяти утра
   по местному UTC всё ещё «вчера», и ментор вечерней группы получал бы отказ
   на собственном уроке. */
const TZ = 'Asia/Tashkent';

function todayLocal() {
  // en-CA даёт ровно YYYY-MM-DD — тот же формат, в котором приходит lessonDate
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

function assertToday(lessonDate) {
  const today = todayLocal();
  if (lessonDate === today) return;
  throw new AppError(
    422,
    lessonDate > today
      ? 'Kelajakdagi dars uchun davomat belgilab bo\'lmaydi'
      : 'O\'tgan kunlar davomatini o\'zgartirib bo\'lmaydi',
  );
}

/** Проставить/обновить davomat группы на дату урока — только свой ментор. */
export async function markAttendance({ mentorId, groupId, lessonDate, records }) {
  assertToday(lessonDate);
  const group = await requireMentorGroup(mentorId, groupId);
  const saved = await repo.upsertMany({
    branchId: group.branch_id,
    groupId,
    markedBy: mentorId,
    lessonDate,
    records,
  });

  // Live-обновление подписчикам журнала группы. Транспорт вторичен: если сокет-
  // сервер не поднят (воркер), emitTo молча пропускает — отметка уже сохранена.
  emitTo(attendanceRoom(groupId), 'attendance:updated', {
    groupId,
    lessonDate,
    markedBy: mentorId,
    records: saved,
  });

  return saved;
}

/** Чтение davomat группы: точная дата либо диапазон дат. */
export async function getGroupAttendance({ mentorId, groupId, date, from, to }) {
  await requireMentorGroup(mentorId, groupId);
  if (date) return repo.findByGroupAndDate(groupId, date);
  return repo.findByGroupAndRange(groupId, from, to);
}
