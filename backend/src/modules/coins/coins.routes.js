import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './coins.controller.js';
import { historyQuerySchema } from './coins.schemas.js';

const router = Router();

router.get(
  '/me',
  authenticate,
  authorize('student'),
  validate({ query: historyQuerySchema }),
  ctrl.getMyCoins,
);

export default router;
