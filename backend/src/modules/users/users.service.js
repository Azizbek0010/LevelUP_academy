import { AppError } from '../../utils/AppError.js';
import { getDownloadUrl } from '../../config/s3.js';
import * as repo from './users.repository.js';

/** Добавляет presigned-ссылку на аватар, если ключ есть. */
async function withAvatarUrl(user) {
  if (!user) return user;
  const avatarUrl = user.avatar_key ? await getDownloadUrl(user.avatar_key) : null;
  return { ...user, avatarUrl };
}

export async function getById(id) {
  const user = await repo.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return withAvatarUrl(user);
}

export async function listBranchUsers({ branchId, role, status, page, limit, offset }) {
  const [items, total] = await Promise.all([
    repo.findByBranch({ branchId, role, status, limit, offset }),
    repo.countByBranch({ branchId, role, status }),
  ]);
  return { items, total, page, limit };
}

export async function updateOwnProfile(id, patch) {
  const user = await repo.updateProfile(id, patch);
  if (!user) throw new AppError(404, 'User not found');
  return withAvatarUrl(user);
}
