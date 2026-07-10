import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './overview.controller.js';
import { childIdParamSchema } from './overview.schemas.js';

const router = Router();

// auth: authenticate + authorize('parent') навешаны в parent.routes.js
router.get('/children', ctrl.listChildren);
router.get(
  '/children/:childId/overview',
  validate({ params: childIdParamSchema }),
  ctrl.getChildOverview,
);

export default router;
