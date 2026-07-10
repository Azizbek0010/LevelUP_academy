import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { grantCoinsSchema, studentParam, historyQuery } from './coins.schemas.js';
import * as ctrl from './coins.controller.js';

/**
 * Mentor/Admin — ручное начисление коинов. Смонтирован под /api/mentor/coins;
 * authenticate + authorize('mentor','admin') навешаны в mentor.routes.js.
 */
const router = Router();

router.post('/', validate({ body: grantCoinsSchema }), ctrl.grantCoins);
router.get(
  '/students/:studentId',
  validate({ params: studentParam, query: historyQuery }),
  ctrl.studentHistory,
);

export default router;
