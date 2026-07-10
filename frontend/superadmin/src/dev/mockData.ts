/**
 * Static mock data for demo mode (no backend). Enable via VITE_DEMO=1
 * or automatically when the API is unreachable.
 */

export interface MockStudentFreeze {
  since: string;
  reason: string;
  expectedReturnAt: string | null; // ISO date, когда обещал вернуться
  note?: string;
}

export interface MockStudentMessage {
  id: string;
  studentId: string;
  message: string;
  via: 'telegram' | 'sms';
  senderId: string;
  senderName: string;
  senderRole: 'superadmin' | 'admin' | 'mentor';
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt: string; // время отправки
}

export interface MockStudent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  parentPhone: string;
  parentPhone2: string | null;
  telegramChatId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  groupCount: number;
  freeze?: MockStudentFreeze | null;
  lastVisitAt?: string | null;
}

const FIRST_NAMES = [
  'Азиз', 'Дилшод', 'Малика', 'Феруза', 'Шохрух', 'Отабек', 'Мадина', 'Камола',
  'Бекзод', 'Улугбек', 'Нилуфар', 'Зарина', 'Санжар', 'Джасур', 'Мохира', 'Гульнара',
  'Алишер', 'Рустам', 'Севара', 'Хушнуд', 'Азиза', 'Диёра', 'Икром', 'Лола',
  'Мухаммад', 'Нозима', 'Отабой', 'Парвина', 'Расул', 'Сарвиноз', 'Тимур', 'Умида',
  'Фаррух', 'Хумора', 'Шахло', 'Элёр',
];

const LAST_NAMES = [
  'Каримов', 'Юсупов', 'Расулов', 'Мирзаев', 'Абдуллаев', 'Умаров', 'Насриддинов',
  'Ибрагимов', 'Хамидов', 'Собиров', 'Кучкаров', 'Тошматов', 'Юлдашев', 'Хасанов',
  'Шамсиев', 'Джураев', 'Комилов', 'Пулатов', 'Эшонов', 'Тураев',
];

function phone(): string {
  const ops = ['90', '91', '93', '94', '97', '98', '99', '88'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let n = '';
  for (let i = 0; i < 7; i++) n += Math.floor(Math.random() * 10);
  return `+998${op}${n}`;
}

function nextDate(seed: number): string {
  const d = new Date();
  d.setDate(d.getDate() - seed);
  return d.toISOString();
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!;
}

import { loadMock } from './persist';

const FREEZE_REASONS = [
  'Болезнь',
  'Отъезд/командировка',
  'Финансовые трудности',
  'Летний отпуск',
  'Академический перерыв',
];

const DEFAULT_STUDENTS: MockStudent[] = Array.from({ length: 40 }, (_, i) => {
  const gender = i % 2;
  // Каждый 8-й студент в заморозке для демо.
  const isFrozen = i > 0 && i % 8 === 0;
  return {
    id: `student-${i.toString().padStart(3, '0')}`,
    firstName: pick(FIRST_NAMES, gender === 0 ? i * 7 : i * 5),
    lastName: pick(LAST_NAMES, i * 3),
    phone: i % 4 === 0 ? null : phone(),
    parentPhone: phone(),
    parentPhone2: i % 5 === 0 ? phone() : null,
    telegramChatId: i % 3 === 0 ? String(100000000 + i * 12345) : null,
    isArchived: i >= 35,
    createdAt: nextDate(180 - i * 3),
    updatedAt: nextDate(60 - i),
    groupCount: i % 6 === 0 ? 0 : i % 3 === 0 ? 2 : 1,
    freeze: isFrozen
      ? {
          since: nextDate(14 + (i % 30)),
          reason: pick(FREEZE_REASONS, i),
          // Каждая заморозка — с обещанной датой возврата.
          // i=8 → сегодня, i=16 → завтра, i=24 → через 12 дней, i=32 → через 20 дней
          expectedReturnAt: new Date(
            Date.now() +
              (i === 8 ? 0 : i === 16 ? 1 : i === 24 ? 12 : 20) *
                24 *
                60 *
                60 *
                1000,
          )
            .toISOString()
            .slice(0, 10),
          note:
            i % 16 === 0
              ? 'Родители обещали вернуться после Ozod bayrami'
              : undefined,
        }
      : null,
    // Онлайн: часть недавно, часть давно, часть — null (не подключался)
    lastVisitAt:
      i % 5 === 0
        ? null
        : new Date(
            Date.now() - ((i * 173) % (14 * 24 * 60)) * 60_000,
          ).toISOString(),
  };
});

// bumped to v4 — фикс seed: 2 студента с возвратом сегодня/завтра
export const MOCK_STUDENTS: MockStudent[] = loadMock('students-v4', DEFAULT_STUDENTS);

// ────────── Отправленные студенту сообщения (SMS/Telegram) ──────────

const DEFAULT_MESSAGES: MockStudentMessage[] = [];
export const MOCK_STUDENT_MESSAGES: MockStudentMessage[] = loadMock(
  'student-messages',
  DEFAULT_MESSAGES,
);

export const MOCK_GROUPS = [
  { id: 'group-1', name: 'Frontend · Junior · MW-Evening', status: 'active' as const },
  { id: 'group-2', name: 'Python · Middle · TT-Morning', status: 'active' as const },
  { id: 'group-3', name: 'Дизайн UI/UX · Sat', status: 'active' as const },
  { id: 'group-4', name: 'English B2 · MWF', status: 'active' as const },
  { id: 'group-5', name: 'DevOps · Weekend', status: 'active' as const },
  { id: 'group-6', name: 'Android (архив 2024)', status: 'archived' as const },
];

export function mockStudentDetail(id: string) {
  const s = MOCK_STUDENTS.find((x) => x.id === id) ?? MOCK_STUDENTS[0]!;
  const groupCount = s.groupCount;
  const groups = MOCK_GROUPS.slice(0, groupCount).map((g, i) => ({
    id: g.id,
    name: g.name,
    status: g.status,
    joinedAt: nextDate(30 + i * 10),
  }));
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const methods = ['cash', 'card', 'split'] as const;
  const recentPayments = groupCount === 0
    ? []
    : Array.from({ length: 3 }, (_, i) => {
        const total = currentYear * 12 + currentMonth - 1 - i;
        // Час дня: 9..18, минуты 0..59 — детерминированно из id+i
        const seed = s.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0) + i * 37;
        const hour = 9 + (seed % 10);
        const minute = (seed * 7) % 60;
        const paidDate = new Date(Date.now() - (i * 30 + 5) * 86400_000);
        paidDate.setHours(hour, minute, 0, 0);
        return {
          id: `pay-${s.id}-${i}`,
          amount: ['450000.00', '600000.00', '750000.00', '900000.00'][i % 4]!,
          method: methods[i % methods.length]!,
          periodMonth: (total % 12) + 1,
          periodYear: Math.floor(total / 12),
          paidAt: paidDate.toISOString(),
        };
      });
  const present = groupCount === 0 ? 0 : 20 + (Math.abs(s.id.length) % 15);
  const absent = groupCount === 0 ? 0 : Math.max(1, present % 6);

  const paidTotal = recentPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );
  // «месяцев оплачено» = количество разных периодов в истории (в реале — все, тут 3 → 3)
  const monthsPaid = recentPayments.length;
  // Долги — эвристика: если 1 группа и нет платежей за текущий месяц, есть debt
  const paidCurrentMonth = recentPayments.some(
    (p) => p.periodMonth === currentMonth && p.periodYear === currentYear,
  );
  const monthlyFee = groupCount === 0 ? 0 : 600_000 * groupCount;
  const currentDebt =
    s.freeze || groupCount === 0 || paidCurrentMonth ? 0 : monthlyFee;
  const currentMonthStatus: 'paid' | 'debt' | 'frozen' | 'unknown' = s.freeze
    ? 'frozen'
    : paidCurrentMonth
      ? 'paid'
      : groupCount === 0
        ? 'unknown'
        : 'debt';

  const sentMessages = MOCK_STUDENT_MESSAGES.filter(
    (m) => m.studentId === s.id,
  )
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, 50);

  return {
    ...s,
    groups,
    recentPayments,
    attendanceStats: { present, absent, unknown: 0 },
    monthsPaid,
    paidTotal,
    currentDebt,
    currentMonthStatus,
    freeze: s.freeze ?? null,
    lastVisitAt: s.lastVisitAt ?? null,
    sentMessages,
  };
}

interface MockUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin';
}

const DEFAULT_USER: MockUserProfile = {
  id: 'demo-superadmin',
  email: 'super@educrm.local',
  firstName: 'Азиз',
  lastName: 'Каримов',
  role: 'superadmin',
};

export const MOCK_USER: MockUserProfile = loadMock('user', DEFAULT_USER);
