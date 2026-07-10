import { loadMock } from './persist';

export type AnnouncementTarget = 'all-staff' | 'all-admins' | 'all-mentors' | `branch:${string}`;

export interface MockAnnouncementReader {
  id: string;
  name: string;
  role: 'superadmin' | 'admin' | 'mentor';
  readAt: string | null;
  lastOnlineAt: string | null;
}

export interface MockAnnouncement {
  id: string;
  title: string;
  body: string;
  targetType: AnnouncementTarget;
  targetLabel: string;
  senderName: string;
  recipientCount: number;
  readCount: number;
  readers: MockAnnouncementReader[];
  sentAt: string;
}

function isoAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

// Пул сотрудников — часть прочитала, часть нет.
const STAFF = {
  super: { id: 'user-super-1', name: 'Азиз Каримов', role: 'superadmin' as const },
  admin1: { id: 'user-admin-1', name: 'Нодира Юсупова', role: 'admin' as const },
  admin2: { id: 'user-admin-2', name: 'Умид Ахмедов', role: 'admin' as const },
  admin3: { id: 'user-admin-3', name: 'Дилшод Ганиев', role: 'admin' as const },
  m1: { id: 'user-mentor-1', name: 'Санжар Джураев', role: 'mentor' as const },
  m2: { id: 'user-mentor-2', name: 'Малика Шамсиева', role: 'mentor' as const },
  m3: { id: 'user-mentor-3', name: 'Отабек Пулатов', role: 'mentor' as const },
  m4: { id: 'user-mentor-4', name: 'Феруза Комилова', role: 'mentor' as const },
  m5: { id: 'user-mentor-5', name: 'Джасур Каримов', role: 'mentor' as const },
  m6: { id: 'user-mentor-6', name: 'Хадича Тохирова', role: 'mentor' as const },
  m7: { id: 'user-mentor-7', name: 'Иброхим Собиров', role: 'mentor' as const },
  m8: { id: 'user-mentor-8', name: 'Нилуфар Абдуллаева', role: 'mentor' as const },
};

const DEFAULT_ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Плановое повышение цен с 1 сентября',
    body: 'Уважаемые коллеги!\n\nС 1 сентября 2026 г. базовый абонемент вырастает на 15% по всем группам, кроме языковых. Обновлённый прайс в приложении к письму. Прошу уведомить родителей за 2 недели.',
    targetType: 'all-staff',
    targetLabel: 'Все сотрудники',
    senderName: 'Азиз Каримов',
    recipientCount: 12,
    readCount: 8,
    readers: [
      { ...STAFF.admin1, readAt: hoursAgo(46), lastOnlineAt: minutesAgo(12) },
      { ...STAFF.admin2, readAt: hoursAgo(44), lastOnlineAt: minutesAgo(35) },
      { ...STAFF.admin3, readAt: hoursAgo(40), lastOnlineAt: hoursAgo(2) },
      { ...STAFF.m1, readAt: hoursAgo(38), lastOnlineAt: hoursAgo(3) },
      { ...STAFF.m2, readAt: hoursAgo(30), lastOnlineAt: hoursAgo(1) },
      { ...STAFF.m3, readAt: hoursAgo(28), lastOnlineAt: minutesAgo(45) },
      { ...STAFF.m4, readAt: hoursAgo(12), lastOnlineAt: minutesAgo(8) },
      { ...STAFF.m5, readAt: hoursAgo(6), lastOnlineAt: minutesAgo(3) },
      // не прочитали:
      { ...STAFF.m6, readAt: null, lastOnlineAt: hoursAgo(72) },
      { ...STAFF.m7, readAt: null, lastOnlineAt: hoursAgo(28) },
      { ...STAFF.m8, readAt: null, lastOnlineAt: hoursAgo(4) },
      { ...STAFF.super, readAt: null, lastOnlineAt: minutesAgo(2) },
    ],
    sentAt: isoAgo(2),
  },
  {
    id: 'ann-2',
    title: 'Инвентаризация в филиалах на этой неделе',
    body: 'В четверг с 20:00 в каждом филиале — сверка оборудования. Ответственный — админ филиала. Отчёты присылать до конца недели.',
    targetType: 'all-admins',
    targetLabel: 'Все админы',
    senderName: 'Азиз Каримов',
    recipientCount: 3,
    readCount: 3,
    readers: [
      { ...STAFF.admin1, readAt: hoursAgo(112), lastOnlineAt: minutesAgo(12) },
      { ...STAFF.admin2, readAt: hoursAgo(100), lastOnlineAt: minutesAgo(35) },
      { ...STAFF.admin3, readAt: hoursAgo(96), lastOnlineAt: hoursAgo(2) },
    ],
    sentAt: isoAgo(5),
  },
  {
    id: 'ann-3',
    title: 'Митап менторов в субботу',
    body: 'В субботу в 14:00 — общий сбор менторов в центральном филиале. Обмен опытом, разбор кейсов, кофе.',
    targetType: 'all-mentors',
    targetLabel: 'Все менторы',
    senderName: 'Азиз Каримов',
    recipientCount: 6,
    readCount: 4,
    readers: [
      { ...STAFF.m1, readAt: hoursAgo(200), lastOnlineAt: hoursAgo(3) },
      { ...STAFF.m2, readAt: hoursAgo(180), lastOnlineAt: hoursAgo(1) },
      { ...STAFF.m3, readAt: hoursAgo(150), lastOnlineAt: minutesAgo(45) },
      { ...STAFF.m4, readAt: hoursAgo(90), lastOnlineAt: minutesAgo(8) },
      // не прочитали:
      { ...STAFF.m5, readAt: null, lastOnlineAt: minutesAgo(3) },
      { ...STAFF.m6, readAt: null, lastOnlineAt: hoursAgo(72) },
    ],
    sentAt: isoAgo(9),
  },
];

// bumped to v2 для сброса localStorage-кэша после добавления readers
export const MOCK_ANNOUNCEMENTS: MockAnnouncement[] = loadMock('announcements-v3', DEFAULT_ANNOUNCEMENTS);
