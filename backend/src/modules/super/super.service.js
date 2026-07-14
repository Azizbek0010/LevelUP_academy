import argon2 from 'argon2';
import { AppError } from '../../utils/AppError.js';
import { planLimits } from '../../config/plans.js';
import * as repo from './super.repository.js';

// ---------- филиалы ----------

/** Первый филиал организации становится главным (is_main). */
export async function createBranch(orgId, { name, address, phone }) {
  const existing = await repo.countBranches(orgId);
  const branch = await repo.insertBranch({
    orgId,
    name,
    address,
    phone,
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
    admins: Number(b.admins),
    students: Number(b.students),
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
export async function branchDetail(orgId, id) {
  const branch = await repo.findBranchFull(id, orgId);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');
  const [admins, groups] = await Promise.all([
    repo.listBranchAdmins(id),
    repo.listBranchGroups(id),
  ]);
  return {
    ...mapBranch(branch),
    admins: admins.map((a) => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      email: a.email,
      status: a.status,
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      monthlyPrice: Number(g.monthly_price),
    })),
  };
}

// ---------- админы ----------

export async function createAdmin(orgId, { firstName, lastName, email, password, branchId, phone }) {
  // филиал должен принадлежать ЭТОЙ организации — иначе super admin суёт чужой филиал
  const branch = await repo.findBranchInOrg(branchId, orgId);
  if (!branch) throw new AppError(404, 'Branch not found in your organization');

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

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
  };
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

export async function createMethodist(orgId, { firstName, lastName, email, password, phone }) {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  try {
    const row = await repo.insertMethodist({
      orgId,
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
    });
    return mapMethodist(row);
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'Email already in use');
    throw err;
  }
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

// ---------- заглушки: нет таблиц (announcements/reminders/audit) ----------
// Таблиц в схеме нет. Возвращаем пустые списки, чтобы страницы рендерились (EmptyState).
// Полная реализация = миграции + notificationQueue (домен AB-V1/Bilol) — отдельная задача.

export async function listAnnouncements() {
  return { announcements: [], items: [], total: 0 };
}
export async function listReminders() {
  return { reminders: [], items: [], total: 0 };
}
export async function listAudit() {
  return { items: [], total: 0 };
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
