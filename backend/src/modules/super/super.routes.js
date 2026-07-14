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
} from './super.schemas.js';
import * as ctrl from './super.controller.js';

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

// --- организация (профиль партнёра, Settings) ---
router.get('/organization', ctrl.getOrganization);
router.patch('/organization', validate({ body: updateOrganizationSchema }), ctrl.updateOrganization);

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

export default router;
