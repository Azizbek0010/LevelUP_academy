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

/**
 * @openapi
 * /api/mentor/groups:
 *   get:
 *     tags: [Mentor Groups]
 *     summary: List the mentor's own groups (dashboard + selectors for attendance/homework/tests/coins)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Group' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/', ctrl.myGroups);

/**
 * @openapi
 * /api/mentor/groups/{groupId}/students:
 *   get:
 *     tags: [Mentor Groups]
 *     summary: Roster of a group's students (own group only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: groupId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Group roster
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       firstName: { type: string }
 *                       lastName: { type: string }
 *                       status: { type: string }
 *                       coinBalance: { type: integer }
 *                       joinedAt: { type: string, format: date-time }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404:
 *         description: Group not found (includes groups belonging to another mentor)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/:groupId/students', validate({ params: groupParam }), ctrl.groupRoster);

export default router;
