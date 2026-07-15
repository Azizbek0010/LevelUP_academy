import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  idParam,
  groupStudentParams,
  createExpenseSchema,
  listExpensesQuery,
  createStudentSchema,
  updateStudentSchema,
  freezeStudentSchema,
  listStudentsQuery,
  createMentorSchema,
  freezeMentorSchema,
  updateMentorSchema,
  createGroupSchema,
  updateGroupSchema,
  addGroupStudentSchema,
  listGroupsQuery,
  createAnnouncementSchema,
} from './admin.schemas.js';
import * as ctrl from './admin.controller.js';
import paymentsRoutes from './payments/payments.routes.js';
import reportsRoutes from './reports/reports.routes.js';

/**
 * K-ADMIN — панель филиала. Только Admin; scope жёстко = свой branch_id.
 * Управление: дашборд, расходы, студенты (add-student с генерацией логин-кода),
 * группы, платежи (/payments), отчёты (/reports).
 */
const router = Router();

router.use(authenticate, authorize('admin'));

router.use('/payments', paymentsRoutes);
router.use('/reports', reportsRoutes);

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Branch dashboard — revenue, expenses, profit, debt, student/group counts
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
 *                     revenue: { type: number }
 *                     expenses: { type: number }
 *                     profit: { type: number }
 *                     outstandingDebt: { type: number }
 *                     activeStudents: { type: integer }
 *                     groups: { type: integer }
 *                     overdueInvoices: { type: integer }
 *                     currency: { type: string, example: UZS }
 *                 thisMonth:
 *                   type: object
 *                   properties:
 *                     revenue: { type: number }
 *                     expenses: { type: number }
 *                     profit: { type: number }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/dashboard', ctrl.dashboard);
router.get('/settings', ctrl.settings);

/**
 * @openapi
 * /api/admin/expenses:
 *   post:
 *     tags: [Admin]
 *     summary: Record a branch expense
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateExpenseRequest' }
 *     responses:
 *       201:
 *         description: Expense created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { expense: { $ref: '#/components/schemas/Expense' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Admin]
 *     summary: List branch expenses (paginated, optional date range)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/PageParam' }
 *       - { $ref: '#/components/parameters/LimitParam' }
 *       - name: from
 *         in: query
 *         schema: { type: string, format: date-time }
 *       - name: to
 *         in: query
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Paginated list of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expenses:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/Expense' }
 *                       - type: object
 *                         properties: { createdBy: { type: string } }
 *                 meta: { $ref: '#/components/schemas/PageMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/expenses', validate({ body: createExpenseSchema }), ctrl.createExpense);
router.get('/expenses', validate({ query: listExpensesQuery }), ctrl.listExpenses);

/**
 * @openapi
 * /api/admin/expenses/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete a branch expense
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       204: { description: Expense deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.delete('/expenses/:id', validate({ params: idParam }), ctrl.deleteExpense);

/**
 * @openapi
 * /api/admin/students:
 *   post:
 *     tags: [Admin]
 *     summary: Create a student (and optionally their parent), auto-generating login codes/passwords
 *     description: >
 *       Login code (8 chars) and password (6 digits) are generated server-side for
 *       both the student and, if `parent` is supplied, the parent — returned once
 *       in this response only (must be relayed out-of-band; code-role accounts have
 *       no forgot-password). If `groupId` is given, the group must belong to the
 *       admin's branch and must not be archived (409 if archived).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateStudentRequest' }
 *     responses:
 *       201:
 *         description: Student (and optional parent) created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     loginCode: { type: string }
 *                     password: { type: string }
 *                 parent:
 *                   nullable: true
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     loginCode: { type: string }
 *                     password: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Group is archived, phone already in use, or login-code collision retries exhausted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Admin]
 *     summary: List students of the branch (paginated, search, filter by group)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/PageParam' }
 *       - { $ref: '#/components/parameters/LimitParam' }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *       - name: groupId
 *         in: query
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/StudentListItem' }
 *                 meta: { $ref: '#/components/schemas/PageMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/students', validate({ body: createStudentSchema }), ctrl.createStudent);
router.get('/students', validate({ query: listStudentsQuery }), ctrl.listStudents);

/**
 * @openapi
 * /api/admin/students/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Student detail (profile + debt + coin balance + groups)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Student detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { student: { $ref: '#/components/schemas/StudentDetail' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   patch:
 *     tags: [Admin]
 *     summary: Update a student's profile fields (partial — at least one field)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateStudentRequest' }
 *     responses:
 *       200:
 *         description: Updated student
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     phone: { type: string }
 *                     status: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Phone already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/students/:id', validate({ params: idParam }), ctrl.studentDetail);
router.patch('/students/:id', validate({ params: idParam, body: updateStudentSchema }), ctrl.updateStudent);

/**
 * @openapi
 * /api/admin/students/{id}/freeze:
 *   post:
 *     tags: [Admin]
 *     summary: Freeze or unfreeze a student account
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
 *             properties:
 *               frozen: { type: boolean }
 *               reason: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Updated status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     status: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/students/:id/freeze', validate({ params: idParam, body: freezeStudentSchema }), ctrl.freezeStudent);

/**
 * @openapi
 * /api/admin/students/{id}/regenerate-password:
 *   post:
 *     tags: [Admin]
 *     summary: Regenerate a student's numeric password (code-role accounts have no forgot-password flow)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: New password (shown once)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string, format: uuid }
 *                 password: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/students/:id/regenerate-password', validate({ params: idParam }), ctrl.regenerateStudentPassword);

/**
 * @openapi
 * /api/admin/students/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete a student and remove them from all groups
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       204: { description: Student deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.delete('/students/:id', validate({ params: idParam }), ctrl.deleteStudent);

/**
 * @openapi
 * /api/admin/mentors:
 *   post:
 *     tags: [Admin]
 *     summary: Create a mentor in the admin's branch (login by email)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateMentorRequest' }
 *     responses:
 *       201:
 *         description: Mentor created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { mentor: { $ref: '#/components/schemas/MentorSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: Email or phone already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Admin]
 *     summary: List mentors of the branch
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of mentors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mentors:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/MentorSummary' }
 *                       - type: object
 *                         properties:
 *                           groups: { type: integer }
 *                           createdAt: { type: string, format: date-time }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/mentors', validate({ body: createMentorSchema }), ctrl.createMentor);
router.get('/mentors', ctrl.listMentors);

/**
 * @openapi
 * /api/admin/mentors/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update a mentor (partial — at least one field)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateMentorRequest' }
 *     responses:
 *       200:
 *         description: Updated mentor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { mentor: { $ref: '#/components/schemas/MentorSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Mentor not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Phone already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/mentors/:id', validate({ params: idParam, body: updateMentorSchema }), ctrl.updateMentor);

/**
 * @openapi
 * /api/admin/mentors/{id}/freeze:
 *   post:
 *     tags: [Admin]
 *     summary: Freeze or unfreeze a mentor account
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
 *         description: Updated mentor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { mentor: { $ref: '#/components/schemas/MentorSummary' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Mentor not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/mentors/:id/freeze', validate({ params: idParam, body: freezeMentorSchema }), ctrl.freezeMentor);

/**
 * @openapi
 * /api/admin/mentors/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Soft-delete a mentor
 *     description: >
 *       Blocked with 409 if the mentor still leads active (non-archived) groups —
 *       reassign or archive those groups first.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       204: { description: Mentor deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Mentor not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Mentor still leads active groups
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.delete('/mentors/:id', validate({ params: idParam }), ctrl.deleteMentor);

/**
 * @openapi
 * /api/admin/groups:
 *   post:
 *     tags: [Admin]
 *     summary: Create a group in the branch, assigned to a mentor
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateGroupRequest' }
 *     responses:
 *       201:
 *         description: Group created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { group: { $ref: '#/components/schemas/Group' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Mentor not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   get:
 *     tags: [Admin]
 *     summary: List groups of the branch (paginated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/PageParam' }
 *       - { $ref: '#/components/parameters/LimitParam' }
 *     responses:
 *       200:
 *         description: Paginated list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groups:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - { $ref: '#/components/schemas/Group' }
 *                       - type: object
 *                         properties:
 *                           students: { type: integer }
 *                           mentor:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               name: { type: string }
 *                 meta: { $ref: '#/components/schemas/PageMeta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post('/groups', validate({ body: createGroupSchema }), ctrl.createGroup);
router.get('/groups', validate({ query: listGroupsQuery }), ctrl.listGroups);

/**
 * @openapi
 * /api/admin/groups/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Group detail — group info + mentor + member students
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Group detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   allOf:
 *                     - { $ref: '#/components/schemas/Group' }
 *                     - type: object
 *                       properties:
 *                         mentor:
 *                           type: object
 *                           properties:
 *                             id: { type: string, format: uuid }
 *                             name: { type: string }
 *                         students:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id: { type: string, format: uuid }
 *                               firstName: { type: string }
 *                               lastName: { type: string }
 *                               phone: { type: string }
 *                               status: { type: string }
 *                               totalDebt: { type: number }
 *                               coinBalance: { type: integer }
 *                               joinedAt: { type: string, format: date-time }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 *   patch:
 *     tags: [Admin]
 *     summary: Update a group (partial — at least one field; can reassign mentor)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateGroupRequest' }
 *     responses:
 *       200:
 *         description: Updated group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { group: { $ref: '#/components/schemas/Group' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group or mentor not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/groups/:id', validate({ params: idParam }), ctrl.groupDetail);
router.patch('/groups/:id', validate({ params: idParam, body: updateGroupSchema }), ctrl.updateGroup);

/**
 * @openapi
 * /api/admin/groups/{id}/archive:
 *   post:
 *     tags: [Admin]
 *     summary: Archive a group (read-only afterwards)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Group archived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { group: { $ref: '#/components/schemas/Group' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/groups/:id/archive', validate({ params: idParam }), ctrl.archiveGroup);

/**
 * @openapi
 * /api/admin/groups/{id}/unarchive:
 *   post:
 *     tags: [Admin]
 *     summary: Unarchive a group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     responses:
 *       200:
 *         description: Group unarchived
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { group: { $ref: '#/components/schemas/Group' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/groups/:id/unarchive', validate({ params: idParam }), ctrl.unarchiveGroup);

/**
 * @openapi
 * /api/admin/groups/{id}/students:
 *   post:
 *     tags: [Admin]
 *     summary: Add a student to a group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties: { studentId: { type: string, format: uuid } }
 *     responses:
 *       201:
 *         description: Student added to group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId: { type: string, format: uuid }
 *                 studentId: { type: string, format: uuid }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group or student not found in your branch
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Group is archived
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/groups/:id/students', validate({ params: idParam, body: addGroupStudentSchema }), ctrl.addGroupStudent);

/**
 * @openapi
 * /api/admin/groups/{id}/students/{studentId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Remove a student from a group
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *       - name: studentId
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Student removed from group }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Group not found in your branch, or student is not an active member
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.delete('/groups/:id/students/:studentId', validate({ params: groupStudentParams }), ctrl.removeGroupStudent);

// объявления (для Telegram-бота — рассылка родителям/студентам филиала или группы)
router.post('/announcements', validate({ body: createAnnouncementSchema }), ctrl.createAnnouncement);

export default router;
