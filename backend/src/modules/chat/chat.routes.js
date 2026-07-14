import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requireRoomAccess } from '../../middlewares/roomAccess.js';
import * as ctrl from './chat.controller.js';

const router = Router();

/**
 * @openapi
 * /api/chat/{roomKey}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Cursor-paginated message history for a chat room
 *     description: >
 *       Room access rules (`requireRoomAccess`): `global` — everyone except
 *       students; `parent:<uuid>` — that parent themself or any staff role;
 *       `group:<uuid>` — main_admin/superadmin/admin unconditionally, or the
 *       group's own mentor/enrolled students. `limit` is clamped server-side to
 *       [1, 100] (non-numeric defaults to 50); `cursor` must be a valid ISO
 *       timestamp (checked before hitting the DB — otherwise Postgres would 500
 *       on a bad `::timestamptz` cast). This is REST read-only history; sending
 *       messages happens over the Socket.io chat namespace, not via this REST API.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: roomKey
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         examples:
 *           global: { value: 'global' }
 *           parent: { value: 'parent:3fa85f64-5717-4562-b3fc-2c963f66afa6' }
 *           group: { value: 'group:3fa85f64-5717-4562-b3fc-2c963f66afa6' }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - name: cursor
 *         in: query
 *         description: ISO timestamp — returns messages older than this
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Message history (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ChatMessage' }
 *                     nextCursor: { type: string, format: date-time, nullable: true }
 *       400:
 *         description: cursor must be a valid ISO timestamp, or invalid/unknown room key
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: No access to this room
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:roomKey/messages', authenticate, requireRoomAccess, ctrl.getMessages);

export default router;
