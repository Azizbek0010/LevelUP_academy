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

/**
 * Обновление собственного профиля.
 *
 * Патч приходит одним объектом, но лежит в двух таблицах: имя/почта — в
 * `users`, «о себе» и навыки — в `mentor_profiles`. Разделяем здесь.
 *
 * Карточка пишется только для роли mentor: у остальных ролей её просто нет,
 * и создавать пустую строку под, скажем, кассира — мусор в базе.
 *
 * Грейд не упоминается ни здесь, ни в схеме валидации: этот путь его не
 * пишет ни при каких условиях.
 */
export async function updateOwnProfile(id, role, patch) {
  const { bio, skills, ...userFields } = patch;
  const wantsMentorProfile = bio !== undefined || skills !== undefined;

  if (wantsMentorProfile && role !== 'mentor') {
    throw new AppError(403, 'Only mentors have a professional profile');
  }

  // Патч может состоять из одних bio/skills — тогда в users менять нечего.
  if (Object.keys(userFields).length > 0) {
    const updated = await repo.updateProfile(id, userFields);
    if (!updated) throw new AppError(404, 'User not found');
  }
  if (wantsMentorProfile) {
    await repo.upsertMentorProfile(id, { bio, skills });
  }

  // Перечитываем целиком: updateProfile возвращает только колонки users, и
  // ответ на запрос со сменой имени приходил бы без bio/skills/grade — клиент
  // решил бы, что карточка опустела.
  const user = await repo.findById(id);
  if (!user) throw new AppError(404, 'User not found');
  return withAvatarUrl(user);
}
