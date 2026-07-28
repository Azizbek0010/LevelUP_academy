import argon2 from 'argon2';
import { AppError } from '../../utils/AppError.js';
import { planLimits } from '../../config/plans.js';
import { logger } from '../../config/logger.js';
import { notificationQueue } from '../../queues/notification.queue.js';
import { genTempPassword } from '../auth/credentials.js';
import * as repo from './super.repository.js';

// ---------- филиалы ----------

/** Первый филиал организации становится главным (is_main). */
export async function createBranch(orgId, { name, address, phone, lat, lng }) {
  const existing = await repo.countBranches(orgId);
  const branch = await repo.insertBranch({
    orgId,
    name,
    address,
    phone,
    // без этого координаты с карты доходили до сервиса и молча терялись здесь
    lat,
    lng,
    isMain: existing === 0,
  });
  return mapBranch(branch);
}

export async function listBranches(orgId) {
  const rows = await repo.listBranches(orgId);
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    isMain: b.is_main,
    isArchived: b.is_archived,
    admins: Number(b.admins),
    students: Number(b.students),
    mentors: Number(b.mentors),
    groups: Number(b.groups),
    // деньги филиала — по ним видно, какой зарабатывает, а какой проедает
    revenue: Number(b.revenue),
    expenses: Number(b.expenses),
    profit: Number(b.revenue) - Number(b.expenses),
    debt: Number(b.debt),
    // NUMERIC приезжает строкой; карта ждёт числа
    lat: b.lat === null || b.lat === undefined ? null : Number(b.lat),
    lng: b.lng === null || b.lng === undefined ? null : Number(b.lng),
    createdAt: b.created_at,
  }));
}

function mapBranch(b) {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    isMain: b.is_main,
    isArchived: b.is_archived,
    // NUMERIC приезжает строкой; карта ждёт числа
    lat: b.lat === null || b.lat === undefined ? null : Number(b.lat),
    lng: b.lng === null || b.lng === undefined ? null : Number(b.lng),
    createdAt: b.created_at,
  };
}

export async function updateBranch(orgId, id, fields) {
  const branch = await repo.updateBranch(id, orgId, fields);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');
  return mapBranch(branch);
}

export async function setBranchArchived(orgId, id, archived) {
  const branch = await repo.setBranchArchived(id, orgId, archived);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');
  return mapBranch(branch);
}

/** Детали филиала: сам филиал + его админы + группы. */
/**
 * Всё о филиале в одном ответе: показатели, сотрудники, группы, ученики.
 *
 * Собрано одним запросом намеренно — карточка филиала показывает это на
 * соседних вкладках, и четыре отдельных обращения ради одного экрана только
 * добавили бы мигание при переключении.
 *
 * Раньше здесь были только админы и группы, а фронт при этом рисовал плитки
 * «Ученики», «Месячный доход» и «Общий долг» — они всегда показывали нули,
 * потому что таких полей в ответе не было.
 */
export async function branchDetail(orgId, id) {
  const branch = await repo.findBranchFull(id, orgId);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');
  const [admins, groups, students, mentors, stats] = await Promise.all([
    repo.listBranchAdmins(id),
    repo.listBranchGroups(id),
    repo.listBranchStudents(id),
    repo.listBranchMentors(id),
    repo.branchStats(id),
  ]);
  return {
    ...mapBranch(branch),
    stats: {
      students: stats.students,
      mentors: stats.mentors,
      groups: stats.groups,
      admins: admins.length,
      revenue: Number(stats.revenue),
      expenses: Number(stats.expenses),
      // прибыль филиала = что пришло от учеников минус его же траты
      profit: Number(stats.revenue) - Number(stats.expenses),
      debt: Number(stats.debt),
      currency: 'UZS',
    },
    admins: admins.map((a) => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      email: a.email,
      status: a.status,
    })),
    mentors: mentors.map((m) => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      email: m.email,
      phone: m.phone,
      status: m.status,
    })),
    students: students.map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      phone: s.phone,
      status: s.status,
      debt: Number(s.total_debt ?? 0),
      coins: Number(s.coin_balance ?? 0),
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      monthlyPrice: Number(g.monthly_price),
      mentorId: g.mentor_id,
      mentorName: g.mentor_name,
      students: Number(g.students),
    })),
  };
}

// ---------- админы ----------

export async function createAdmin(orgId, { firstName, lastName, email, branchId, phone }) {
  // филиал должен принадлежать ЭТОЙ организации — иначе super admin суёт чужой филиал
  const branch = await repo.findBranchInOrg(branchId, orgId);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');

  // пароль всегда генерится сервером и показывается один раз — так же, как
  // Main Admin заводит Super Admin. Ручной ввод убрали: опечатка/автозаполнение
  // браузера в форме создания приводили к аккаунту с паролем, который никто
  // не мог вспомнить, а сбросить его было нечем.
  const tempPassword = genTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

  let admin;
  try {
    admin = await repo.insertAdmin({
      orgId,
      branchId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
    });
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'Email already in use');
    throw err;
  }

  return {
    id: admin.id,
    firstName: admin.first_name,
    lastName: admin.last_name,
    email: admin.email,
    branchId: admin.branch_id,
    // показать один раз — Super Admin передаёт сотруднику
    tempPassword,
  };
}

/** Новый случайный пароль для админа — когда старый забыт/введён неверно при создании. */
export async function resetAdminPassword(orgId, id) {
  const tempPassword = genTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });
  const admin = await repo.setAdminPasswordHash(id, orgId, passwordHash);
  if (!admin) throw new AppError(404, 'Admin not found in your organization');
  return { ...mapAdmin(admin), tempPassword };
}

export async function listAdmins(orgId) {
  const rows = await repo.listAdmins(orgId);
  return rows.map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    status: u.status,
    branchId: u.branch_id,
    branchName: u.branch_name,
    phone: u.phone,
    monthlySalary: u.monthly_salary,
    createdAt: u.created_at,
  }));
}

function mapAdmin(u) {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    status: u.status,
    branchId: u.branch_id,
    phone: u.phone,
    monthlySalary: u.monthly_salary,
  };
}

export async function updateAdmin(orgId, id, fields) {
  // при переносе в другой филиал — он должен быть из своей орг
  if (fields.branchId !== undefined) {
    const branch = await repo.findBranchInOrg(fields.branchId, orgId);
    if (!branch) throw new AppError(404, 'Branch not found in your organization');
  }
  if (!(await repo.findAdminInOrg(id, orgId))) {
    throw new AppError(404, 'Admin not found in your organization');
  }
  const admin = await repo.updateAdmin(id, orgId, fields);
  return mapAdmin(admin);
}

export async function setAdminFrozen(orgId, id, frozen) {
  const admin = await repo.setAdminStatus(id, orgId, frozen ? 'frozen' : 'active');
  if (!admin) throw new AppError(404, 'Admin not found in your organization');
  return mapAdmin(admin);
}

// ---------- методисты ----------

export async function createMethodist(orgId, { firstName, lastName, email, phone }) {
  const tempPassword = genTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });
  try {
    const row = await repo.insertMethodist({
      orgId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
    });
    return { ...mapMethodist(row), tempPassword };
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'Email already in use');
    throw err;
  }
}

/** Новый случайный пароль для методиста — тот же сценарий, что и у админа. */
export async function resetMethodistPassword(orgId, id) {
  const tempPassword = genTempPassword();
  const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });
  const row = await repo.setMethodistPasswordHash(id, orgId, passwordHash);
  if (!row) throw new AppError(404, 'Methodist not found in your organization');
  return { ...mapMethodist(row), tempPassword };
}

// ---------- менторы (только чтение, для выбора в «Взыскании») ----------

export async function listMentors(orgId) {
  const rows = await repo.listMentors(orgId);
  return rows.map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    status: u.status,
    branchId: u.branch_id,
    branchName: u.branch_name,
    createdAt: u.created_at,
  }));
}

export async function listMethodists(orgId) {
  const rows = await repo.listMethodists(orgId);
  return rows.map((u) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    status: u.status,
    phone: u.phone,
    monthlySalary: u.monthly_salary,
    createdAt: u.created_at,
  }));
}

export async function updateMethodist(orgId, id, fields) {
  const admin = await repo.updateMethodist(id, orgId, fields);
  if (!admin) throw new AppError(404, 'Methodist not found in your organization');
  return mapMethodist(admin);
}

export async function setMethodistFrozen(orgId, id, frozen) {
  const row = await repo.setMethodistStatus(id, orgId, frozen ? 'frozen' : 'active');
  if (!row) throw new AppError(404, 'Methodist not found in your organization');
  return mapMethodist(row);
}

function mapMethodist(u) {
  return {
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    status: u.status,
    phone: u.phone,
    monthlySalary: u.monthly_salary,
  };
}

// ---------- организация (профиль партнёра, Settings) ----------

function mapOrganization(o) {
  const limits = planLimits(o.plan);
  return {
    id: o.id,
    name: o.name,
    domain: o.domain,
    status: o.status,
    lessonDurationMin: o.lesson_duration_min,
    coinsPerStudent: o.coins_per_student,
    createdAt: o.created_at,
    plan: {
      branchLimit: limits?.maxBranches ?? null,
      diskSpace: '500 ГБ',
    },
  };
}

export async function getOrganization(orgId) {
  const row = await repo.getOrganization(orgId);
  if (!row) throw new AppError(404, 'Organization not found');
  return mapOrganization(row);
}

export async function updateOrganization(orgId, fields) {
  try {
    const row = await repo.updateOrganization(orgId, fields);
    if (!row) throw new AppError(404, 'Organization not found');
    return mapOrganization(row);
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'Domain already in use');
    throw err;
  }
}

// ---------- студенты организации (Super Students страница) ----------

export async function listStudents(orgId, { search, frozen, page, limit }) {
  const { rows, total } = await repo.listOrgStudents(orgId, { search, frozen, page, limit });
  return {
    students: rows.map((u) => ({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      status: u.status,
      frozen: u.status === 'frozen',
      branchName: u.branch_name,
      createdAt: u.created_at,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function deleteStudent(orgId, id) {
  const row = await repo.softDeleteOrgStudent(id, orgId);
  if (!row) throw new AppError(404, 'Student not found in your organization');
  return { id: row.id };
}

// ---------- группы организации (Super Groups страница) ----------

export async function listGroups(orgId) {
  const rows = await repo.listOrgGroups(orgId);
  return {
    groups: rows.map((g) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      monthlyPrice: Number(g.monthly_price),
      schedule: g.schedule,
      lessonDays: g.schedule,
      room: g.room,
      isArchived: g.is_archived,
      branchName: g.branch_name,
      mentorName: g.mentor_name,
      studentsCount: Number(g.students_count),
      createdAt: g.created_at,
    })),
  };
}

export async function setGroupArchived(orgId, id, archived) {
  const row = await repo.setOrgGroupArchived(id, orgId, archived);
  if (!row) throw new AppError(404, 'Group not found in your organization');
  return { id: row.id, isArchived: archived };
}

export async function deleteGroup(orgId, id) {
  const row = await repo.softDeleteOrgGroup(id, orgId);
  if (!row) throw new AppError(404, 'Group not found in your organization');
  return { id: row.id };
}

// ---------- посещаемость организации (Super Attendance страница) ----------

export async function attendance(orgId, { groupId, date }) {
  const rows = await repo.orgAttendance(orgId, { groupId, date });
  const totals = { present: 0, absent: 0, late: 0, excused: 0 };
  const records = rows.map((a) => {
    if (totals[a.status] !== undefined) totals[a.status] += 1;
    return {
      id: a.id,
      groupId: a.group_id,
      groupName: a.group_name,
      studentId: a.student_id,
      firstName: a.first_name,
      lastName: a.last_name,
      date: a.lesson_date,
      status: a.status,
    };
  });
  return { records, lessons: records, totals, total: records.length };
}

// ---------- объявления организации (Super Announcements) ----------

function mapAnnouncement(a) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    targetType: a.target_type,
    recipientCount: Number(a.recipient_count),
    readCount: 0, // пометок «прочитано» в системе пока нет
    senderName: a.sender_name ?? null,
    readers: [],
    nonReaders: [],
    createdAt: a.created_at,
  };
}

export async function listAnnouncements(orgId) {
  const rows = await repo.listAnnouncements(orgId);
  const items = rows.map(mapAnnouncement);
  return { items, announcements: items, total: items.length };
}

export async function createAnnouncement(orgId, senderId, { title, body, targetType }) {
  const recipientCount = await repo.countAnnouncementRecipients(orgId, targetType);
  const row = await repo.insertAnnouncement({ orgId, senderId, title, body, targetType, recipientCount });

  // Telegram-доставка только для аудиторий, у которых есть привязка бота
  // (родители/студенты). Сотрудники получают объявление как внутреннюю запись.
  if (targetType === 'all-parents' || targetType === 'all-students') {
    const studentIds = await repo.orgActiveStudentIds(orgId);
    if (studentIds.length > 0) {
      await notificationQueue.add('announcement.created', { studentIds, title, message: body });
    }
  }

  return mapAnnouncement(row);
}

export async function deleteAnnouncement(orgId, id) {
  const row = await repo.softDeleteAnnouncement(id, orgId);
  if (!row) throw new AppError(404, 'Announcement not found in your organization');
  return { id: row.id };
}

// ---------- аудит-лог организации (Super Audit) ----------

function mapAudit(a) {
  return {
    id: a.id,
    action: a.action,
    actorName: a.actor_name ?? null,
    actorRole: a.actor_role ?? null,
    entityType: a.entity_type ?? null,
    entityId: a.entity_id ?? null,
    entityLabel: a.entity_label ?? null,
    success: a.success,
    ip: a.ip ?? null,
    userAgent: a.user_agent ?? null,
    meta: a.meta ?? null,
    createdAt: a.created_at,
  };
}

export async function listAudit(orgId) {
  const rows = await repo.listAudit(orgId);
  const items = rows.map(mapAudit);
  return { items, total: items.length };
}

/**
 * Записать событие в аудит. Никогда не бросает: аудит — побочный эффект, его сбой
 * не должен валить саму операцию (создание админа и т.п.). Ошибку только логируем.
 */
export async function recordAudit(entry) {
  try {
    await repo.insertAudit(entry);
  } catch (err) {
    logger.error({ err, action: entry.action }, 'Failed to write audit log');
  }
}

// ---------- статистика организации (Super Stats) ----------

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

export async function stats(orgId, period = '30d') {
  const days = PERIOD_DAYS[period] ?? 30;
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [t, branches, series, methods] = await Promise.all([
    repo.orgTotals(orgId),
    repo.branchBreakdown(orgId),
    repo.revenueSeries(orgId, from),
    repo.revenueByMethod(orgId, from),
  ]);
  const revenue = Number(t.revenue);
  const debt = Number(t.outstanding_debt);
  const branchCount = Number(t.branches);
  /* Выручка именно за выбранный период. Без неё страница противоречила себе:
     сверху стояла карточка «Выручка» за всё время, а графики под ней — за
     7 дней, и партнёр видел на одном экране два разных числа про одно и то же.
     Считаем по уже полученному ряду по дням — лишнего запроса в базу нет. */
  const periodRevenue = series.reduce((sum, r) => sum + Number(r.revenue), 0);
  return {
    period,
    totals: {
      revenue,
      periodRevenue,
      periodAvgRevenue: branchCount > 0 ? periodRevenue / branchCount : 0,
      outstandingDebt: debt,
      activeStudents: Number(t.active_students),
      admins: Number(t.admins),
      branches: branchCount,
      avgRevenue: branchCount > 0 ? revenue / branchCount : 0,
      debtRatio: revenue + debt > 0 ? Number(((debt / (revenue + debt)) * 100).toFixed(1)) : 0,
      currency: 'UZS',
    },
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      revenue: Number(b.revenue),
      debt: Number(b.debt),
      students: Number(b.students),
      admins: Number(b.admins),
      // доля филиала в выручке организации — раньше жила только в /super/reports;
      // Отчёты слиты в Статистику 2026-07-28 (была одна и та же выборка на двух
      // страницах), поле переехало сюда.
      share: revenue > 0 ? Number(((Number(b.revenue) / revenue) * 100).toFixed(1)) : 0,
    })),
    revenueSeries: series.map((s) => ({ date: s.day, revenue: Number(s.revenue) })),
    paymentMethods: methods.map((m) => ({ method: m.method, amount: Number(m.amount) })),
  };
}

// ---------- дашборд организации ----------

export async function dashboard(orgId) {
  const [t, branches] = await Promise.all([repo.orgTotals(orgId), repo.branchBreakdown(orgId)]);
  return {
    totals: {
      branches: Number(t.branches),
      activeStudents: Number(t.active_students),
      admins: Number(t.admins),
      revenue: Number(t.revenue),
      outstandingDebt: Number(t.outstanding_debt),
      currency: 'UZS',
    },
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      isMain: b.is_main,
      isArchived: b.is_archived,
      students: Number(b.students),
      admins: Number(b.admins),
      revenue: Number(b.revenue),
      debt: Number(b.debt),
    })),
  };
}
