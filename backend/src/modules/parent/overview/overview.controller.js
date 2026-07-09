import { asyncHandler } from '../../../utils/asyncHandler.js';
import * as service from './overview.service.js';

/** GET /children — список детей текущего родителя. */
export const listChildren = asyncHandler(async (req, res) => {
  const data = await service.listChildren(req.user.id);
  res.json({ success: true, data });
});

/** GET /children/:childId/overview — обзор конкретного ребёнка. */
export const getChildOverview = asyncHandler(async (req, res) => {
  const data = await service.getChildOverview(req.user.id, req.params.childId);
  res.json({ success: true, data });
});
