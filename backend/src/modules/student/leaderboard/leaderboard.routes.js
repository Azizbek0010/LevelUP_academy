import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './leaderboard.controller.js';
import { leaderboardQuerySchema } from './leaderboard.schemas.js';

const router = Router();

// auth: authenticate + authorize('student') навешаны в student.routes.js
router.get('/', validate({ query: leaderboardQuerySchema }), ctrl.getMyLeaderboard);

export default router;
