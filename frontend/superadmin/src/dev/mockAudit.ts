import { loadMock } from './persist';

export type AuditAction =
  | 'branch.created' | 'branch.updated' | 'branch.archived' | 'branch.deleted'
  | 'user.created' | 'user.updated' | 'user.password_changed' | 'user.archived' | 'user.deleted'
  | 'student.created' | 'student.updated' | 'student.archived' | 'student.deleted'
  | 'group.created' | 'group.updated' | 'group.archived' | 'group.deleted'
  | 'attendance.marked'
  | 'reminder.sent' | 'reminder.deleted'
  | 'rule.enabled' | 'rule.disabled' | 'rule.updated'
  | 'announcement.sent'
  | 'session.login' | 'session.logout';

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: 'superadmin' | 'admin' | 'mentor';
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  entityLabel: string;
  meta: Record<string, string | number | boolean | null> | null;
  status?: 'success' | 'failure';
  statusCode?: number;
  ip: string;
  userAgent: string;
  createdAt: string;
}

function isoAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function randIP(): string {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

const AGENTS = [
  'Yandex Browser 24.0 (Windows 11)',
  'Chrome 132 (macOS 15)',
  'Safari 18 (iPad)',
  'Firefox 133 (Ubuntu)',
];

const DEFAULT_AUDIT: AuditEntry[] = [
  {
    id: 'a-1',
    actorId: 'user-super-1',
    actorName: 'Азиз Каримов',
    actorRole: 'superadmin',
    action: 'branch.created',
    entityType: 'branch',
    entityId: 'branch-2',
    entityLabel: 'Юнусабад',
    meta: { address: 'Ташкент, ул. Богишамол, 45' },
    ip: '192.168.10.55',
    userAgent: AGENTS[0]!,
    createdAt: isoAgo(15),
  },
  {
    id: 'a-2',
    actorId: 'user-admin-1',
    actorName: 'Нодира Юсупова',
    actorRole: 'admin',
    action: 'student.created',
    entityType: 'student',
    entityId: 'student-042',
    entityLabel: 'Каримов Иброхим',
    meta: { branch: 'Центральный', group: 'Python · Middle' },
    ip: '192.168.10.22',
    userAgent: AGENTS[1]!,
    createdAt: isoAgo(38),
  },
  {
    id: 'a-3',
    actorId: 'user-admin-1',
    actorName: 'Нодира Юсупова',
    actorRole: 'admin',
    action: 'user.password_changed',
    entityType: 'user',
    entityId: 'user-mentor-3',
    entityLabel: 'Отабек Пулатов',
    meta: { reason: 'по запросу пользователя' },
    ip: '192.168.10.22',
    userAgent: AGENTS[1]!,
    createdAt: isoAgo(72),
  },
  {
    id: 'a-4',
    actorId: 'user-mentor-1',
    actorName: 'Санжар Джураев',
    actorRole: 'mentor',
    action: 'attendance.marked',
    entityType: 'lesson',
    entityId: 'lesson-15',
    entityLabel: 'Frontend · Junior (05.07)',
    meta: { present: 8, absent: 1 },
    ip: '192.168.11.7',
    userAgent: AGENTS[2]!,
    createdAt: isoAgo(120),
  },
  {
    id: 'a-5',
    actorId: 'user-super-1',
    actorName: 'Азиз Каримов',
    actorRole: 'superadmin',
    action: 'rule.enabled',
    entityType: 'rule',
    entityId: 'rule-payment-received',
    entityLabel: 'Платёж получен',
    meta: null,
    ip: '192.168.10.55',
    userAgent: AGENTS[0]!,
    createdAt: isoAgo(180),
  },
  {
    id: 'a-6',
    actorId: 'user-super-1',
    actorName: 'Азиз Каримов',
    actorRole: 'superadmin',
    action: 'user.archived',
    entityType: 'user',
    entityId: 'user-mentor-5',
    entityLabel: 'Икром Собиров',
    meta: { reason: 'декрет' },
    ip: '192.168.10.55',
    userAgent: AGENTS[0]!,
    createdAt: isoAgo(260),
  },
  {
    id: 'a-7',
    actorId: 'user-admin-1',
    actorName: 'Нодира Юсупова',
    actorRole: 'admin',
    action: 'group.created',
    entityType: 'group',
    entityId: 'group-new-1',
    entityLabel: 'DevOps · Weekend',
    meta: { fee: 900_000, mentor: 'Санжар Джураев' },
    ip: '192.168.10.22',
    userAgent: AGENTS[1]!,
    createdAt: isoAgo(360),
  },
  {
    id: 'a-8',
    actorId: 'user-super-1',
    actorName: 'Азиз Каримов',
    actorRole: 'superadmin',
    action: 'session.login',
    entityType: 'session',
    entityId: null,
    entityLabel: 'Azz Karimov login',
    meta: null,
    ip: '192.168.10.55',
    userAgent: AGENTS[0]!,
    createdAt: isoAgo(480),
  },
  {
    id: 'a-9',
    actorId: 'user-admin-1',
    actorName: 'Нодира Юсупова',
    actorRole: 'admin',
    action: 'branch.updated',
    entityType: 'branch',
    entityId: 'branch-1',
    entityLabel: 'Центральный (Мирзо-Улугбек)',
    meta: { phone: '+998712001234' },
    ip: '192.168.10.22',
    userAgent: AGENTS[1]!,
    createdAt: isoAgo(720),
  },
  {
    id: 'a-10',
    actorId: 'user-super-1',
    actorName: 'Азиз Каримов',
    actorRole: 'superadmin',
    action: 'student.deleted',
    entityType: 'student',
    entityId: 'student-099',
    entityLabel: 'Тестовый студент',
    meta: { reason: 'дубликат' },
    ip: '192.168.10.55',
    userAgent: AGENTS[3]!,
    createdAt: isoAgo(1440),
  },
  // Несколько неудачных попыток — важнее всего для «кто налажал»
  {
    id: 'a-err-1',
    actorId: 'user-admin-1',
    actorName: 'Нодира Юсупова',
    actorRole: 'admin',
    action: 'student.updated',
    entityType: 'student',
    entityId: 'student-042',
    entityLabel: 'Каримов Ибрахим',
    meta: { error: 'Дубликат родительского телефона', field: 'parentPhone' },
    status: 'failure',
    statusCode: 409,
    ip: '192.168.10.22',
    userAgent: AGENTS[1]!,
    createdAt: isoAgo(45),
  },
  {
    id: 'a-err-2',
    actorId: 'user-mentor-1',
    actorName: 'Санжар Джураев',
    actorRole: 'mentor',
    action: 'attendance.marked',
    entityType: 'lesson',
    entityId: 'lesson-321',
    entityLabel: 'Frontend · Junior · MW-Evening',
    meta: { error: 'Окно 1 час истекло (403)', minutesAfter: 78 },
    status: 'failure',
    statusCode: 403,
    ip: '192.168.11.7',
    userAgent: AGENTS[2]!,
    createdAt: isoAgo(90),
  },
  {
    id: 'a-err-3',
    actorId: '',
    actorName: 'unknown@none.local',
    actorRole: 'mentor',
    action: 'session.login',
    entityType: 'session',
    entityId: null,
    entityLabel: 'unknown@none.local',
    meta: { error: 'Invalid credentials', attempts: 4 },
    status: 'failure',
    statusCode: 401,
    ip: '178.220.14.201',
    userAgent: AGENTS[3]!,
    createdAt: isoAgo(180),
  },
];

// bumped to v2 после добавления failure-записей — сбрасывает кеш демо-режима
export const MOCK_AUDIT: AuditEntry[] = loadMock('audit-v2', DEFAULT_AUDIT);

let nextId = MOCK_AUDIT.length + 1;

export function appendAudit(entry: Omit<AuditEntry, 'id' | 'createdAt' | 'ip' | 'userAgent'>): void {
  MOCK_AUDIT.unshift({
    ...entry,
    id: `a-${nextId++}-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    ip: randIP(),
    userAgent: AGENTS[0]!,
  });
}
