import { Router } from 'express';
import { createRateLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './auth.controller.js';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';

const router = Router();

// более жёсткий лимит на весь /api/auth (поверх глобального в app.js)
router.use(createRateLimiter({ keyPrefix: 'rl:auth', points: 20, duration: 60 }));

// раздельные входы по группам ролей (безопасность: чужая роль → тот же 401)
router.post('/main/login', validate({ body: loginSchema }), ctrl.loginMain);
router.post('/staff/login', validate({ body: loginSchema }), ctrl.loginStaff);
router.post('/member/login', validate({ body: loginSchema }), ctrl.loginMember);
// Google/Firebase вход по группам ролей (main_admin + staff); один Firebase-проект
router.post('/main/google', ctrl.loginMainGoogle);   // main_admin
router.post('/staff/google', ctrl.loginStaffGoogle); // admin / superadmin / mentor
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

// восстановление пароля — отдельный, ещё более жёсткий бакет
const passwordResetLimiter = createRateLimiter({ keyPrefix: 'rl:auth:pwd', points: 5, duration: 60 });
router.post('/forgot-password', passwordResetLimiter, validate({ body: forgotPasswordSchema }), ctrl.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate({ body: resetPasswordSchema }), ctrl.resetPassword);

export default router;
