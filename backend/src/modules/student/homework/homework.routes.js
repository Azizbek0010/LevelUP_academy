import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './homework.controller.js';
import {
  homeworkIdParamSchema,
  uploadUrlQuerySchema,
  submitHomeworkSchema,
} from './homework.schemas.js';

const router = Router();

// auth: authenticate + authorize('student') навешаны в student.routes.js
router.get('/', ctrl.listHomework);
router.get(
  '/:homeworkId/upload-url',
  validate({ params: homeworkIdParamSchema, query: uploadUrlQuerySchema }),
  ctrl.getUploadUrl,
);
router.post(
  '/:homeworkId/submit',
  validate({ params: homeworkIdParamSchema, body: submitHomeworkSchema }),
  ctrl.submit,
);

export default router;
