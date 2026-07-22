import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { createBindToken } from './telegram.controller.js';

const router = Router();

/**
 * @openapi
 * /api/telegram/bind-token:
 *   post:
 *     tags: [Telegram]
 *     summary: Issue a one-time token to link the caller's account to the Telegram bot
 *     description: >
 *       Student and parent accounts only — any other role gets 403. Returns a short-lived
 *       token (kept in Redis, single-use) plus a ready deep link; opening the link starts
 *       the bot with the token, which the bot then consumes to bind the chat to the user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string }
 *                     expiresIn: { type: integer, description: TTL in seconds }
 *                     deepLink:
 *                       type: string
 *                       example: https://t.me/levelup_bot?start=abc123
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Caller is not a student or parent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/bind-token', authenticate, createBindToken);

export default router;
