import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { grantCoinsSchema, studentParam, historyQuery } from './coins.schemas.js';
import * as ctrl from './coins.controller.js';

/**
 * Mentor/Admin — ручное начисление коинов. Смонтирован под /api/mentor/coins;
 * authenticate + authorize('mentor','admin') навешаны в mentor.routes.js.
 */
const router = Router();

/**
 * @openapi
 * /api/mentor/coins:
 *   post:
 *     tags: [Mentor Coins]
 *     summary: Manually grant (positive amount) or deduct (negative amount) coins from a student
 *     description: >
 *       Ownership check: a mentor may only act on students enrolled in one of
 *       their own groups; an admin may only act on students in their own branch.
 *       A student outside that scope returns 404 (existence not disclosed).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/GrantCoinsRequest' }
 *     responses:
 *       201:
 *         description: Coins granted/deducted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balanceAfter: { type: integer }
 *                     entry: { $ref: '#/components/schemas/CoinHistoryEntry' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404:
 *         description: Student not found (includes students outside actor's scope)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/', validate({ body: grantCoinsSchema }), ctrl.grantCoins);

/**
 * @openapi
 * /api/mentor/coins/students/{studentId}:
 *   get:
 *     tags: [Mentor Coins]
 *     summary: Paginated coin history of a student (within actor's scope)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: studentId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - { $ref: '#/components/parameters/PageParam' }
 *       - { $ref: '#/components/parameters/LimitParam' }
 *     responses:
 *       200:
 *         description: Coin history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/CoinHistoryEntry' }
 *                     meta: { $ref: '#/components/schemas/PageMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404:
 *         description: Student not found (includes students outside actor's scope)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get(
  '/students/:studentId',
  validate({ params: studentParam, query: historyQuery }),
  ctrl.studentHistory,
);

export default router;
