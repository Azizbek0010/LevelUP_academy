import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination, buildPageMeta } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';
import * as usersService from './users.service.js';

/** GET /api/users/me — текущий пользователь. */
export const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.user.id);
  res.json({ success: true, data: user });
});

/** PATCH /api/users/me — обновить свой профиль. */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await usersService.updateOwnProfile(req.user.id, req.body);
  res.json({ success: true, data: user });
});

/**
 * GET /api/users/:id — карточка пользователя строго в своём скоупе:
 * main_admin — вся платформа; superadmin — своя организация;
 * остальные — свой филиал. Чужой скоуп неотличим от несуществующего (404).
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);

  const requester = req.user;
  if (requester.role !== 'main_admin') {
    const inScope = requester.role === 'superadmin'
      ? user.organization_id === requester.organizationId
      : user.branch_id === requester.branchId;
    if (!inScope) throw new AppError(404, 'User not found');
  }

  res.json({ success: true, data: user });
});

/** GET /api/users — список пользователей своего филиала. */
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const branchId = req.user.branchId;
  if (!branchId) throw new AppError(400, 'Branch scope required');

  const result = await usersService.listBranchUsers({ branchId, role, status, page, limit, offset });
  res.json({
    success: true,
    data: result.items,
    meta: buildPageMeta(result.total, page, limit),
  });
});
