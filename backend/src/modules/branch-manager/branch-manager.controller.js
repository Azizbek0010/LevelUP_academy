import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './branch-manager.service.js';

const branchId = (req) => req.scope.branchId;

export const dashboard = asyncHandler(async (req, res) => {
  res.json(await service.dashboard(branchId(req)));
});

export const branch = asyncHandler(async (req, res) => {
  res.json(await service.branch(branchId(req)));
});

export const income = asyncHandler(async (req, res) => {
  res.json(await service.income(branchId(req), req.query));
});

export const expenses = asyncHandler(async (req, res) => {
  res.json(await service.expenses(branchId(req), req.query));
});

export const reports = asyncHandler(async (req, res) => {
  res.json(await service.reports(branchId(req), req.query));
});