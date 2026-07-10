import {
  MOCK_STUDENTS,
  MOCK_STUDENT_MESSAGES,
  MOCK_USER,
  mockStudentDetail,
  type MockStudent,
  type MockStudentMessage,
} from './mockData';
import { MOCK_GROUPS_LIST, type MockGroup } from './mockGroups';
import { MOCK_REMINDERS, type MockReminder } from './mockReminders';
import { MOCK_USERS, type MockUser, type UserRole } from './mockUsers';
import { MOCK_BRANCHES, type MockBranch } from './mockBranches';
import { MOCK_RULES } from './mockRules';
import { MOCK_AUDIT, appendAudit, type AuditAction } from './mockAudit';
import { MOCK_ANNOUNCEMENTS, type MockAnnouncement, type AnnouncementTarget } from './mockAnnouncements';
import { saveMock } from './persist';

function persistStudents() { saveMock('students-v4', MOCK_STUDENTS); }
function persistStudentMessages() { saveMock('student-messages', MOCK_STUDENT_MESSAGES); }
function persistGroups() { saveMock('groups', MOCK_GROUPS_LIST); }

// groupId → set of studentIds. Заполняется при первом обращении к GET /groups/:id,
// потом мутируется при add/remove. Демонстрирует реальный composition над мок-данными.
type MembersMap = Record<string, string[]>;
const savedMembers = ((): MembersMap => {
  try {
    const raw = localStorage.getItem('educrm-mock-group-members');
    return raw ? (JSON.parse(raw) as MembersMap) : {};
  } catch {
    return {};
  }
})();
const MOCK_GROUP_MEMBERS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(savedMembers).map(([k, v]) => [k, new Set(v)]),
);
function persistGroupMembers() {
  try {
    const flat: MembersMap = {};
    for (const [k, v] of Object.entries(MOCK_GROUP_MEMBERS)) flat[k] = Array.from(v);
    localStorage.setItem('educrm-mock-group-members', JSON.stringify(flat));
  } catch { /* ignore */ }
}
function seedGroupMembers(g: MockGroup): Set<string> {
  const existing = MOCK_GROUP_MEMBERS[g.id];
  if (existing) return existing;
  const active = MOCK_STUDENTS.filter((s) => !s.isArchived);
  const groupHash = g.id.split('-').reduce((h, s) => h + s.charCodeAt(0), 0);
  const roster = active
    .slice(groupHash % 6, (groupHash % 6) + g.studentCount)
    .map((s) => s.id);
  const set = new Set<string>(roster);
  MOCK_GROUP_MEMBERS[g.id] = set;
  return set;
}
function studentGroupsOf(studentId: string): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  for (const g of MOCK_GROUPS_LIST) {
    const set = MOCK_GROUP_MEMBERS[g.id];
    if (set?.has(studentId)) out.push({ id: g.id, name: g.name });
  }
  return out;
}

function persistUsers() { saveMock('users-v2', MOCK_USERS); }
function persistReminders() { saveMock('reminders', MOCK_REMINDERS); }
function persistUser() { saveMock('user', MOCK_USER); }
function persistBranches() { saveMock('branches', MOCK_BRANCHES); }
function persistRules() { saveMock('rules', MOCK_RULES); }
function persistAudit() { saveMock('audit-v2', MOCK_AUDIT); }
function persistAnnouncements() { saveMock('announcements-v3', MOCK_ANNOUNCEMENTS); }

function audit(action: AuditAction, entityType: string, entityId: string | null, entityLabel: string, meta: Record<string, string | number | boolean | null> | null = null): void {
  appendAudit({
    actorId: MOCK_USER.id,
    actorName: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
    actorRole: 'superadmin',
    action,
    entityType,
    entityId,
    entityLabel,
    meta,
  });
  persistAudit();
}

export function isDemoMode(): boolean {
  return true;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function handleMockRequest(
  method: string,
  path: string,
  query: Record<string, string>,
  body?: unknown,
): unknown {
  // ── STUDENTS ─────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/students') {
    const search = (query.search ?? '').toLowerCase();
    const isArchivedRaw = query.isArchived;
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);

    let filtered = MOCK_STUDENTS;
    if (isArchivedRaw === 'true') filtered = filtered.filter((s) => s.isArchived);
    else if (isArchivedRaw === 'false') filtered = filtered.filter((s) => !s.isArchived);

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.firstName.toLowerCase().includes(search) ||
          s.lastName.toLowerCase().includes(search) ||
          (s.phone ?? '').includes(search) ||
          s.parentPhone.includes(search),
      );
    }

    // Дополнительный фильтр «заморожены»
    if (query.frozen === 'true') {
      filtered = filtered.filter((s) => !!s.freeze);
    } else if (query.frozen === 'false') {
      filtered = filtered.filter((s) => !s.freeze);
    }
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    // Считаем актуальное groupCount из membership-мапы + прокидываем freeze-флаги.
    const items = filtered.slice(start, start + pageSize).map((s) => {
      const live = studentGroupsOf(s.id).length;
      const base = live > 0 ? { ...s, groupCount: live } : s;
      return {
        ...base,
        isFrozen: !!s.freeze,
        freezeReason: s.freeze?.reason ?? null,
        expectedReturnAt: s.freeze?.expectedReturnAt ?? null,
      };
    });
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // GET /students/upcoming-returns — студенты, обещавшие вернуться в ближайшие 2 дня.
  // ВАЖНО: проверить до общего match /students/:id.
  if (method === 'GET' && path === '/superadmin/students/upcoming-returns') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAhead = new Date(today.getTime() + 2 * 86400_000);
    const items = MOCK_STUDENTS.filter((s) => {
      if (!s.freeze || !s.freeze.expectedReturnAt) return false;
      const d = new Date(s.freeze.expectedReturnAt);
      return d >= today && d <= twoDaysAhead;
    }).map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      parentPhone: s.parentPhone,
      telegramChatId: s.telegramChatId,
      freeze: s.freeze,
    }));
    return { items };
  }

  const studentDetail = /^\/superadmin\/students\/([^/]+)$/.exec(path);
  if (method === 'GET' && studentDetail) {
    return mockStudentDetail(studentDetail[1]!);
  }

  if (method === 'POST' && path === '/superadmin/students') {
    const b = (body ?? {}) as Partial<MockStudent> & { firstName: string; lastName: string; parentPhone: string };
    const created: MockStudent = {
      id: newId('student'),
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phone ?? null,
      parentPhone: b.parentPhone,
      parentPhone2: b.parentPhone2 ?? null,
      telegramChatId: b.telegramChatId ?? null,
      isArchived: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      groupCount: 0,
    };
    MOCK_STUDENTS.unshift(created);
    persistStudents();
    audit('student.created', 'student', created.id, `${created.lastName} ${created.firstName}`);
    return created;
  }

  if (method === 'DELETE' && studentDetail) {
    const id = studentDetail[1]!;
    const idx = MOCK_STUDENTS.findIndex((s) => s.id === id);
    if (idx >= 0) {
      const s = MOCK_STUDENTS[idx]!;
      audit('student.deleted', 'student', s.id, `${s.lastName} ${s.firstName}`);
      MOCK_STUDENTS.splice(idx, 1);
    }
    persistStudents();
    return { ok: true };
  }

  const archiveMatch = /^\/superadmin\/students\/([^/]+)\/(archive|unarchive)$/.exec(path);
  if (method === 'POST' && archiveMatch) {
    const id = archiveMatch[1]!;
    const isArchived = archiveMatch[2] === 'archive';
    const student = MOCK_STUDENTS.find((s) => s.id === id);
    if (student) {
      student.isArchived = isArchived;
      student.updatedAt = nowIso();
      persistStudents();
      audit('student.archived', 'student', student.id, `${student.lastName} ${student.firstName}`, { archived: isArchived });
    }
    return student ?? null;
  }

  // POST /students/:id/freeze  { reason, expectedReturnAt, note }
  const freezeMatch = /^\/superadmin\/students\/([^/]+)\/freeze$/.exec(path);
  if (method === 'POST' && freezeMatch) {
    const id = freezeMatch[1]!;
    const student = MOCK_STUDENTS.find((s) => s.id === id);
    if (student) {
      const b = (body ?? {}) as {
        reason?: string;
        expectedReturnAt?: string | null;
        note?: string;
      };
      student.freeze = {
        since: nowIso(),
        reason: (b.reason ?? '').trim() || 'Не указана',
        expectedReturnAt: b.expectedReturnAt || null,
        note: b.note?.trim() || undefined,
      };
      student.updatedAt = nowIso();
      persistStudents();
      audit('student.updated', 'student', student.id, `${student.lastName} ${student.firstName}`, {
        action: 'freeze',
        reason: student.freeze.reason,
        expectedReturnAt: student.freeze.expectedReturnAt,
      });
    }
    return student ? mockStudentDetail(student.id) : null;
  }

  // POST /students/:id/unfreeze
  const unfreezeMatch = /^\/superadmin\/students\/([^/]+)\/unfreeze$/.exec(path);
  if (method === 'POST' && unfreezeMatch) {
    const id = unfreezeMatch[1]!;
    const student = MOCK_STUDENTS.find((s) => s.id === id);
    if (student) {
      student.freeze = null;
      student.updatedAt = nowIso();
      persistStudents();
      audit('student.updated', 'student', student.id, `${student.lastName} ${student.firstName}`, {
        action: 'unfreeze',
      });
    }
    return student ? mockStudentDetail(student.id) : null;
  }

  // POST /students/:id/message  { message, via }
  const msgMatch = /^\/superadmin\/students\/([^/]+)\/message$/.exec(path);
  if (method === 'POST' && msgMatch) {
    const id = msgMatch[1]!;
    const student = MOCK_STUDENTS.find((s) => s.id === id);
    if (student) {
      const b = (body ?? {}) as { message?: string; via?: 'telegram' | 'sms' };
      const via = b.via ?? 'telegram';
      const msg: MockStudentMessage = {
        id: newId('msg'),
        studentId: student.id,
        message: (b.message ?? '').trim(),
        via,
        senderId: MOCK_USER.id,
        senderName: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
        senderRole: 'superadmin',
        status: 'pending',
        sentAt: nowIso(),
      };
      MOCK_STUDENT_MESSAGES.unshift(msg);
      persistStudentMessages();
      // Симулируем доставку через 1.5s
      setTimeout(() => {
        // 10% симулированной ошибки для demo, остальные — sent
        if (Math.random() < 0.1 && via === 'telegram' && !student.telegramChatId) {
          msg.status = 'failed';
          msg.error = 'telegram chat not found';
        } else {
          msg.status = 'sent';
        }
        persistStudentMessages();
      }, 1500);
      audit('reminder.sent', 'student', student.id, `${student.lastName} ${student.firstName}`, {
        via,
        len: msg.message.length,
      });
    }
    return { ok: true };
  }

  // ── GROUPS ────────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/groups') {
    return { items: [...MOCK_GROUPS_LIST] };
  }

  if (method === 'POST' && path === '/superadmin/groups') {
    const b = (body ?? {}) as Partial<MockGroup> &
      Pick<MockGroup, 'name' | 'mentorName' | 'lessonDays' | 'lessonStartTime' | 'lessonEndTime' | 'monthlyFee'>;
    const created: MockGroup = {
      id: newId('group'),
      name: b.name,
      mentorName: b.mentorName,
      lessonDays: b.lessonDays,
      lessonStartTime: b.lessonStartTime,
      lessonEndTime: b.lessonEndTime,
      monthlyFee: Number(b.monthlyFee),
      studentCount: 0,
      status: 'active',
      kind: b.kind ?? 'group',
    };
    MOCK_GROUPS_LIST.unshift(created);
    persistGroups();
    audit('group.created', 'group', created.id, created.name, {
      kind: created.kind ?? 'group',
    });
    return created;
  }

  const groupIdMatch = /^\/superadmin\/groups\/([^/]+)$/.exec(path);

  // PATCH /groups/:id — rename, изменить время, ментор, kind
  if (method === 'PATCH' && groupIdMatch) {
    const id = groupIdMatch[1]!;
    const g = MOCK_GROUPS_LIST.find((x) => x.id === id);
    if (!g) return null;
    const b = (body ?? {}) as Partial<MockGroup>;
    const before = { name: g.name, mentorName: g.mentorName, monthlyFee: g.monthlyFee };
    if (b.name !== undefined) g.name = b.name;
    if (b.mentorName !== undefined) g.mentorName = b.mentorName;
    if (b.lessonDays !== undefined) g.lessonDays = b.lessonDays;
    if (b.lessonStartTime !== undefined) g.lessonStartTime = b.lessonStartTime;
    if (b.lessonEndTime !== undefined) g.lessonEndTime = b.lessonEndTime;
    if (b.monthlyFee !== undefined) g.monthlyFee = Number(b.monthlyFee);
    if (b.kind !== undefined) g.kind = b.kind;
    persistGroups();
    audit('group.updated', 'group', g.id, g.name, {
      action: 'edit',
      before: JSON.stringify(before),
    });
    return g;
  }
  if (method === 'GET' && groupIdMatch) {
    const id = groupIdMatch[1]!;
    const g = MOCK_GROUPS_LIST.find((x) => x.id === id);
    if (!g) return null;
    const members = seedGroupMembers(g);
    const roster = Array.from(members)
      .map((sid) => MOCK_STUDENTS.find((s) => s.id === sid))
      .filter((s): s is MockStudent => !!s && !s.isArchived)
      .map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        parentPhone: s.parentPhone,
        telegramChatId: s.telegramChatId,
      }));
    return { ...g, studentCount: members.size, students: roster };
  }

  // POST /groups/:id/students { studentIds: string[] }
  const groupStudentsMatch = /^\/superadmin\/groups\/([^/]+)\/students$/.exec(path);
  if (method === 'POST' && groupStudentsMatch) {
    const gid = groupStudentsMatch[1]!;
    const g = MOCK_GROUPS_LIST.find((x) => x.id === gid);
    if (!g) return null;
    const set = seedGroupMembers(g);
    const before = set.size;
    const ids = ((body as { studentIds?: string[] })?.studentIds ?? []).filter(
      (sid): sid is string => typeof sid === 'string',
    );
    for (const sid of ids) {
      if (MOCK_STUDENTS.some((s) => s.id === sid && !s.isArchived)) set.add(sid);
    }
    g.studentCount = set.size;
    persistGroupMembers();
    persistGroups();
    const added = set.size - before;
    audit('group.updated', 'group', g.id, g.name, {
      action: 'students-added',
      added,
    });
    return { ok: true, added };
  }

  // DELETE /groups/:id/students/:studentId
  const groupOneStudent = /^\/superadmin\/groups\/([^/]+)\/students\/([^/]+)$/.exec(path);
  if (method === 'DELETE' && groupOneStudent) {
    const gid = groupOneStudent[1]!;
    const sid = groupOneStudent[2]!;
    const g = MOCK_GROUPS_LIST.find((x) => x.id === gid);
    if (!g) return null;
    const set = seedGroupMembers(g);
    set.delete(sid);
    g.studentCount = set.size;
    persistGroupMembers();
    persistGroups();
    audit('group.updated', 'group', g.id, g.name, {
      action: 'student-removed',
      studentId: sid,
    });
    return { ok: true };
  }

  if (method === 'DELETE' && groupIdMatch) {
    const id = groupIdMatch[1]!;
    const idx = MOCK_GROUPS_LIST.findIndex((g) => g.id === id);
    if (idx >= 0) {
      const g = MOCK_GROUPS_LIST[idx]!;
      audit('group.deleted', 'group', g.id, g.name);
      MOCK_GROUPS_LIST.splice(idx, 1);
    }
    persistGroups();
    return { ok: true };
  }

  const groupArchive = /^\/superadmin\/groups\/([^/]+)\/(archive|unarchive)$/.exec(path);
  if (method === 'POST' && groupArchive) {
    const id = groupArchive[1]!;
    const group = MOCK_GROUPS_LIST.find((g) => g.id === id);
    if (group) {
      group.status = groupArchive[2] === 'archive' ? 'archived' : 'active';
      persistGroups();
      audit('group.archived', 'group', group.id, group.name, { archived: group.status === 'archived' });
    }
    return group ?? null;
  }

  // ── USERS ─────────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/users') {
    let items = [...MOCK_USERS];
    if (query.role) items = items.filter((u) => u.role === query.role);
    if (query.isActive === 'true') items = items.filter((u) => u.isActive);
    if (query.isActive === 'false') items = items.filter((u) => !u.isActive);
    return { items };
  }

  if (method === 'POST' && path === '/superadmin/users') {
    const b = (body ?? {}) as Partial<MockUser> &
      Pick<MockUser, 'firstName' | 'lastName' | 'email' | 'role'>;
    const created: MockUser = {
      id: newId('user'),
      firstName: b.firstName,
      lastName: b.lastName,
      email: b.email,
      phone: b.phone ?? null,
      role: b.role as UserRole,
      isActive: true,
      createdAt: nowIso(),
      note: b.note ?? null,
      workingSince: b.workingSince ?? nowIso(),
      position: b.position ?? null,
    };
    MOCK_USERS.unshift(created);
    persistUsers();
    audit('user.created', 'user', created.id, `${created.lastName} ${created.firstName}`, { role: created.role });
    return created;
  }

  const userIdMatch = /^\/superadmin\/users\/([^/]+)$/.exec(path);
  if (method === 'GET' && userIdMatch) {
    const u = MOCK_USERS.find((x) => x.id === userIdMatch[1]);
    return u ?? null;
  }
  if (method === 'PATCH' && userIdMatch) {
    const id = userIdMatch[1]!;
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) return null;
    const patch = (body ?? {}) as Partial<MockUser>;
    if (patch.firstName !== undefined) user.firstName = patch.firstName;
    if (patch.lastName !== undefined) user.lastName = patch.lastName;
    if (patch.email !== undefined) user.email = patch.email;
    if (patch.phone !== undefined) user.phone = patch.phone;
    if (patch.role !== undefined) user.role = patch.role;
    if (patch.note !== undefined) user.note = patch.note;
    if (patch.workingSince !== undefined) user.workingSince = patch.workingSince;
    if (patch.position !== undefined) user.position = patch.position;
    persistUsers();
    audit('user.updated', 'user', user.id, `${user.lastName} ${user.firstName}`);
    return user;
  }
  if (method === 'DELETE' && userIdMatch) {
    const id = userIdMatch[1]!;
    const idx = MOCK_USERS.findIndex((u) => u.id === id);
    if (idx >= 0) {
      const u = MOCK_USERS[idx]!;
      audit('user.deleted', 'user', u.id, `${u.lastName} ${u.firstName}`);
      MOCK_USERS.splice(idx, 1);
    }
    persistUsers();
    return { ok: true };
  }

  const userArchive = /^\/superadmin\/users\/([^/]+)\/(archive|unarchive)$/.exec(path);
  if (method === 'POST' && userArchive) {
    const user = MOCK_USERS.find((u) => u.id === userArchive[1]);
    if (user) {
      user.isActive = userArchive[2] === 'unarchive';
      persistUsers();
      audit('user.archived', 'user', user.id, `${user.lastName} ${user.firstName}`, { archived: !user.isActive });
    }
    return user ?? null;
  }

  const userPassword = /^\/superadmin\/users\/([^/]+)\/password$/.exec(path);
  if (method === 'POST' && userPassword) {
    const u = MOCK_USERS.find((x) => x.id === userPassword[1]);
    if (u) audit('user.password_changed', 'user', u.id, `${u.lastName} ${u.firstName}`);
    return { ok: true };
  }

  // ── REMINDERS ─────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/reminders') {
    return { items: [...MOCK_REMINDERS] };
  }

  if (method === 'POST' && path === '/superadmin/reminders') {
    const b = (body ?? {}) as {
      studentId?: string | null;
      parentPhone?: string;
      recipientName?: string;
      message?: string;
    };
    const now = new Date();
    let studentId = '';
    let studentName = '';
    let parentPhone = '';

    if (b.studentId) {
      const student = MOCK_STUDENTS.find((s) => s.id === b.studentId);
      if (!student) return null;
      studentId = student.id;
      studentName = `${student.lastName} ${student.firstName}`;
      parentPhone = student.parentPhone;
    } else if (b.parentPhone) {
      studentId = '';
      studentName = b.recipientName?.trim() || 'Родитель';
      parentPhone = b.parentPhone;
    } else {
      return null;
    }

    const created: MockReminder = {
      id: newId('rem'),
      studentId,
      studentName,
      parentPhone,
      message: (b.message ?? '').trim() || `Здравствуйте! Напоминаем об оплате за ${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}.`,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      status: 'pending',
      telegramMessageId: null,
      error: null,
      sentAt: null,
      createdAt: nowIso(),
    };
    MOCK_REMINDERS.unshift(created);
    persistReminders();
    setTimeout(() => {
      created.status = 'sent';
      created.sentAt = nowIso();
      created.telegramMessageId = String(Math.floor(10_000_000 + Math.random() * 90_000_000));
      persistReminders();
    }, 1500);
    return created;
  }

  const reminderIdMatch = /^\/superadmin\/reminders\/([^/]+)$/.exec(path);
  if (method === 'PATCH' && reminderIdMatch) {
    const r = MOCK_REMINDERS.find((x) => x.id === reminderIdMatch[1]);
    if (r) {
      const patch = (body ?? {}) as { message?: string };
      if (patch.message !== undefined) r.message = patch.message;
      persistReminders();
    }
    return r ?? null;
  }
  if (method === 'DELETE' && reminderIdMatch) {
    const id = reminderIdMatch[1]!;
    const idx = MOCK_REMINDERS.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_REMINDERS.splice(idx, 1);
    persistReminders();
    return { ok: true };
  }

  const reminderResend = /^\/superadmin\/reminders\/([^/]+)\/resend$/.exec(path);
  if (method === 'POST' && reminderResend) {
    const r = MOCK_REMINDERS.find((x) => x.id === reminderResend[1]);
    if (r) {
      r.status = 'pending';
      r.error = null;
      r.sentAt = null;
      persistReminders();
      setTimeout(() => {
        r.status = 'sent';
        r.sentAt = nowIso();
        r.telegramMessageId = String(Math.floor(10_000_000 + Math.random() * 90_000_000));
        persistReminders();
      }, 1500);
    }
    return r ?? null;
  }

  // ── AUDIT LOG ────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/audit') {
    return { items: [...MOCK_AUDIT] };
  }

  // ── ANNOUNCEMENTS ────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/announcements') {
    return { items: [...MOCK_ANNOUNCEMENTS] };
  }

  if (method === 'POST' && path === '/superadmin/announcements') {
    const b = (body ?? {}) as {
      title: string;
      body: string;
      targetType: AnnouncementTarget;
      targetLabel: string;
    };

    // получатели по типу
    let recipients: typeof MOCK_USERS = [];
    if (b.targetType === 'all-staff') {
      recipients = MOCK_USERS.filter((u) => u.role !== 'superadmin' && u.isActive);
    } else if (b.targetType === 'all-admins') {
      recipients = MOCK_USERS.filter((u) => u.role === 'admin' && u.isActive);
    } else if (b.targetType === 'all-mentors') {
      recipients = MOCK_USERS.filter((u) => u.role === 'mentor' && u.isActive);
    } else if (b.targetType.startsWith('branch:')) {
      recipients = MOCK_USERS.filter((u) => u.role !== 'superadmin' && u.isActive);
    }

    const readers = recipients.map((u, i) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role as 'superadmin' | 'admin' | 'mentor',
      readAt: null as string | null,
      // last-online: детерминированно для демо (сколько-то часов назад по индексу)
      lastOnlineAt: new Date(
        Date.now() - ((i * 173 + 7) % (7 * 24 * 60)) * 60_000,
      ).toISOString(),
    }));

    const created: MockAnnouncement = {
      id: newId('ann'),
      title: b.title.trim(),
      body: b.body.trim(),
      targetType: b.targetType,
      targetLabel: b.targetLabel,
      senderName: `${MOCK_USER.firstName} ${MOCK_USER.lastName}`,
      recipientCount: readers.length,
      readCount: 0,
      readers,
      sentAt: nowIso(),
    };
    MOCK_ANNOUNCEMENTS.unshift(created);
    persistAnnouncements();
    audit('announcement.sent', 'announcement', created.id, created.title, { recipients: readers.length });
    return created;
  }

  const annIdMatch = /^\/superadmin\/announcements\/([^/]+)$/.exec(path);
  if (method === 'DELETE' && annIdMatch) {
    const idx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === annIdMatch[1]);
    if (idx >= 0) MOCK_ANNOUNCEMENTS.splice(idx, 1);
    persistAnnouncements();
    return { ok: true };
  }

  // ── NOTIFICATION RULES ───────────────────────────────────

  if (method === 'GET' && path === '/superadmin/rules') {
    return { items: [...MOCK_RULES] };
  }

  const ruleIdMatch = /^\/superadmin\/rules\/([^/]+)$/.exec(path);
  if (method === 'PATCH' && ruleIdMatch) {
    const rule = MOCK_RULES.find((r) => r.id === ruleIdMatch[1]);
    if (!rule) return null;
    const patch = (body ?? {}) as { enabled?: boolean; template?: string };
    if (patch.enabled !== undefined) rule.enabled = patch.enabled;
    if (patch.template !== undefined) rule.template = patch.template;
    persistRules();
    return rule;
  }

  // ── BRANCHES ─────────────────────────────────────────────

  if (method === 'GET' && path === '/superadmin/branches') {
    return { items: [...MOCK_BRANCHES] };
  }

  const branchDetail = /^\/superadmin\/branches\/([^/]+)$/.exec(path);
  if (method === 'GET' && branchDetail) {
    const b = MOCK_BRANCHES.find((x) => x.id === branchDetail[1]);
    if (!b) return null;

    const seed = b.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
    const rand = (i: number) => ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280;

    // Revenue trend — 30d
    const revenueTrend = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const base = b.monthlyRevenue / 30;
      const jitter = rand(i) - 0.5;
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      return {
        date: d.toISOString().slice(0, 10),
        revenue: Math.max(0, Math.round(base * (1 + jitter * 0.4) * (weekend ? 0.4 : 1))),
      };
    });

    const debtorsCount = b.debt > 0 ? Math.floor(b.debt / 750_000) + 3 : 0;
    const offline = Math.max(0, b.studentsCount - b.onlineNow);
    const attendanceRate = 70 + (seed % 25);

    // All groups — deterministic split from MOCK_GROUPS_LIST + generated to match count
    const groupTemplates = [
      { subject: 'Frontend', level: 'Junior', days: ['mon','wed','fri'], time: '18:00–20:00', fee: 600_000 },
      { subject: 'Python', level: 'Middle', days: ['tue','thu'], time: '10:00–12:30', fee: 750_000 },
      { subject: 'Дизайн UI/UX', level: 'Basic', days: ['sat'], time: '11:00–14:00', fee: 550_000 },
      { subject: 'English B2', level: 'Middle', days: ['mon','wed','fri'], time: '16:00–17:30', fee: 450_000 },
      { subject: 'DevOps', level: 'Advanced', days: ['sat','sun'], time: '15:00–18:00', fee: 900_000 },
      { subject: 'Java', level: 'Junior', days: ['tue','thu'], time: '18:00–20:30', fee: 700_000 },
      { subject: 'SMM', level: 'Basic', days: ['mon','wed'], time: '14:00–16:00', fee: 400_000 },
      { subject: '3D-моделирование', level: 'Middle', days: ['fri','sun'], time: '10:00–13:00', fee: 850_000 },
    ];
    const mentorPool = ['Санжар Джураев', 'Малика Шамсиева', 'Отабек Пулатов', 'Феруза Комилова', 'Икром Собиров'];
    const allGroups = Array.from({ length: b.activeGroupsCount }, (_, i) => {
      const t = groupTemplates[i % groupTemplates.length]!;
      return {
        id: `${b.id}-g-${i}`,
        name: `${t.subject} · ${t.level}`,
        mentorName: mentorPool[(seed + i) % mentorPool.length]!,
        lessonDays: t.days,
        lessonTime: t.time,
        monthlyFee: t.fee,
        studentCount: 7 + ((seed + i) % 8),
      };
    });

    // All students — pick a slice from MOCK_STUDENTS proportional to studentsCount
    const activeStudents = MOCK_STUDENTS.filter((s) => !s.isArchived);
    const startIdx = seed % Math.max(1, activeStudents.length);
    const allStudents = Array.from(
      { length: Math.min(b.studentsCount, activeStudents.length) },
      (_, i) => {
        const s = activeStudents[(startIdx + i) % activeStudents.length]!;
        const groupsAtBranch = Math.max(1, ((seed + i) % 2) + 1);
        return {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          phone: s.phone,
          parentPhone: s.parentPhone,
          telegramChatId: s.telegramChatId,
          groupCount: groupsAtBranch,
          hasDebt: rand(i * 3) < 0.15,
          isOnline: i < b.onlineNow,
        };
      },
    );

    // Mentors
    const mentorCount = Math.min(mentorPool.length, Math.max(3, Math.ceil(b.activeGroupsCount / 2)));
    const mentors = Array.from({ length: mentorCount }, (_, i) => {
      const name = mentorPool[(seed + i) % mentorPool.length]!;
      const [firstName, lastName] = name.split(' ');
      return {
        id: `${b.id}-m-${i}`,
        firstName: firstName ?? name,
        lastName: lastName ?? '',
        email: `mentor${i + 1}@${b.id.replace(/-/g, '')}.local`,
        phone: `+998${['90','91','93','94'][i % 4]}${(1000000 + (seed * (i + 1)) % 9000000).toString().slice(0, 7)}`,
        groupsCount: Math.ceil(b.activeGroupsCount / mentorCount),
        studentsCount: Math.floor(b.studentsCount / mentorCount),
        rating: Math.round((4 + rand(i + 10) * 1) * 10) / 10,
      };
    });

    // Recent lessons (last 10)
    const recentLessons = Array.from({ length: 10 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(10 + ((seed + i) % 10), 0, 0, 0);
      const total = 8 + ((seed + i) % 6);
      const present = Math.floor(total * (0.75 + rand(i * 5) * 0.2));
      const g = allGroups[i % allGroups.length]!;
      return {
        id: `${b.id}-l-${i}`,
        groupId: g.id,
        groupName: g.name,
        startsAt: d.toISOString(),
        totalStudents: total,
        present,
        absent: total - present,
      };
    });

    // Debtors
    const topDebtors = Array.from({ length: Math.min(debtorsCount, 8) }, (_, i) => {
      const s = activeStudents[(seed + i) % activeStudents.length]!;
      return {
        id: s.id,
        name: `${s.lastName} ${s.firstName}`,
        parentPhone: s.parentPhone,
        debt: 300_000 + ((seed + i * 7) % 8) * 100_000,
        daysOverdue: 3 + ((seed + i) % 20),
      };
    });

    // Payment methods (rough distribution)
    const paymentMethods = [
      { name: 'Карта', value: 48 + (seed % 10), color: 'oklch(70% 0.16 215)' },
      { name: 'Наличные', value: 32 - (seed % 8), color: 'oklch(75% 0.18 80)' },
      { name: 'Разбит', value: 20 + (seed % 5), color: 'oklch(85% 0.22 130)' },
    ];

    // Working hours
    const workingHours = [
      { day: 'Пн', hours: '08:00 — 21:00' },
      { day: 'Вт', hours: '08:00 — 21:00' },
      { day: 'Ср', hours: '08:00 — 21:00' },
      { day: 'Чт', hours: '08:00 — 21:00' },
      { day: 'Пт', hours: '08:00 — 21:00' },
      { day: 'Сб', hours: '09:00 — 20:00' },
      { day: 'Вс', hours: '10:00 — 18:00' },
    ];

    return {
      ...b,
      offlineNow: offline,
      debtorsCount,
      attendanceRate,
      revenueTrend,
      allGroups,
      allStudents,
      mentors,
      recentLessons,
      topDebtors,
      paymentMethods,
      workingHours,
    };
  }

  if (method === 'POST' && path === '/superadmin/branches') {
    const b = (body ?? {}) as Partial<MockBranch> &
      Pick<MockBranch, 'name' | 'address' | 'phone'>;
    const admin = b.adminUserId ? MOCK_USERS.find((u) => u.id === b.adminUserId) : null;
    const created: MockBranch = {
      id: newId('branch'),
      name: b.name,
      address: b.address,
      phone: b.phone,
      adminUserId: admin?.id ?? null,
      adminName: admin ? `${admin.firstName} ${admin.lastName}` : null,
      studentsCount: 0,
      activeGroupsCount: 0,
      monthlyRevenue: 0,
      debt: 0,
      onlineNow: 0,
      status: 'active',
      createdAt: nowIso(),
    };
    MOCK_BRANCHES.unshift(created);
    persistBranches();
    audit('branch.created', 'branch', created.id, created.name);
    return created;
  }

  const branchIdMatch = /^\/superadmin\/branches\/([^/]+)$/.exec(path);
  if (method === 'PATCH' && branchIdMatch) {
    const id = branchIdMatch[1]!;
    const branch = MOCK_BRANCHES.find((b) => b.id === id);
    if (!branch) return null;
    const patch = (body ?? {}) as Partial<MockBranch>;
    if (patch.name !== undefined) branch.name = patch.name;
    if (patch.address !== undefined) branch.address = patch.address;
    if (patch.phone !== undefined) branch.phone = patch.phone;
    if (patch.adminUserId !== undefined) {
      branch.adminUserId = patch.adminUserId;
      const u = patch.adminUserId ? MOCK_USERS.find((x) => x.id === patch.adminUserId) : null;
      branch.adminName = u ? `${u.firstName} ${u.lastName}` : null;
    }
    if (patch.studentsCount !== undefined) branch.studentsCount = Number(patch.studentsCount);
    if (patch.activeGroupsCount !== undefined) branch.activeGroupsCount = Number(patch.activeGroupsCount);
    if (patch.monthlyRevenue !== undefined) branch.monthlyRevenue = Number(patch.monthlyRevenue);
    if (patch.debt !== undefined) branch.debt = Number(patch.debt);
    if (patch.onlineNow !== undefined) branch.onlineNow = Number(patch.onlineNow);
    persistBranches();
    audit('branch.updated', 'branch', branch.id, branch.name);
    return branch;
  }
  if (method === 'DELETE' && branchIdMatch) {
    const idx = MOCK_BRANCHES.findIndex((b) => b.id === branchIdMatch[1]);
    if (idx >= 0) {
      const b = MOCK_BRANCHES[idx]!;
      audit('branch.deleted', 'branch', b.id, b.name);
      MOCK_BRANCHES.splice(idx, 1);
    }
    persistBranches();
    return { ok: true };
  }

  const branchArchive = /^\/superadmin\/branches\/([^/]+)\/(archive|unarchive)$/.exec(path);
  if (method === 'POST' && branchArchive) {
    const branch = MOCK_BRANCHES.find((b) => b.id === branchArchive[1]);
    if (branch) {
      branch.status = branchArchive[2] === 'archive' ? 'archived' : 'active';
      persistBranches();
      audit('branch.archived', 'branch', branch.id, branch.name, { archived: branch.status === 'archived' });
    }
    return branch ?? null;
  }

  // ── /auth/me — self profile ──────────────────────────────

  if (method === 'PATCH' && path === '/auth/me') {
    const patch = (body ?? {}) as Partial<typeof MOCK_USER>;
    if (patch.firstName) MOCK_USER.firstName = patch.firstName;
    if (patch.lastName) MOCK_USER.lastName = patch.lastName;
    if (patch.email) MOCK_USER.email = patch.email;
    persistUser();
    return { ...MOCK_USER };
  }
  if (method === 'POST' && path === '/auth/me/password') {
    return { ok: true };
  }

  return undefined;
}
