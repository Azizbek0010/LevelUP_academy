import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './super.service.js';

// req.scope.organizationId проставляет authorize('superadmin') — своя организация
const orgId = (req) => req.scope.organizationId;

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.dashboard(orgId(req)));
});

// --- организация (профиль партнёра, Settings) ---
export const getOrganization = asyncHandler(async (req, res) => {
  res.json({ organization: await service.getOrganization(orgId(req)) });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  res.json({ organization: await service.updateOrganization(orgId(req), req.body) });
});

// --- студенты организации (Super Students) ---
export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const search = req.query.search?.trim() || null;
  const frozen =
    req.query.frozen === 'true' ? true : req.query.frozen === 'false' ? false : undefined;
  res.json(await service.listStudents(orgId(req), { search, frozen, page, limit }));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  res.json(await service.deleteStudent(orgId(req), req.params.id));
});

// --- группы организации (Super Groups) ---
export const listGroups = asyncHandler(async (req, res) => {
  res.json(await service.listGroups(orgId(req)));
});
export const archiveGroup = asyncHandler(async (req, res) => {
  res.json({ group: await service.setGroupArchived(orgId(req), req.params.id, true) });
});
export const unarchiveGroup = asyncHandler(async (req, res) => {
  res.json({ group: await service.setGroupArchived(orgId(req), req.params.id, false) });
});
export const deleteGroup = asyncHandler(async (req, res) => {
  res.json(await service.deleteGroup(orgId(req), req.params.id));
});

// --- посещаемость (Super Attendance) ---
export const attendance = asyncHandler(async (req, res) => {
  const groupId = req.query.groupId?.trim() || null;
  const date = req.query.date?.trim() || null;
  res.json(await service.attendance(orgId(req), { groupId, date }));
});

// --- announcements / reminders / audit: таблиц нет → пустые списки ---
export const listAnnouncements = asyncHandler(async (_req, res) => {
  res.json(await service.listAnnouncements());
});
export const listReminders = asyncHandler(async (_req, res) => {
  res.json(await service.listReminders());
});
export const listAudit = asyncHandler(async (_req, res) => {
  res.json(await service.listAudit());
});
// мутации по этим фичам ещё не реализованы (нужны таблицы + миграции)
export const notImplemented = asyncHandler(async (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet — needs DB table/migration' });
});

// --- филиалы ---
export const createBranch = asyncHandler(async (req, res) => {
  res.status(201).json({ branch: await service.createBranch(orgId(req), req.body) });
});

export const listBranches = asyncHandler(async (req, res) => {
  res.json({ branches: await service.listBranches(orgId(req)) });
});

export const branchDetail = asyncHandler(async (req, res) => {
  res.json({ branch: await service.branchDetail(orgId(req), req.params.id) });
});

export const updateBranch = asyncHandler(async (req, res) => {
  res.json({ branch: await service.updateBranch(orgId(req), req.params.id, req.body) });
});

export const archiveBranch = asyncHandler(async (req, res) => {
  res.json({ branch: await service.setBranchArchived(orgId(req), req.params.id, true) });
});

export const unarchiveBranch = asyncHandler(async (req, res) => {
  res.json({ branch: await service.setBranchArchived(orgId(req), req.params.id, false) });
});

// --- админы ---
export const createAdmin = asyncHandler(async (req, res) => {
  res.status(201).json({ admin: await service.createAdmin(orgId(req), req.body) });
});

export const listAdmins = asyncHandler(async (req, res) => {
  res.json({ admins: await service.listAdmins(orgId(req)) });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  res.json({ admin: await service.updateAdmin(orgId(req), req.params.id, req.body) });
});

export const freezeAdmin = asyncHandler(async (req, res) => {
  res.json({ admin: await service.setAdminFrozen(orgId(req), req.params.id, req.body.frozen) });
});

// --- методисты ---
export const createMethodist = asyncHandler(async (req, res) => {
  res.status(201).json({ methodist: await service.createMethodist(orgId(req), req.body) });
});

export const listMethodists = asyncHandler(async (req, res) => {
  res.json({ methodists: await service.listMethodists(orgId(req)) });
});

export const updateMethodist = asyncHandler(async (req, res) => {
  res.json({ methodist: await service.updateMethodist(orgId(req), req.params.id, req.body) });
});

export const freezeMethodist = asyncHandler(async (req, res) => {
  res.json({ methodist: await service.setMethodistFrozen(orgId(req), req.params.id, req.body.frozen) });
});
