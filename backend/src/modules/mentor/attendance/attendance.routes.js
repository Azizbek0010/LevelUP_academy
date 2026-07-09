import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { archiveGuard } from '../../../middlewares/archiveGuard.js';
import * as ctrl from './attendance.controller.js';
import {
  groupIdParamSchema,
  markAttendanceBodySchema,
  listAttendanceQuerySchema,
} from './attendance.schemas.js';

const router = Router();

// auth: authenticate + authorize('mentor','admin') навешаны в mentor.routes.js
router.post(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema, body: markAttendanceBodySchema }),
  archiveGuard('groups', 'groupId'),
  ctrl.markAttendance,
);

router.get(
  '/groups/:groupId',
  validate({ params: groupIdParamSchema, query: listAttendanceQuerySchema }),
  ctrl.getGroupAttendance,
);

export default router;
