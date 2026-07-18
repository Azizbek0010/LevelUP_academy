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

/**
 * @openapi
 * /api/chat/contacts:
 *   get:
 *     tags: [Chat]
 *     summary: Parents this staff member may privately message
 *     description: >
 *       Contact list for private `dm:<staffId>:<parentId>` conversations, with
 *       the last message and unread count per room. Scope mirrors the send-time
 *       check exactly: a mentor sees parents whose child is in one of their own
 *       groups, an admin — parents of their branch, a superadmin — parents of
 *       their organization. Other roles get an empty list. Staff never see each
 *       other's conversations, so this list is per-user by construction.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Contact list (most recent conversation first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ChatContact' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/contacts', authenticate, ctrl.getContacts);

/**
 * @openapi
 * /api/chat/{roomKey}/read:
 *   post:
 *     tags: [Chat]
 *     summary: Mark incoming messages of a room as read
 *     description: >
 *       Marks every message in the room not sent by the caller as read. Room
 *       access is enforced by the same `requireRoomAccess` rules as history.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: roomKey
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Number of messages marked read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 3 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: No access to this room
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/:roomKey/read', authenticate, requireRoomAccess, ctrl.markRead);

export default router;
