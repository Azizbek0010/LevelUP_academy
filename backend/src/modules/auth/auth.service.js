import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { pool, withTransaction } from '../../config/db.js';
import { sendMail } from '../../config/mailer.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';
import * as repo from './auth.repository.js';
import { buildOtpEmail } from './otpEmail.js';

const ACCESS_TTL = '1h';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const OTP_TTL_SEC = 180; // 3 минуты
const OTP_MAX_ATTEMPTS = 3;
const OTP_RESEND_COOLDOWN_SEC = 60; // не чаще 1 запроса в минуту на телефон

// ---------- токены ----------

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, orgId: user.organization_id ?? null, branchId: user.branch_id ?? null },
    env.JWT_ACCESS_SECRET,
    { subject: user.id, expiresIn: ACCESS_TTL },
  );
}

function generateRefreshToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function publicUser(u) {
  return {
    id: u.id,
    role: u.role,
    organizationId: u.organization_id ?? null,
    branchId: u.branch_id ?? null,
    firstName: u.first_name,
    lastName: u.last_name,
  };
}

async function issueTokens(user, client = pool) {
  const accessToken = signAccessToken(user);
  const { token, hash } = generateRefreshToken();
  await repo.insertRefreshToken(
    { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
    client,
  );
  return { accessToken, refreshToken: token };
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ---------- login / refresh / logout ----------

export async function login({ login, password }, allowedRoles = null) {
  // login = email (admin/superadmin/main_admin/mentor) ИЛИ login_code (parent/student)
  const user = await repo.findUserByLogin(login);
  // одинаковая ошибка на "нет юзера" и "неверный пароль" — против перебора и энумерации
  if (!user || !user.password_hash || !(await argon2.verify(user.password_hash, password))) {
    throw new AppError(401, 'Invalid login or password');
  }
  // роль не разрешена на этом endpoint (напр. main_admin ломится в staff-вход) —
  // отдаём тот же 401, чтобы чужой вход не подтверждал даже валидность креды
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AppError(401, 'Invalid login or password');
  }
  if (user.status === 'frozen') {
    throw new AppError(403, 'Account is frozen');
  }
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

// ---------- вход через Google (Firebase popup → Google id-token) ----------

const googleClient = new OAuth2Client();

export async function googleLogin({ idToken, allowedRoles = null } = {}) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'Google login is not configured');
  if (!idToken) throw new AppError(400, 'idToken required');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, 'Invalid Google token');
  }
  if (!payload?.email || !payload.email_verified) {
    throw new AppError(401, 'Google email not verified');
  }

  // привязка по email: пускаем только тех, кто УЖЕ заведён (Google не создаёт новых)
  const user = await repo.findUserByEmail(payload.email.toLowerCase());
  if (!user) throw new AppError(403, 'No account for this Google email');
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AppError(403, 'This account is not allowed here');
  }
  if (user.status === 'frozen') throw new AppError(403, 'Account is frozen');

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(presentedToken) {
  if (!presentedToken) throw new AppError(401, 'Refresh token required');
  const hash = hashToken(presentedToken);

  const existing = await repo.findRefreshByHash(hash);
  if (!existing) throw new AppError(401, 'Invalid refresh token');

  // reuse-detection: предъявили уже отозванный токен → компрометация. Гасим всю
  // семью ВНЕ транзакции ротации — иначе rollback ниже откатил бы этот отзыв.
  if (existing.revoked_at) {
    await repo.revokeAllUserTokens(existing.user_id);
    throw new AppError(401, 'Refresh token reuse detected');
  }
  if (new Date(existing.expires_at) < new Date()) {
    throw new AppError(401, 'Refresh token expired');
  }

  return withTransaction(async (client) => {
    // строку берём под FOR UPDATE — два параллельных refresh не пройдут оба
    const row = await repo.lockRefreshById(existing.id, client);
    if (!row || row.revoked_at) throw new AppError(401, 'Invalid refresh token');

    const user = await repo.findUserById(row.user_id, client);
    if (!user) throw new AppError(401, 'Invalid refresh token');
    if (user.status === 'frozen') throw new AppError(403, 'Account is frozen');

    // rotation: гасим старый токен, выдаём новую пару
    await repo.revokeRefreshToken(row.id, client);
    const tokens = await issueTokens(user, client);
    return { user: publicUser(user), ...tokens };
  });
}

export async function logout(presentedToken) {
  if (!presentedToken) return;
  const row = await repo.findRefreshByHash(hashToken(presentedToken));
  if (row && !row.revoked_at) await repo.revokeRefreshToken(row.id);
}

// ---------- OTP: forgot / reset password ----------

const otpKey = (email) => `auth:otp:${email}`;
const otpCooldownKey = (email) => `auth:otp:cd:${email}`;

/** Всегда «успех» снаружи (no user enumeration). Внутри — тихая логика. */
export async function forgotPassword(email) {
  if (await redis.get(otpCooldownKey(email))) return; // анти-спам: 1 запрос / 60с

  const user = await repo.findUserByEmail(email);
  if (!user) return; // не раскрываем, существует ли аккаунт

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await redis.set(otpKey(email), JSON.stringify({ otp, attempts: 0 }), 'EX', OTP_TTL_SEC);
  await redis.set(otpCooldownKey(email), '1', 'EX', OTP_RESEND_COOLDOWN_SEC);

  // сброс пароля — только по email (parent/student без email сюда не попадают: findUserByEmail=null).
  // SMS не используем (платно) — единственный канал OTP это email.
  const minutes = Math.round(OTP_TTL_SEC / 60);
  const mail = buildOtpEmail(otp, minutes);
  await sendMail({
    to: user.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.attachments,
  }).catch((err) => logger.warn({ err }, 'OTP email send failed'));
}

export async function resetPassword({ email, otp, newPassword }) {
  const key = otpKey(email);
  const raw = await redis.get(key);
  if (!raw) throw new AppError(400, 'Code expired or not requested');

  const data = JSON.parse(raw);
  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    throw new AppError(429, 'Too many attempts, request a new code');
  }
  if (data.otp !== otp) {
    data.attempts += 1;
    const ttl = await redis.ttl(key);
    await redis.set(key, JSON.stringify(data), 'EX', ttl > 0 ? ttl : OTP_TTL_SEC);
    throw new AppError(400, 'Invalid code');
  }

  const user = await repo.findUserByEmail(email);
  if (!user) {
    await redis.del(key);
    throw new AppError(400, 'Invalid request');
  }

  const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await withTransaction(async (client) => {
    await repo.updatePassword(user.id, passwordHash, client);
    await repo.revokeAllUserTokens(user.id, client); // разлогинить все сессии
  });
  await redis.del(key);
}
