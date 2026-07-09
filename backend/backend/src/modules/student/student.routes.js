import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
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
 */
const router = Router();

router.use(authenticate);

router.use('/home', authorize('student'), homeRoutes);
router.use('/shop', authorize('student', 'admin', 'mentor'), shopRoutes);
router.use('/homework', authorize('student'), homeworkRoutes);
router.use('/tests', authorize('student'), testsRoutes);
router.use('/videos', authorize('student'), videosRoutes);
router.use('/leaderboard', authorize('student'), leaderboardRoutes);

export default router;
