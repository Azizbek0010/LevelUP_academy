import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './tests.controller.js';
import { testIdParamSchema, submitTestSchema } from './tests.schemas.js';

const router = Router();

// auth: authenticate + authorize('student') навешаны в student.routes.js
router.get('/', ctrl.listTests);
router.get('/:testId', validate({ params: testIdParamSchema }), ctrl.getTest);
router.post('/:testId/start', validate({ params: testIdParamSchema }), ctrl.startTest);
router.post(
  '/:testId/submit',
  validate({ params: testIdParamSchema, body: submitTestSchema }),
  ctrl.submitTest,
);

export default router;
