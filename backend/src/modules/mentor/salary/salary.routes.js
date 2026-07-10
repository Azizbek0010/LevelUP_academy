import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './salary.controller.js';
import {
  mentorIdParamSchema,
  salaryIdParamSchema,
  yearQuerySchema,
  monthQuerySchema,
  upsertSalaryBodySchema,
  updateStatusBodySchema,
} from './salary.schemas.js';

const router = Router();

// auth: authenticate + authorize('mentor','admin') навешаны в mentor.routes.js.
// Роль/владение дополнительно проверяются в salary.service.js:
//   mentor видит только свою запись; create/approve — только role === 'admin'.
router.get(
  '/mentors/:mentorId/suggestion',
  validate({ params: mentorIdParamSchema, query: monthQuerySchema }),
  ctrl.getSalarySuggestion,
);

router.get(
  '/mentors/:mentorId',
  validate({ params: mentorIdParamSchema, query: yearQuerySchema }),
  ctrl.getMentorSalaries,
);

router.post('/', validate({ body: upsertSalaryBodySchema }), ctrl.upsertSalary);

router.patch(
  '/:id/status',
  validate({ params: salaryIdParamSchema, body: updateStatusBodySchema }),
  ctrl.updateStatus,
);

export default router;
