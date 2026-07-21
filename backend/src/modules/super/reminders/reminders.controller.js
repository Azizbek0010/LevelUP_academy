import { asyncHandler } from '../../../utils/asyncHandler.js';
import * as service from './reminders.service.js';

const orgId = (req) => req.scope.organizationId;

export const list = asyncHandler(async (req, res) => {
  res.json(await service.listReminders(orgId(req)));
});

export const resend = asyncHandler(async (req, res) => {
  res.json(await service.resendReminder(orgId(req), req.params.id));
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await service.deleteReminder(orgId(req), req.params.id));
});
