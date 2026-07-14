import { Router } from 'express';
import * as ctrl from './home.controller.js';

const router = Router();

/**
 * @openapi
 * /api/student/home:
 *   get:
 *     tags: [Student]
 *     summary: Student dashboard — coin balance, debt, weekly rank, groups, upcoming homework
 *     description: >
 *       Blocked with 402 (via `blockIfOverdue`) if the student has an unpaid
 *       overdue invoice. `upcomingHomework` is the top 5 non-graded assignments
 *       sorted by nearest deadline (deadlines already in the future).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     coins: { type: integer }
 *                     totalDebt: { type: number }
 *                     rank:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         rank: { type: integer, nullable: true }
 *                         coins: { type: integer }
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, format: uuid }
 *                           name: { type: string }
 *                           subject: { type: string }
 *                           mentorName: { type: string }
 *                     upcomingHomework:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Homework' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       402:
 *         description: Payment overdue — access is blocked until paid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', ctrl.getDashboard);

export default router;
