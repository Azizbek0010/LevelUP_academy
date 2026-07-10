import { loadMock } from './persist';

export type UserRole = 'superadmin' | 'admin' | 'mentor';

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  note?: string | null;
  workingSince?: string | null;
  position?: string | null;
}

function phone(): string {
  const ops = ['90', '91', '93', '94', '97', '98', '99', '88'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let n = '';
  for (let i = 0; i < 7; i++) n += Math.floor(Math.random() * 10);
  return `+998${op}${n}`;
}

const NOW = new Date();

function daysAgo(d: number): string {
  return new Date(NOW.getTime() - d * 86400_000).toISOString();
}

const DEFAULT_USERS: MockUser[] = [
  {
    id: 'user-super-1',
    firstName: 'Азиз',
    lastName: 'Каримов',
    email: 'super@educrm.local',
    phone: phone(),
    role: 'superadmin',
    isActive: true,
    createdAt: daysAgo(200),
    workingSince: daysAgo(200),
    position: 'Основатель · Super Admin',
    note: 'Владелец LevelUp Academy. Отвечает за всё сразу — от финансов до расписания.',
  },
  {
    id: 'user-admin-1',
    firstName: 'Нодира',
    lastName: 'Юсупова',
    email: 'admin@educrm.local',
    phone: phone(),
    role: 'admin',
    isActive: true,
    createdAt: daysAgo(180),
    workingSince: daysAgo(180),
    position: 'Админ центрального филиала',
    note: 'Работает 6 месяцев, отвечает за расписание и приёмку студентов. Хорошо ведёт учёт платежей.',
  },
  {
    id: 'user-mentor-1',
    firstName: 'Санжар',
    lastName: 'Джураев',
    email: 'mentor1@educrm.local',
    phone: phone(),
    role: 'mentor',
    isActive: true,
    createdAt: daysAgo(150),
    workingSince: daysAgo(150),
    position: 'Frontend · Junior группы',
    note: 'Ведёт группу Frontend Junior · MW-Evening. 5 лет опыта в React. Строгий, но студенты его любят.',
  },
  {
    id: 'user-mentor-2',
    firstName: 'Малика',
    lastName: 'Шамсиева',
    email: 'mentor2@educrm.local',
    phone: phone(),
    role: 'mentor',
    isActive: true,
    createdAt: daysAgo(120),
    workingSince: daysAgo(120),
    position: 'Python · Middle',
    note: 'Python + Data Science. Ведёт Middle-группу, готовит студентов к junior-собеседованиям.',
  },
  {
    id: 'user-mentor-3',
    firstName: 'Отабек',
    lastName: 'Пулатов',
    email: 'mentor3@educrm.local',
    phone: phone(),
    role: 'mentor',
    isActive: true,
    createdAt: daysAgo(100),
    workingSince: daysAgo(100),
    position: 'English B2 · IELTS',
    note: 'Английский на уровне носителя, готовит на IELTS. Стабильно 100% явка студентов.',
  },
  {
    id: 'user-mentor-4',
    firstName: 'Феруза',
    lastName: 'Комилова',
    email: 'mentor4@educrm.local',
    phone: phone(),
    role: 'mentor',
    isActive: true,
    createdAt: daysAgo(60),
    workingSince: daysAgo(60),
    position: 'UI/UX Design',
    note: 'Новая в команде — 2 месяца. Ведёт дизайн-группу по субботам. Молодая, много идей.',
  },
  {
    id: 'user-mentor-5',
    firstName: 'Икром',
    lastName: 'Собиров',
    email: 'mentor5@educrm.local',
    phone: phone(),
    role: 'mentor',
    isActive: false,
    createdAt: daysAgo(300),
    workingSince: daysAgo(300),
    position: 'Android (архив)',
    note: 'В архиве с марта 2026. Ушёл на удалёнку в другую компанию, оставили запись.',
  },
];

// bumped to v2 после добавления note/position/workingSince
export const MOCK_USERS: MockUser[] = loadMock('users-v2', DEFAULT_USERS);
