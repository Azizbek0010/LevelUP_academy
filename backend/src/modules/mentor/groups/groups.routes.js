import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { z } from 'zod';
import * as ctrl from './groups.controller.js';

/**
 * Mentor — read-only обзор своих групп и их состава. Смонтирован под
 * /api/mentor/groups; authenticate + authorize навешаны в mentor.routes.js.
 * CRUD групп — зона Admin (/api/admin/groups).
 */
const router = Router();

const groupParam = z.object({ groupId: z.string().uuid('Invalid groupId') });

router.get('/', ctrl.myGroups);
router.get('/:groupId/students', validate({ params: groupParam }), ctrl.groupRoster);

export default router;
