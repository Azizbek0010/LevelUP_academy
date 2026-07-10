import { MOCK_STUDENTS } from './mockData';
import { loadMock } from './persist';

export interface MockReminder {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  message: string;
  periodMonth: number;
  periodYear: number;
  status: 'sent' | 'failed' | 'pending';
  telegramMessageId: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

function iso(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  d.setHours(10, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

const DEFAULT_REMINDERS: MockReminder[] = (() => {
  const now = new Date();
  const period = { month: now.getMonth() + 1, year: now.getFullYear() };
  const debtors = MOCK_STUDENTS.filter((s) => !s.isArchived).slice(0, 12);

  return debtors.map((s, i) => {
    const rand = Math.random();
    const status: MockReminder['status'] =
      i === 0 ? 'pending' : rand < 0.85 ? 'sent' : 'failed';
    const created = iso(i);
    return {
      id: `rem-${i}`,
      studentId: s.id,
      studentName: `${s.lastName} ${s.firstName}`,
      parentPhone: s.parentPhone,
      message: `Здравствуйте! Напоминаем об оплате за ${String(period.month).padStart(2, '0')}.${period.year}. Спасибо!`,
      periodMonth: period.month,
      periodYear: period.year,
      status,
      telegramMessageId: status === 'sent' ? String(10_000_000 + i * 137) : null,
      error:
        status === 'failed'
          ? 'Telegram: chat not found (родитель не активировал бота)'
          : null,
      sentAt: status === 'pending' ? null : created,
      createdAt: created,
    };
  });
})();

export const MOCK_REMINDERS: MockReminder[] = loadMock('reminders', DEFAULT_REMINDERS);
