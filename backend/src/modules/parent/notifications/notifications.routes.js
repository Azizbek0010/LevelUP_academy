import { Router } from 'express';
import * as ctrl from './notifications.controller.js';

const router = Router();

/**
 * @openapi
 * /api/parent/notifications:
 *   get:
 *     tags: [Parent]
 *     summary: Notification feed (grades, attendance, payments) across all of the parent's children
 *     description: >
 *       No dedicated notifications table — the feed is synthesized on read from
 *       existing data (graded homework/tests, absences/lateness, received payments,
 *       overdue invoices), scoped to this parent's children and sorted by date desc
 *       (top 30). `read` is always `false` — the frontend does not yet call a
 *       mark-as-read mutation.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification feed
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
 *                       id: { type: string }
 *                       type: { type: string, enum: [grade, attendance, payment] }
 *                       title: { type: string }
 *                       body: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *                       read: { type: boolean, example: false }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/notifications', ctrl.list);

export default router;
