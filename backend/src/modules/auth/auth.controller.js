import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import * as service from './auth.service.js';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: REFRESH_COOKIE_PATH,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
});

/** Читаем refresh-cookie вручную (cookie-parser в проект не тянем). */
function readRefreshCookie(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name === REFRESH_COOKIE) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

// три раздельных входа — каждый пускает только свою группу ролей (безопасность):
//   main   → main_admin (владелец платформы)
//   staff  → admin, superadmin, mentor (сотрудники, вход по email)
//   member → student, parent (вход по логин-коду)
const ROLE_GROUPS = {
  main: ['main_admin'],
  staff: ['admin', 'superadmin', 'mentor', 'methodist'],
  member: ['student', 'parent'],
};

function makeLogin(allowedRoles) {
  return asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await service.login(req.body, allowedRoles);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ user, accessToken });
  });
}

export const loginMain = makeLogin(ROLE_GROUPS.main);
export const loginStaff = makeLogin(ROLE_GROUPS.staff);
export const loginMember = makeLogin(ROLE_GROUPS.member);

// вход через Google (Firebase) — по группам ролей, как обычный логин.
// доступен main_admin И staff (admin/superadmin/mentor). Один Firebase-проект на всех.
// member (student/parent) — без Google (нет email, вход по логин-коду).
function makeGoogleLogin(allowedRoles) {
  return asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await service.googleLogin({
      idToken: req.body?.idToken,
      allowedRoles,
    });
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ user, accessToken });
  });
}

export const loginMainGoogle = makeGoogleLogin(ROLE_GROUPS.main);
export const loginStaffGoogle = makeGoogleLogin(ROLE_GROUPS.staff);

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await service.refresh(readRefreshCookie(req));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ user, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  await service.logout(readRefreshCookie(req));
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  res.status(204).end();
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await service.forgotPassword(req.body.email);
  // одинаковый ответ независимо от существования аккаунта
  res.json({ message: 'If the account exists, a reset code has been sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body);
  res.json({ message: 'Password updated, please log in again' });
});
