import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { archiveGuard } from '../../../middlewares/archiveGuard.js';
import * as ctrl from './homework.controller.js';
import {
  groupIdParamSchema,
  homeworkIdParamSchema,
  submissionIdParamSchema,
  createHomeworkBodySchema,
  gradeSubmissionBodySchema,
} from './homework.schemas.js';

const router = Router();

// auth: authenticate + authorize('mentor','admin') навешаны в mentor.routes.js
router.post(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema, body: createHomeworkBodySchema }),
  archiveGuard('groups', 'groupId'),
  ctrl.createHomework,
);

router.get(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema }),
  ctrl.listHomeworkForGroup,
);

router.get(
  '/:homeworkId/submissions',
  validate({ params: homeworkIdParamSchema }),
  ctrl.listSubmissions,
);

router.post(
  '/submissions/:submissionId/grade',
  validate({ params: submissionIdParamSchema, body: gradeSubmissionBodySchema }),
  ctrl.gradeSubmission,
);

export default router;
