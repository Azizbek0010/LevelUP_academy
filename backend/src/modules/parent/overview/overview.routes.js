import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './overview.controller.js';
import { childIdParamSchema } from './overview.schemas.js';

const router = Router();

/**
 * @openapi
 * /api/parent/children:
 *   get:
 *     tags: [Parent]
 *     summary: List the current parent's children (short cards for a picker screen)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of children
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ChildCard' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/children', ctrl.listChildren);

/**
 * @openapi
 * /api/parent/children/{childId}/overview:
 *   get:
 *     tags: [Parent]
 *     summary: Full overview of one child (coins, debt, rank, groups, attendance, grades)
 *     description: >
 *       The child must be linked to this parent (`student_profiles.parent_id`) —
 *       a child belonging to another parent returns 403, not 404 (existence is
 *       not disclosed either way; the service treats "not found" as "not yours").
 *       Attendance summary/recent cover the last 30 days; grades show the last 5
 *       graded homework and the last 5 completed tests.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: childId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Child overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/ChildOverview' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Child does not belong to this parent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/children/:childId/overview',
  validate({ params: childIdParamSchema }),
  ctrl.getChildOverview,
);

export default router;
