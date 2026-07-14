import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './super.service.js';

// req.scope.organizationId проставляет authorize('superadmin') — своя организация
const orgId = (req) => req.scope.organizationId;

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.dashboard(orgId(req)));
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
