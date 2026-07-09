import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { archiveGuard } from '../../../middlewares/archiveGuard.js';
import * as ctrl from './tests.controller.js';
import { groupIdParamSchema, testIdParamSchema, createTestBodySchema } from './tests.schemas.js';

const router = Router();

// auth: authenticate + authorize('mentor','admin') навешаны в mentor.routes.js
router.post(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema, body: createTestBodySchema }),
  archiveGuard('groups', 'groupId'),
  ctrl.createTest,
);

router.get(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema }),
  ctrl.listTestsForGroup,
);

router.get(
  '/:testId/results',
  validate({ params: testIdParamSchema }),
  ctrl.listResults,
);

export default router;
