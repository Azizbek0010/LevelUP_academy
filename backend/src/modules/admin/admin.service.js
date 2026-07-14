import argon2 from 'argon2';
import { withTransaction } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../../utils/pagination.js';
import { genLoginCode, genNumericPassword } from '../auth/credentials.js';
import * as repo from './admin.repository.js';

const hash = (pwd) => argon2.hash(pwd, { type: argon2.argon2id });

// ==================== ДАШБОРД ====================

export async function dashboard(branchId) {
  const d = await repo.branchDashboard(branchId);
  const revenueTotal = Number(d.revenue_total);
  const expensesTotal = Number(d.expenses_total);
  const revenueMonth = Number(d.revenue_month);
  const expensesMonth = Number(d.expenses_month);
  return {
    totals: {
      revenue: revenueTotal,
      expenses: expensesTotal,
      profit: revenueTotal - expensesTotal,
      outstandingDebt: Number(d.outstanding_debt),
      activeStudents: Number(d.active_students),
      groups: Number(d.groups),
      overdueInvoices: Number(d.overdue_invoices),
      currency: 'UZS',
    },
    thisMonth: {
      revenue: revenueMonth,
      expenses: expensesMonth,
      profit: revenueMonth - expensesMonth,
    },
  };
}

// ==================== РАСХОДЫ ====================

export async function createExpense(scope, actorId, body) {
  const row = await repo.insertExpense({
    orgId: scope.organizationId,
    branchId: scope.branchId,
    category: body.category,
    amount: body.amount,
    spentAt: body.spentAt,
    note: body.note,
    createdBy: actorId,
  });
  return mapExpense(row);
}

export async function listExpenses(branchId, query) {
  const { page, limit, offset } = parsePagination(query);
  const filter = { branchId, from: query.from, to: query.to };
  const [rows, total] = await Promise.all([
    repo.listExpenses({ ...filter, limit, offset }),
    repo.countExpenses(filter),
  ]);
  return {
    expenses: rows.map((e) => ({
      ...mapExpense(e),
      createdBy: `${e.created_by_first} ${e.created_by_last}`,
    })),
    meta: buildPageMeta(total, page, limit),
  };
}

export async function deleteExpense(branchId, id) {
  const row = await repo.softDeleteExpense(id, branchId);
  if (!row) throw new AppError(404, 'Expense not found');
}

function mapExpense(e) {
  return {
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    spentAt: e.spent_at,
    note: e.note,
    createdAt: e.created_at,
  };
}

// ==================== СТУДЕНТЫ ====================

const MAX_CODE_TRIES = 5;

/** Вставка code-юзера с ретраем логин-кода при коллизии; телефон-дубль → 409. */
async function insertCodeUserWithCode(client, base) {
  for (let attempt = 0; attempt < MAX_CODE_TRIES; attempt += 1) {
    const loginCode = genLoginCode(8);
    try {
      const row = await repo.insertCodeUser({ ...base, loginCode }, client);
      return row;
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'uq_users_login_code') continue; // коллизия кода → регенерим
      if (err.code === '23505' && err.constraint === 'uq_users_phone') {
        throw new AppError(409, 'Phone already in use');
      }
      throw err;
    }
  }
  throw new AppError(409, 'Could not generate a unique login code, retry');
}

export async function createStudent(scope, body) {
  const { organizationId: orgId, branchId } = scope;

  // если сразу в группу — проверяем принадлежность филиалу и что не архив
  if (body.groupId) {
    const group = await repo.findGroupInBranch(body.groupId, branchId);
    if (!group) throw new AppError(404, 'Group not found in your branch');
    if (group.is_archived) throw new AppError(409, 'Group is archived');
  }

  return withTransaction(async (client) => {
    let parentOut;
    let parentId = null;

    if (body.parent) {
      const parentPassword = genNumericPassword(6);
      const parentUser = await insertCodeUserWithCode(client, {
        orgId,
        branchId,
        role: 'parent',
        firstName: body.parent.firstName,
        lastName: body.parent.lastName,
        phone: body.parent.phone,
        passwordHash: await hash(parentPassword),
      });
      parentId = parentUser.id;
      parentOut = {
        id: parentUser.id,
        firstName: parentUser.first_name,
        lastName: parentUser.last_name,
        loginCode: parentUser.login_code,
        password: parentPassword,
      };
    }

    const studentPassword = genNumericPassword(6);
    const studentUser = await insertCodeUserWithCode(client, {
      orgId,
      branchId,
      role: 'student',
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      passwordHash: await hash(studentPassword),
    });

    await repo.insertStudentProfile(
      { userId: studentUser.id, branchId, parentId, birthDate: body.birthDate },
      client,
    );

    if (body.groupId) {
      await repo.addStudentToGroupRaw({ groupId: body.groupId, studentId: studentUser.id }, client);
    }

    return {
      student: {
        id: studentUser.id,
        firstName: studentUser.first_name,
        lastName: studentUser.last_name,
        loginCode: studentUser.login_code,
        password: studentPassword,
      },
      parent: parentOut,
    };
  });
}

export async function listStudents(branchId, query) {
  const { page, limit, offset } = parsePagination(query);
  const filter = { branchId, search: query.search, groupId: query.groupId };
  const [rows, total] = await Promise.all([
    repo.listStudents({ ...filter, limit, offset }),
    repo.countStudents(filter),
  ]);
  return {
    students: rows.map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      phone: s.phone,
      status: s.status,
      loginCode: s.login_code,
      coinBalance: s.coin_balance,
      totalDebt: Number(s.total_debt),
      hasOverdueInvoice: Boolean(s.has_overdue_invoice),
      hasParent: Boolean(s.parent_id),
      groups: s.groups,
      createdAt: s.created_at,
    })),
    meta: buildPageMeta(total, page, limit),
  };
}

export async function studentDetail(branchId, id) {
  const s = await repo.findStudentInBranch(id, branchId);
  if (!s) throw new AppError(404, 'Student not found in your branch');
  const groups = await repo.studentGroups(id);
  return {
    id: s.id,
    firstName: s.first_name,
    lastName: s.last_name,
    phone: s.phone,
    status: s.status,
    loginCode: s.login_code,
    coinBalance: s.coin_balance,
    totalDebt: Number(s.total_debt),
    hasOverdueInvoice: Boolean(s.has_overdue_invoice),
    birthDate: s.birth_date,
    frozenAt: s.frozen_at,
    frozenReason: s.frozen_reason,
    hasParent: Boolean(s.parent_id),
    createdAt: s.created_at,
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      monthlyPrice: Number(g.monthly_price),
      mentor: `${g.mentor_first} ${g.mentor_last}`,
    })),
  };
}

export async function updateStudent(branchId, id, body) {
  const exists = await repo.findStudentInBranch(id, branchId);
  if (!exists) throw new AppError(404, 'Student not found in your branch');

  return withTransaction(async (client) => {
    let updated = exists;
    const userFields = {};
    for (const k of ['firstName', 'lastName', 'phone']) {
      if (body[k] !== undefined) userFields[k] = body[k];
    }
    if (Object.keys(userFields).length) {
      try {
        updated = await repo.updateStudent(id, branchId, userFields, client);
      } catch (err) {
        if (err.code === '23505' && err.constraint === 'uq_users_phone') {
          throw new AppError(409, 'Phone already in use');
        }
        throw err;
      }
    }
    if (body.birthDate !== undefined) {
      await repo.updateStudentBirthDate(id, body.birthDate, client);
    }
    return {
      id: updated.id,
      firstName: updated.first_name,
      lastName: updated.last_name,
      phone: updated.phone,
      status: updated.status,
    };
  });
}

export async function setStudentFrozen(branchId, id, frozen, reason) {
  const row = await repo.setStudentFrozen(id, branchId, frozen, reason);
  if (!row) throw new AppError(404, 'Student not found in your branch');
  return { id: row.id, status: row.status };
}

/** Admin перевыдаёт пароль ученику (у code-ролей нет forgot-password). */
export async function regenerateStudentPassword(branchId, id) {
  const password = genNumericPassword(6);
  const row = await repo.setStudentPassword(id, branchId, await hash(password));
  if (!row) throw new AppError(404, 'Student not found in your branch');
  return { id, password };
}

/** Мягкое удаление ученика + выход из всех групп. */
export async function deleteStudent(branchId, id) {
  return withTransaction(async (client) => {
    const row = await repo.softDeleteStudent(id, branchId, client);
    if (!row) throw new AppError(404, 'Student not found in your branch');
    await repo.leaveAllGroups(id, client);
  });
}

// ==================== МЕНТОРЫ ====================

export async function createMentor(scope, body) {
  let row;
  try {
    row = await repo.insertMentor({
      orgId: scope.organizationId,
      branchId: scope.branchId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      passwordHash: await hash(body.password),
    });
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'uq_users_email') {
      throw new AppError(409, 'Email already in use');
    }
    if (err.code === '23505' && err.constraint === 'uq_users_phone') {
      throw new AppError(409, 'Phone already in use');
    }
    throw err;
  }
  return mapMentor(row);
}

export async function listMentors(branchId) {
  const rows = await repo.listMentors(branchId);
  return {
    mentors: rows.map((m) => ({ ...mapMentor(m), groups: Number(m.groups), createdAt: m.created_at })),
  };
}

export async function setMentorFrozen(branchId, id, frozen) {
  const row = await repo.setMentorStatus(id, branchId, frozen ? 'frozen' : 'active');
  if (!row) throw new AppError(404, 'Mentor not found in your branch');
  return mapMentor(row);
}

export async function updateMentor(branchId, id, body) {
  let row;
  try {
    row = await repo.updateMentor(id, branchId, body);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'uq_users_phone') {
      throw new AppError(409, 'Phone already in use');
    }
    throw err;
  }
  if (!row) throw new AppError(404, 'Mentor not found in your branch');
  return mapMentor(row);
}

/** Удалить ментора можно, только если он не ведёт активных групп. */
export async function deleteMentor(branchId, id) {
  const active = await repo.countMentorActiveGroups(id, branchId);
  if (active > 0) {
    throw new AppError(409, 'Mentor still leads active groups — reassign or archive them first');
  }
  const row = await repo.softDeleteMentor(id, branchId);
  if (!row) throw new AppError(404, 'Mentor not found in your branch');
}

function mapMentor(m) {
  return {
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    email: m.email,
    phone: m.phone,
    status: m.status,
  };
}

// ==================== ГРУППЫ ====================

export async function createGroup(branchId, body) {
  const mentor = await repo.findMentorInBranch(body.mentorId, branchId);
  if (!mentor) throw new AppError(404, 'Mentor not found in your branch');
  const row = await repo.insertGroup({ branchId, ...body });
  return mapGroup(row);
}

export async function listGroups(branchId, query) {
  const { page, limit, offset } = parsePagination(query);
  const [rows, total] = await Promise.all([
    repo.listGroups({ branchId, limit, offset }),
    repo.countGroups({ branchId }),
  ]);
  return {
    groups: rows.map((g) => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      monthlyPrice: Number(g.monthly_price),
      room: g.room,
      isArchived: g.is_archived,
      students: Number(g.students),
      mentor: { id: g.mentor_id, name: `${g.mentor_first} ${g.mentor_last}` },
      createdAt: g.created_at,
    })),
    meta: buildPageMeta(total, page, limit),
  };
}

export async function groupDetail(branchId, id) {
  const g = await repo.findGroupInBranch(id, branchId);
  if (!g) throw new AppError(404, 'Group not found in your branch');
  const students = await repo.groupStudents(id);
  return {
    ...mapGroup(g),
    mentor: { id: g.mentor_id, name: `${g.mentor_first} ${g.mentor_last}` },
    students: students.map((s) => ({
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      phone: s.phone,
      status: s.status,
      totalDebt: Number(s.total_debt),
      coinBalance: s.coin_balance,
      joinedAt: s.joined_at,
    })),
  };
}

export async function updateGroup(branchId, id, body) {
  const group = await repo.findGroupInBranch(id, branchId);
  if (!group) throw new AppError(404, 'Group not found in your branch');
  if (body.mentorId !== undefined) {
    const mentor = await repo.findMentorInBranch(body.mentorId, branchId);
    if (!mentor) throw new AppError(404, 'Mentor not found in your branch');
  }
  const row = await repo.updateGroup(id, branchId, body);
  return mapGroup(row);
}

export async function setGroupArchived(branchId, id, archived) {
  const row = await repo.setGroupArchived(id, branchId, archived);
  if (!row) throw new AppError(404, 'Group not found in your branch');
  return mapGroup(row);
}

export async function addGroupStudent(branchId, groupId, studentId) {
  const group = await repo.findGroupInBranch(groupId, branchId);
  if (!group) throw new AppError(404, 'Group not found in your branch');
  if (group.is_archived) throw new AppError(409, 'Group is archived');
  const student = await repo.findStudentInBranch(studentId, branchId);
  if (!student) throw new AppError(404, 'Student not found in your branch');
  await repo.addStudentToGroupRaw({ groupId, studentId });
  return { groupId, studentId };
}

export async function removeGroupStudent(branchId, groupId, studentId) {
  const group = await repo.findGroupInBranch(groupId, branchId);
  if (!group) throw new AppError(404, 'Group not found in your branch');
  const row = await repo.removeStudentFromGroup(groupId, studentId);
  if (!row) throw new AppError(404, 'Student is not an active member of this group');
}

function mapGroup(g) {
  return {
    id: g.id,
    name: g.name,
    subject: g.subject,
    monthlyPrice: Number(g.monthly_price),
    schedule: g.schedule,
    room: g.room,
    isArchived: g.is_archived,
    createdAt: g.created_at,
  };
}
