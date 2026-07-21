import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './super.service.js';

// req.scope.organizationId проставляет authorize('superadmin') — своя организация
const orgId = (req) => req.scope.organizationId;

/**
 * Записать событие в аудит из контекста запроса (актор/ip/user-agent). Fire-and-
 * forget: recordAudit сам глотает ошибки, ответ не должен зависеть от аудита.
 */
function audit(req, { action, entityType, entityId, entityLabel, meta }) {
  return service.recordAudit({
    orgId: orgId(req),
    actorId: req.user?.id,
    actorRole: req.user?.role,
    action,
    entityType,
    entityId,
    entityLabel,
    meta,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.dashboard(orgId(req)));
});

// --- организация (профиль партнёра, Settings) ---
export const getOrganization = asyncHandler(async (req, res) => {
  res.json({ organization: await service.getOrganization(orgId(req)) });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await service.updateOrganization(orgId(req), req.body);
  await audit(req, {
    action: 'organization.update',
    entityType: 'organization',
    entityId: organization.id,
    entityLabel: organization.name,
    meta: { fields: Object.keys(req.body) },
  });
  res.json({ organization });
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
  const result = await service.deleteStudent(orgId(req), req.params.id);
  await audit(req, { action: 'student.delete', entityType: 'student', entityId: req.params.id });
  res.json(result);
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
  const result = await service.deleteGroup(orgId(req), req.params.id);
  await audit(req, { action: 'group.delete', entityType: 'group', entityId: req.params.id });
  res.json(result);
});

// --- посещаемость (Super Attendance) ---
export const attendance = asyncHandler(async (req, res) => {
  const groupId = req.query.groupId?.trim() || null;
  const date = req.query.date?.trim() || null;
  res.json(await service.attendance(orgId(req), { groupId, date }));
});

// --- объявления организации ---
export const listAnnouncements = asyncHandler(async (req, res) => {
  res.json(await service.listAnnouncements(orgId(req)));
});
export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await service.createAnnouncement(orgId(req), req.user.id, req.body);
  await audit(req, {
    action: 'announcement.create',
    entityType: 'announcement',
    entityId: announcement.id,
    entityLabel: announcement.title,
    meta: { targetType: announcement.targetType, recipientCount: announcement.recipientCount },
  });
  res.status(201).json({ announcement });
});
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await service.deleteAnnouncement(orgId(req), req.params.id);
  await audit(req, { action: 'announcement.delete', entityType: 'announcement', entityId: req.params.id });
  res.json(result);
});

// --- reminders: заглушка (нужна запись из воркера, AB-SUPER-REM) ---
export const listReminders = asyncHandler(async (_req, res) => {
  res.json(await service.listReminders());
});
export const notImplemented = asyncHandler(async (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet — needs DB table/migration' });
});

// --- аудит-лог ---
export const listAudit = asyncHandler(async (req, res) => {
  res.json(await service.listAudit(orgId(req)));
});

// --- статистика / отчёты ---
export const stats = asyncHandler(async (req, res) => {
  res.json(await service.stats(orgId(req), req.query.period));
});
export const reports = asyncHandler(async (req, res) => {
  res.json(await service.reports(orgId(req)));
});

// --- филиалы ---
export const createBranch = asyncHandler(async (req, res) => {
  const branch = await service.createBranch(orgId(req), req.body);
  await audit(req, {
    action: 'branch.create',
    entityType: 'branch',
    entityId: branch.id,
    entityLabel: branch.name,
  });
  res.status(201).json({ branch });
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
  const admin = await service.createAdmin(orgId(req), req.body);
  await audit(req, {
    action: 'admin.create',
    entityType: 'admin',
    entityId: admin.id,
    entityLabel: `${admin.firstName} ${admin.lastName}`,
  });
  res.status(201).json({ admin });
});

export const listAdmins = asyncHandler(async (req, res) => {
  res.json({ admins: await service.listAdmins(orgId(req)) });
});

export const updateAdmin = asyncHandler(async (req, res) => {
  res.json({ admin: await service.updateAdmin(orgId(req), req.params.id, req.body) });
});

export const freezeAdmin = asyncHandler(async (req, res) => {
  const admin = await service.setAdminFrozen(orgId(req), req.params.id, req.body.frozen);
  await audit(req, {
    action: req.body.frozen ? 'admin.freeze' : 'admin.unfreeze',
    entityType: 'admin',
    entityId: admin.id,
    entityLabel: `${admin.firstName} ${admin.lastName}`,
  });
  res.json({ admin });
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
