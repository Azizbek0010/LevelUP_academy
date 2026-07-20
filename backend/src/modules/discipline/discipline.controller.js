import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './discipline.service.js';

const issuerOf = (req) => ({ id: req.user.id, role: req.user.role, branchId: req.user.branchId });

// POST /penalties — выдать штраф или qora (super / admin, права в сервисе)
export const issuePenalty = asyncHandler(async (req, res) => {
  const result = await service.issuePenalty(issuerOf(req), req.scope, req.body);
  res.status(201).json({ success: true, data: result });
});

// GET /penalties — список (super: вся org; admin: выданные им)
export const listPenalties = asyncHandler(async (req, res) => {
  const items = await service.listPenalties(issuerOf(req), req.scope, req.query);
  res.json({ success: true, data: items });
});

// GET /me/penalties — свои штрафы (любой сотрудник)
export const myPenalties = asyncHandler(async (req, res) => {
  const items = await service.myPenalties(req.user.id);
  res.json({ success: true, data: items });
});

// POST /staff/:id/reactivate — вернуть уволенного (super only, guard в роуте)
export const reactivateStaff = asyncHandler(async (req, res) => {
  const result = await service.reactivateStaff(req.scope.organizationId, req.params.id);
  res.json({ success: true, data: result });
});

// GET /charter — устав организации (super / admin / любой сотрудник через /me)
export const getCharter = asyncHandler(async (req, res) => {
  const charter = await service.getCharter(req.scope.organizationId);
  res.json({ success: true, data: charter });
});

// PUT /charter — создать/изменить устав (super only, guard в роуте)
export const upsertCharter = asyncHandler(async (req, res) => {
  const charter = await service.upsertCharter(req.scope.organizationId, req.user.id, req.body);
  res.json({ success: true, data: charter });
});
