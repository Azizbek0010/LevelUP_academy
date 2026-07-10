import { loadMock } from './persist';

export interface MockGroup {
  id: string;
  name: string;
  mentorName: string;
  lessonDays: string[];
  lessonStartTime: string;
  lessonEndTime: string;
  monthlyFee: number;
  studentCount: number;
  status: 'active' | 'archived';
  kind?: 'individual' | 'group';
}

const DAY_LABEL: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

export function formatDays(days: string[]): string {
  return days.map((d) => DAY_LABEL[d] ?? d).join(' · ');
}

const DEFAULT_GROUPS: MockGroup[] = [
  {
    id: 'group-1',
    name: 'Frontend · Junior · MW-Evening',
    mentorName: 'Санжар Джураев',
    lessonDays: ['mon', 'wed', 'fri'],
    lessonStartTime: '18:00',
    lessonEndTime: '20:00',
    monthlyFee: 600_000,
    studentCount: 9,
    status: 'active',
  },
  {
    id: 'group-2',
    name: 'Python · Middle · TT-Morning',
    mentorName: 'Малика Шамсиева',
    lessonDays: ['tue', 'thu'],
    lessonStartTime: '10:00',
    lessonEndTime: '12:30',
    monthlyFee: 750_000,
    studentCount: 9,
    status: 'active',
  },
  {
    id: 'group-3',
    name: 'Дизайн UI/UX · Sat',
    mentorName: 'Феруза Комилова',
    lessonDays: ['sat'],
    lessonStartTime: '11:00',
    lessonEndTime: '14:00',
    monthlyFee: 550_000,
    studentCount: 8,
    status: 'active',
  },
  {
    id: 'group-4',
    name: 'English B2 · MWF',
    mentorName: 'Отабек Пулатов',
    lessonDays: ['mon', 'wed', 'fri'],
    lessonStartTime: '16:00',
    lessonEndTime: '17:30',
    monthlyFee: 450_000,
    studentCount: 7,
    status: 'active',
  },
  {
    id: 'group-5',
    name: 'DevOps · Weekend',
    mentorName: 'Санжар Джураев',
    lessonDays: ['sat', 'sun'],
    lessonStartTime: '15:00',
    lessonEndTime: '18:00',
    monthlyFee: 900_000,
    studentCount: 9,
    status: 'active',
  },
  {
    id: 'group-6',
    name: 'Android (архив 2024)',
    mentorName: 'Малика Шамсиева',
    lessonDays: ['tue', 'thu'],
    lessonStartTime: '19:00',
    lessonEndTime: '21:00',
    monthlyFee: 650_000,
    studentCount: 5,
    status: 'archived',
  },
];

export const MOCK_GROUPS_LIST: MockGroup[] = loadMock('groups', DEFAULT_GROUPS);
