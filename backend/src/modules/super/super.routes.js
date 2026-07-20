import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  createBranchSchema,
  createAdminSchema,
  updateBranchSchema,
  updateAdminSchema,
  freezeSchema,
  idParam,
  createMethodistSchema,
  updateMethodistSchema,
  freezeMethodistSchema,
  updateOrganizationSchema,
  createAnnouncementSchema,
  statsQuery,
} from './super.schemas.js';
import * as ctrl from './super.controller.js';
import * as discipline from '../discipline/discipline.controller.js';
import {
  issuePenaltySchema,
  upsertCharterSchema,
  listPenaltiesQuery,
} from '../discipline/discipline.schemas.js';

const router = Router();

// вся панель — только Super Admin (владелец организации-партнёра); scope = своя org
router.use(authenticate, authorize('superadmin'));

/**
 * @openapi
 * /api/super/dashboard:
 *   get:
 *     tags: [Super Admin]
 *     summary: Organization dashboard (revenue, debt, students, per-branch breakdown)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totals:
 *                   type: object
 *                   properties:
 *                     branches: { type: integer }
 *                     activeStudents: { type: integer }
 *                     admins: { type: integer }
 *                     revenue: { type: number }
 *                     outstandingDebt: { type: number }
 *                     currency: { type: string, example: UZS }
 *                 branches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       isMain: { type: boolean }
 *                       isArchived: { type: boolean }
 *                       students: { type: integer }
 *                       admins: { type: integer }
 *                       revenue: { type: number }
 *                       debt: { type: number }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/dashboard', ctrl.dashboard);

/**
 * @openapi
 * /api/super/organization:
 *   get:
 *     tags: [Super Admin]
 *     summary: Organization profile (Settings page)
 *     description: >
 *       Returns the partner organization profile. `plan` is derived from the
 *       organization's tier (see `config/plans.js`), it is not stored per-row.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Organization profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Super Admin]
 *     summary: Update organization profile (name / domain / lesson duration)
 *     description: >
 *       Partial update — at least one field is required. `lessonDurationMin`
 *       applies to every group of the organization: group end time is computed
 *       from it on the backend (see POST/PATCH /api/admin/groups).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateOrganizationRequest' }
 *     responses:
 *       200:
 *         description: Updated organization profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/organization', ctrl.getOrganization);
router.patch('/organization', validate({ body: updateOrganizationSchema }), ctrl.updateOrganization);

/**
 * @openapi
 * /api/super/students:
 *   get:
 *     tags: [Super Admin]
 *     summary: List students across the whole organization (paginated)
 *     description: >
 *       Search matches first name, last name or phone (ILIKE). Scope is the
 *       caller's organization — students of every branch are included.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Substring match on first name / last name / phone
 *       - in: query
 *         name: frozen
 *         schema: { type: string, enum: ['true', 'false'] }
 *         description: Filter by frozen status; omit for all
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       firstName: { type: string }
 *                       lastName: { type: string }
 *                       phone: { type: string, nullable: true }
 *                       status: { type: string }
 *                       frozen: { type: boolean }
 *                       branchName: { type: string, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 pageCount: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/students', ctrl.listStudents);

/**
 * @openapi
 * /api/super/students/{id}:
 *   delete:
 *     tags: [Super Admin]
 *     summary: Soft-delete a student of the organization
 *     description: Sets `deleted_at`; the row is kept for finance history.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { id: { type: string, format: uuid } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/students/:id', validate({ params: idParam }), ctrl.deleteStudent);

/**
 * @openapi
 * /api/super/groups:
 *   get:
 *     tags: [Super Admin]
 *     summary: List groups across the whole organization
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Groups of every branch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       subject: { type: string, nullable: true }
 *                       monthlyPrice: { type: number }
 *                       schedule: { type: object, nullable: true }
 *                       lessonDays:
 *                         type: object
 *                         nullable: true
 *                         description: Alias of `schedule`, kept for the front-end
 *                       room: { type: string, nullable: true }
 *                       isArchived: { type: boolean }
 *                       branchName: { type: string, nullable: true }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/groups', ctrl.listGroups);

/**
 * @openapi
 * /api/super/groups/{id}/archive:
 *   post:
 *     tags: [Super Admin]
 *     summary: Archive a group (read-only, mutations return 403 afterwards)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Archived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     isArchived: { type: boolean, example: true }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/groups/:id/archive', validate({ params: idParam }), ctrl.archiveGroup);

/**
 * @openapi
 * /api/super/groups/{id}/unarchive:
 *   post:
 *     tags: [Super Admin]
 *     summary: Unarchive a group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unarchived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     isArchived: { type: boolean, example: false }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/groups/:id/unarchive', validate({ params: idParam }), ctrl.unarchiveGroup);

/**
 * @openapi
 * /api/super/groups/{id}:
 *   delete:
 *     tags: [Super Admin]
 *     summary: Soft-delete a group of the organization
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { id: { type: string, format: uuid } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/groups/:id', validate({ params: idParam }), ctrl.deleteGroup);

/**
 * @openapi
 * /api/super/attendance:
 *   get:
 *     tags: [Super Admin]
 *     summary: Attendance across the organization (optional group/date filter)
 *     description: >
 *       `records` and `lessons` are the same array (`lessons` is a front-end
 *       alias). `totals` counts each status over the returned records.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       groupId: { type: string, format: uuid }
 *                       groupName: { type: string }
 *                       studentId: { type: string, format: uuid }
 *                       firstName: { type: string }
 *                       lastName: { type: string }
 *                       date: { type: string, format: date }
 *                       status: { type: string, enum: [present, absent, late, excused] }
 *                 lessons:
 *                   type: array
 *                   description: Alias of `records`
 *                   items: { type: object }
 *                 totals:
 *                   type: object
 *                   properties:
 *                     present: { type: integer }
 *                     absent: { type: integer }
 *                     late: { type: integer }
 *                     excused: { type: integer }
 *                 total: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/attendance', ctrl.attendance);

/**
 * @openapi
 * /api/super/announcements:
 *   get:
 *     tags: [Super Admin]
 *     summary: "⚠️ STUB — always returns an empty list"
 *     description: >
 *       NOT IMPLEMENTED. There is no announcements table in the schema yet.
 *       The endpoint exists only so the Announcements page can render its
 *       EmptyState. Real implementation = migration + notificationQueue.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Always empty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 announcements: { type: array, items: { type: object }, example: [] }
 *                 items: { type: array, items: { type: object }, example: [] }
 *                 total: { type: integer, example: 0 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Super Admin]
 *     summary: "⚠️ NOT IMPLEMENTED — always 501"
 *     description: Needs an announcements table + migration. Do not wire the UI to this yet.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       501: { $ref: '#/components/responses/NotImplemented' }
 */
router.get('/announcements', ctrl.listAnnouncements);
router.post('/announcements', validate({ body: createAnnouncementSchema }), ctrl.createAnnouncement);

/**
 * @openapi
 * /api/super/announcements/{id}:
 *   delete:
 *     tags: [Super Admin]
 *     summary: "⚠️ NOT IMPLEMENTED — always 501"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       501: { $ref: '#/components/responses/NotImplemented' }
 */
router.delete('/announcements/:id', validate({ params: idParam }), ctrl.deleteAnnouncement);

/**
 * @openapi
 * /api/super/reminders:
 *   get:
 *     tags: [Super Admin]
 *     summary: "⚠️ STUB — always returns an empty list"
 *     description: NOT IMPLEMENTED. No reminders table yet; returns an empty list so the page renders.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Always empty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reminders: { type: array, items: { type: object }, example: [] }
 *                 items: { type: array, items: { type: object }, example: [] }
 *                 total: { type: integer, example: 0 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/reminders', ctrl.listReminders);

/**
 * @openapi
 * /api/super/reminders/{id}/resend:
 *   post:
 *     tags: [Super Admin]
 *     summary: "⚠️ NOT IMPLEMENTED — always 501"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       501: { $ref: '#/components/responses/NotImplemented' }
 */
router.post('/reminders/:id/resend', ctrl.notImplemented);

/**
 * @openapi
 * /api/super/reminders/{id}:
 *   delete:
 *     tags: [Super Admin]
 *     summary: "⚠️ NOT IMPLEMENTED — always 501"
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       501: { $ref: '#/components/responses/NotImplemented' }
 */
router.delete('/reminders/:id', ctrl.notImplemented);

/**
 * @openapi
 * /api/super/audit:
 *   get:
 *     tags: [Super Admin]
 *     summary: "⚠️ STUB — always returns an empty list"
 *     description: NOT IMPLEMENTED. No audit-log table yet; returns an empty list so the page renders.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Always empty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items: { type: array, items: { type: object }, example: [] }
 *                 total: { type: integer, example: 0 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/audit', ctrl.listAudit);

/**
 * @openapi
 * /api/super/stats:
 *   get:
 *     tags: [Super Admin]
 *     summary: Organization statistics — KPIs, revenue series, per-branch and per-method breakdown
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: period
 *         in: query
 *         schema: { type: string, enum: ['7d', '30d', '90d'], default: '30d' }
 *     responses:
 *       200:
 *         description: Stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period: { type: string }
 *                 totals:
 *                   type: object
 *                   properties:
 *                     revenue: { type: number }
 *                     outstandingDebt: { type: number }
 *                     activeStudents: { type: integer }
 *                     admins: { type: integer }
 *                     branches: { type: integer }
 *                     avgRevenue: { type: number }
 *                     debtRatio: { type: number }
 *                     currency: { type: string }
 *                 branches: { type: array, items: { type: object } }
 *                 revenueSeries: { type: array, items: { type: object } }
 *                 paymentMethods: { type: array, items: { type: object } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/stats', validate({ query: statsQuery }), ctrl.stats);

/**
 * @openapi
 * /api/super/reports:
 *   get:
 *     tags: [Super Admin]
 *     summary: Organization report — real per-branch revenue, debt, students, admins, revenue share
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totals: { type: object }
 *                 branches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, format: uuid }
 *                       name: { type: string }
 *                       students: { type: integer }
 *                       admins: { type: integer }
 *                       revenue: { type: number }
 *                       debt: { type: number }
 *                       share: { type: number }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/reports', ctrl.reports);

/**
 * @openapi
 * /api/super/branches:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create a branch in the organization
 *     description: The organization's first branch is automatically flagged `isMain`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateBranchRequest' }
 *     responses:
 *       201:
 *         description: Branch created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { branch: { $ref: '#/components/schemas/Branch' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Super Admin]
 *     summary: List branches of the organization (with admin/student counts)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of branches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branches:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/Branch' }
 *                       - type: object
 *                         properties:
 *                           admins: { type: integer }
 *                           students: { type: integer }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/branches', validate({ body: createBranchSchema }), ctrl.createBranch);
router.get('/branches', ctrl.listBranches);

/**
 * @openapi
 * /api/super/branches/{id}:
 *   get:
 *     tags: [Super Admin]
 *     summary: Branch detail — branch info + its admins + its groups
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Branch detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branch:
 *                   allOf:
 *                     - { $ref: '#/components/schemas/Branch' }
 *                     - type: object
 *                       properties:
 *                         admins:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               firstName: { type: string }
 *                               lastName: { type: string }
 *                               email: { type: string, format: email }
 *                               status: { type: string }
 *                         groups:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               name: { type: string }
 *                               subject: { type: string }
 *                               monthlyPrice: { type: number }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   patch:
 *     tags: [Super Admin]
 *     summary: Update branch fields (partial — at least one field required)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateBranchRequest' }
 *     responses:
 *       200:
 *         description: Updated branch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { branch: { $ref: '#/components/schemas/Branch' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/branches/:id', validate({ params: idParam }), ctrl.branchDetail);
router.patch('/branches/:id', validate({ params: idParam, body: updateBranchSchema }), ctrl.updateBranch);

/**
 * @openapi
 * /api/super/branches/{id}/archive:
 *   post:
 *     tags: [Super Admin]
 *     summary: Archive a branch (read-only afterwards)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Branch archived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { branch: { $ref: '#/components/schemas/Branch' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/branches/:id/archive', validate({ params: idParam }), ctrl.archiveBranch);

/**
 * @openapi
 * /api/super/branches/{id}/unarchive:
 *   post:
 *     tags: [Super Admin]
 *     summary: Unarchive a branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Branch unarchived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { branch: { $ref: '#/components/schemas/Branch' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/branches/:id/unarchive', validate({ params: idParam }), ctrl.unarchiveBranch);

/**
 * @openapi
 * /api/super/admins:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create an admin assigned to one of the organization's branches
 *     description: Login (email) and password are set directly by the Super Admin (not auto-generated).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateAdminRequest' }
 *     responses:
 *       201:
 *         description: Admin created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { admin: { $ref: '#/components/schemas/AdminSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Super Admin]
 *     summary: List admins of the organization
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of admins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admins:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/AdminSummary' }
 *                       - type: object
 *                         properties:
 *                           branchName: { type: string }
 *                           createdAt: { type: string, format: date-time }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/admins', validate({ body: createAdminSchema }), ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);

/**
 * @openapi
 * /api/super/admins/{id}:
 *   patch:
 *     tags: [Super Admin]
 *     summary: Update an admin (partial — at least one field; can reassign branch)
 *     description: If `branchId` is changed, the new branch must belong to the same organization.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateAdminRequest' }
 *     responses:
 *       200:
 *         description: Updated admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { admin: { $ref: '#/components/schemas/AdminSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Admin or target branch not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/admins/:id', validate({ params: idParam, body: updateAdminSchema }), ctrl.updateAdmin);

/**
 * @openapi
 * /api/super/admins/{id}/freeze:
 *   patch:
 *     tags: [Super Admin]
 *     summary: Freeze or unfreeze an admin account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [frozen]
 *             properties: { frozen: { type: boolean } }
 *     responses:
 *       200:
 *         description: Updated admin status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { admin: { $ref: '#/components/schemas/AdminSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Admin not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/admins/:id/freeze', validate({ params: idParam, body: freezeSchema }), ctrl.freezeAdmin);

/**
 * @openapi
 * /api/super/methodists:
 *   post:
 *     tags: [Super Admin]
 *     summary: Create a methodist (organization-level, not tied to a branch)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateMethodistRequest' }
 *     responses:
 *       201:
 *         description: Methodist created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { methodist: { $ref: '#/components/schemas/MethodistSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Super Admin]
 *     summary: List methodists of the organization
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of methodists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 methodists:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/MethodistSummary' }
 *                       - type: object
 *                         properties: { createdAt: { type: string, format: date-time } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/methodists', validate({ body: createMethodistSchema }), ctrl.createMethodist);
router.get('/methodists', ctrl.listMethodists);

/**
 * @openapi
 * /api/super/methodists/{id}:
 *   patch:
 *     tags: [Super Admin]
 *     summary: Update a methodist (partial — at least one field)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateMethodistRequest' }
 *     responses:
 *       200:
 *         description: Updated methodist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { methodist: { $ref: '#/components/schemas/MethodistSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Methodist not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/methodists/:id', validate({ params: idParam, body: updateMethodistSchema }), ctrl.updateMethodist);

/**
 * @openapi
 * /api/super/methodists/{id}/freeze:
 *   patch:
 *     tags: [Super Admin]
 *     summary: Freeze or unfreeze a methodist account
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [frozen]
 *             properties: { frozen: { type: boolean } }
 *     responses:
 *       200:
 *         description: Updated methodist status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { methodist: { $ref: '#/components/schemas/MethodistSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Methodist not found in your organization
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/methodists/:id/freeze', validate({ params: idParam, body: freezeMethodistSchema }), ctrl.freezeMethodist);

// ==================== ДИСЦИПЛИНА (устав + штрафы/qora) ====================

/**
 * @openapi
 * /api/super/charter:
 *   get:
 *     tags: [Discipline]
 *     summary: Get organization charter (устав)
 *     description: Если устав ещё не создан — возвращается пустой шаблон.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Charter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Charter' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   put:
 *     tags: [Discipline]
 *     summary: Create/update organization charter (Super Admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpsertCharterRequest' }
 *     responses:
 *       200:
 *         description: Saved charter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Charter' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/charter', discipline.getCharter);
router.put('/charter', validate({ body: upsertCharterSchema }), discipline.upsertCharter);

/**
 * @openapi
 * /api/super/penalties:
 *   get:
 *     tags: [Discipline]
 *     summary: List penalties in the organization
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: targetUserId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [shtraf, qora] }
 *     responses:
 *       200:
 *         description: Penalty list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Penalty' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *   post:
 *     tags: [Discipline]
 *     summary: Issue a penalty (shtraf) or fire (qora) a staff member
 *     description: >
 *       Super Admin → admin / mentor / methodist (и shtraf, и qora).
 *       qora ставит целевому status=fired (атомарно).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/IssuePenaltyRequest' }
 *     responses:
 *       201:
 *         description: Penalty created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/IssuePenaltyResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/penalties', validate({ query: listPenaltiesQuery }), discipline.listPenalties);
router.post('/penalties', validate({ body: issuePenaltySchema }), discipline.issuePenalty);

/**
 * @openapi
 * /api/super/staff/{id}/reactivate:
 *   post:
 *     tags: [Discipline]
 *     summary: Reactivate a fired staff member (qora → active)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Reactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     status: { type: string, example: active }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/staff/:id/reactivate', validate({ params: idParam }), discipline.reactivateStaff);

export default router;
