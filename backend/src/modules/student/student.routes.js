import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { blockIfOverdue } from '../../middlewares/paymentGate.js';
import homeRoutes from './home/home.routes.js';
import shopRoutes from './shop/shop.routes.js';
import homeworkRoutes from './homework/homework.routes.js';
import testsRoutes from './tests/tests.routes.js';
import videosRoutes from './videos/videos.routes.js';
import leaderboardRoutes from './leaderboard/leaderboard.routes.js';

/**
 * Агрегатор student-домена — монтируется main-агентом в app.js.
 * shop открыт также admin/mentor (создание/правка товаров) — роль на
 * мутациях дополнительно проверяет shop.service.
 *
 * blockIfOverdue (K-PAY): пока у студента есть просроченный (>5 числа)
 * неоплаченный счёт — 402 на любой роут ниже, данные не отдаются вообще.
 * На admin/mentor (заходят только в /shop) не действует — гейт молчит,
 * если req.user.role !== 'student'.
 */
const router = Router();

router.use(authenticate);

router.use('/home', authorize('student'), blockIfOverdue, homeRoutes);
router.use('/shop', authorize('student', 'admin', 'mentor'), blockIfOverdue, shopRoutes);
router.use('/homework', authorize('student'), blockIfOverdue, homeworkRoutes);
router.use('/tests', authorize('student'), blockIfOverdue, testsRoutes);
router.use('/videos', authorize('student'), blockIfOverdue, videosRoutes);
router.use('/leaderboard', authorize('student'), blockIfOverdue, leaderboardRoutes);

export default router;
