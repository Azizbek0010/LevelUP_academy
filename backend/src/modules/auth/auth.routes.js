import { Router } from 'express';
import { createRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './auth.controller.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';

const router = Router();

// более жёсткий лимит на весь /api/auth (поверх глобального в app.js)
router.use(createRateLimiter({ keyPrefix: 'rl:auth', points: 20, duration: 60 }));

/**
 * @openapi
 * /api/auth/main/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login as Main Admin (email + password)
 *     description: >
 *       Only accounts with role `main_admin` may authenticate here. Any other role
 *       returns the same 401 as a wrong password (no role/account enumeration).
 *       On success a `refresh_token` httpOnly cookie (path `/api/auth`, 30 days) is set.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Invalid login or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Account is frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       429:
 *         description: Rate limit exceeded (20 req/min per IP on /api/auth, plus global limiter)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/main/login', validate({ body: loginSchema }), ctrl.loginMain);

/**
 * @openapi
 * /api/auth/staff/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login as staff (admin, superadmin, mentor, methodist) via email + password
 *     description: >
 *       Only accounts with role `admin`, `superadmin`, `mentor` or `methodist` may
 *       authenticate here. Sets the `refresh_token` httpOnly cookie on success.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Invalid login or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Account is frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 */
router.post('/staff/login', validate({ body: loginSchema }), ctrl.loginStaff);

/**
 * @openapi
 * /api/auth/member/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login as member (student, parent) via login-code + password
 *     description: >
 *       `login` field carries the 8-char login code for student/parent accounts
 *       (not an email). Only role `student` or `parent` accepted. Sets the
 *       `refresh_token` httpOnly cookie on success.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Invalid login or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Account is frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 */
router.post('/member/login', validate({ body: loginSchema }), ctrl.loginMember);

/**
 * @openapi
 * /api/auth/main/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login as Main Admin via Google/Firebase id-token
 *     description: >
 *       Verifies the Google id-token (audience = GOOGLE_CLIENT_ID) via google-auth-library.
 *       The Google account must already be linked to an existing `main_admin` user by
 *       email (Google never creates new accounts). Not validated by zod — body is read
 *       directly as `{ idToken }`.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GoogleLoginRequest' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: idToken required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Invalid Google token, or email not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: No account for this Google email, account not allowed here, or frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       503:
 *         description: Google login is not configured on this server (missing GOOGLE_CLIENT_ID)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/main/google', ctrl.loginMainGoogle);   // main_admin

/**
 * @openapi
 * /api/auth/staff/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login as staff (admin, superadmin, mentor, methodist) via Google/Firebase id-token
 *     description: Same flow as /api/auth/main/google, restricted to staff roles.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GoogleLoginRequest' }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: idToken required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Invalid Google token, or email not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: No account for this Google email, account not allowed here, or frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       503:
 *         description: Google login is not configured on this server (missing GOOGLE_CLIENT_ID)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/staff/google', ctrl.loginStaffGoogle); // admin / superadmin / mentor

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 *     description: >
 *       Reads the `refresh_token` httpOnly cookie (no request body). Implements
 *       rotation with reuse-detection: presenting an already-revoked token revokes
 *       the user's entire token family and returns 401. On success, the old token
 *       is revoked and a new refresh/access token pair is issued.
 *     security: []
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Refresh token missing, invalid, expired, or reuse detected
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Account is frozen
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/refresh', ctrl.refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear the cookie
 *     description: Reads `refresh_token` cookie; silently no-ops if absent or already revoked.
 *     security: []
 *     responses:
 *       204:
 *         description: Logged out (cookie cleared, refresh token revoked if it existed)
 */
router.post('/logout', ctrl.logout);

// восстановление пароля — отдельный, ещё более жёсткий бакет
const passwordResetLimiter = createRateLimiter({ keyPrefix: 'rl:auth:pwd', points: 5, duration: 60 });

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset OTP code by email
 *     description: >
 *       Always returns the same success message regardless of whether the account
 *       exists (anti user-enumeration). If the account exists and has an email, a
 *       6-digit OTP (valid 3 minutes, max 3 attempts) is emailed. Resend cooldown of
 *       60s per email is enforced silently. Rate-limited to 5 req/min (route-specific
 *       bucket, in addition to the /api/auth-wide and global limiters).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ForgotPasswordRequest' }
 *     responses:
 *       200:
 *         description: Always returned on valid input, regardless of account existence
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/forgot-password', passwordResetLimiter, validate({ body: forgotPasswordSchema }), ctrl.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm OTP and set a new password
 *     description: >
 *       On success, revokes ALL of the user's existing refresh tokens (forces
 *       re-login on every device) and deletes the OTP. 400 is returned both for a
 *       wrong/expired code and for an unknown email (no enumeration). After 3 failed
 *       attempts the code is invalidated and 429 is returned.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MessageResponse' }
 *       400:
 *         description: Code expired/not requested, invalid code, or invalid request
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       429:
 *         description: Too many invalid attempts, request a new code (or rate limit exceeded)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/reset-password', passwordResetLimiter, validate({ body: resetPasswordSchema }), ctrl.resetPassword);

export default router;
