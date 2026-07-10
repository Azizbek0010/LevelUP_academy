import { MOCK_GROUPS_LIST } from './mockGroups';
import { MOCK_STUDENTS } from './mockData';
import { loadMock, saveMock } from './persist';

export interface MockLesson {
  id: string;
  groupId: string;
  groupName: string;
  startsAt: string;
  endsAt: string;
  present: number;
  absent: number;
  unknown: number;
  totalStudents: number;
}

export interface LessonStudentMark {
  studentId: string;
  studentName: string;
  parentPhone: string;
  status: 'present' | 'absent' | 'unknown';
  absenceReason: string | null;
}

function iso(daysBack: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const MOCK_LESSONS: MockLesson[] = (() => {
  const out: MockLesson[] = [];
  const active = MOCK_GROUPS_LIST.filter((g) => g.status === 'active');
  let id = 1;
  for (let offset = 14; offset >= 0; offset--) {
    for (const g of active) {
      const day = new Date();
      day.setDate(day.getDate() - offset);
      const dow = day.getDay();
      const label = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dow]!;
      if (!g.lessonDays.includes(label)) continue;

      const [sh, sm] = g.lessonStartTime.split(':').map(Number);
      const [eh, em] = g.lessonEndTime.split(':').map(Number);

      const total = g.studentCount;
      const isPast = offset > 0 || day.getTime() < Date.now();
      const present = isPast ? Math.floor(total * (0.7 + Math.random() * 0.28)) : 0;
      const absent = isPast ? Math.max(0, total - present - Math.floor(Math.random() * 2)) : 0;
      const unknown = total - present - absent;

      out.push({
        id: `lesson-${id++}`,
        groupId: g.id,
        groupName: g.name,
        startsAt: iso(offset, sh!, sm),
        endsAt: iso(offset, eh!, em),
        present,
        absent,
        unknown,
        totalStudents: total,
      });
    }
  }
  return out.reverse();
})();

/** Persistent overrides for attendance marks. Loaded from localStorage on init. */
type PersistedOverrides = Record<string, Record<string, LessonStudentMark>>;
const PERSISTED: PersistedOverrides = loadMock('attendance', {});
const ROSTER_OVERRIDES = new Map<string, Map<string, LessonStudentMark>>();
for (const [lessonId, marks] of Object.entries(PERSISTED)) {
  const inner = new Map<string, LessonStudentMark>();
  for (const [sid, m] of Object.entries(marks)) inner.set(sid, m);
  ROSTER_OVERRIDES.set(lessonId, inner);
}

function persistOverrides(): void {
  const out: PersistedOverrides = {};
  for (const [lessonId, marks] of ROSTER_OVERRIDES) {
    const obj: Record<string, LessonStudentMark> = {};
    for (const [sid, m] of marks) obj[sid] = m;
    out[lessonId] = obj;
  }
  saveMock('attendance', out);
}

function overrideKey(lessonId: string): Map<string, LessonStudentMark> {
  let m = ROSTER_OVERRIDES.get(lessonId);
  if (!m) {
    m = new Map();
    ROSTER_OVERRIDES.set(lessonId, m);
  }
  return m;
}

export function setLessonMark(
  lessonId: string,
  studentId: string,
  status: LessonStudentMark['status'],
  absenceReason: string | null = null,
): void {
  const roster = getLessonRoster(lessonId);
  const current = roster.find((r) => r.studentId === studentId);
  if (!current) return;
  const next: LessonStudentMark = { ...current, status, absenceReason };
  overrideKey(lessonId).set(studentId, next);

  const lesson = MOCK_LESSONS.find((l) => l.id === lessonId);
  if (lesson) {
    const updated = getLessonRoster(lessonId);
    lesson.present = updated.filter((r) => r.status === 'present').length;
    lesson.absent = updated.filter((r) => r.status === 'absent').length;
    lesson.unknown = updated.filter((r) => r.status === 'unknown').length;
  }
  persistOverrides();
}

/**
 * Deterministic per-lesson roster with in-session overrides.
 */
export function getLessonRoster(lessonId: string): LessonStudentMark[] {
  const lesson = MOCK_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return [];

  const activeStudents = MOCK_STUDENTS.filter((s) => !s.isArchived);
  const groupHash = lesson.groupId.split('-').reduce((h, s) => h + s.charCodeAt(0), 0);
  const roster = activeStudents.slice(groupHash % 5, (groupHash % 5) + lesson.totalStudents);

  const reasons = [
    'болен',
    'семейные обстоятельства',
    'уехал в командировку',
    'не предупредил',
    null,
  ];

  const marks: LessonStudentMark[] = [];
  let presentLeft = lesson.present;
  let absentLeft = lesson.absent;

  for (let i = 0; i < roster.length; i++) {
    const s = roster[i]!;
    let status: LessonStudentMark['status'];
    if (presentLeft > 0) {
      status = 'present';
      presentLeft--;
    } else if (absentLeft > 0) {
      status = 'absent';
      absentLeft--;
    } else {
      status = 'unknown';
    }
    marks.push({
      studentId: s.id,
      studentName: `${s.lastName} ${s.firstName}`,
      parentPhone: s.parentPhone,
      status,
      absenceReason: status === 'absent' ? reasons[i % reasons.length] ?? null : null,
    });
  }

  const overrides = ROSTER_OVERRIDES.get(lessonId);
  if (overrides && overrides.size > 0) {
    return marks.map((m) => overrides.get(m.studentId) ?? m);
  }
  return marks;
}
