import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  onboardPartnerSchema,
  updatePricingSchema,
  leadListQuery,
  leadUpdateSchema,
  partnerStatusSchema,
  idParam,
} from './main.schemas.js';
import * as ctrl from './main.controller.js';

const router = Router();

// вся панель — только Main Admin (владелец платформы)
router.use(authenticate, authorize('main_admin'));

/**
 * @openapi
 * /api/main/partners:
 *   post:
 *     tags: [Main Admin]
 *     summary: Onboard a new partner (organization + its Super Admin)
 *     description: >
 *       Creates the organization and its Super Admin user in one transaction, sets
 *       the org owner, and (if `leadId` given) marks that lead as onboarded and links
 *       it to the new organization. Returns a one-time temp password for the new
 *       Super Admin (must be relayed to the partner out-of-band; they reset it via
 *       forgot-password afterwards).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OnboardPartnerRequest' }
 *     responses:
 *       201:
 *         description: Partner onboarded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     plan: { type: string, nullable: true }
 *                     domain: { type: string, nullable: true }
 *                     status: { type: string }
 *                     created_at: { type: string, format: date-time }
 *                 superadmin:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     email: { type: string, format: email }
 *                 tempPassword:
 *                   type: string
 *                   description: One-time temp password, shown only in this response
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409:
 *         description: Domain already taken, or email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.post('/partners', validate({ body: onboardPartnerSchema }), ctrl.onboardPartner);

/**
 * @openapi
 * /api/main/partners:
 *   get:
 *     tags: [Main Admin]
 *     summary: List all partner organizations with computed billing
 *     description: >
 *       For each org, computes `branches`, `students` counts and `monthlyBill`
 *       (via computeBill against current platform pricing).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of partners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partners:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PartnerSummary' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/partners', ctrl.listPartners);

/**
 * @openapi
 * /api/main/partners/{id}/status:
 *   patch:
 *     tags: [Main Admin]
 *     summary: Activate or freeze a partner organization
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [active, frozen] }
 *     responses:
 *       200:
 *         description: Partner status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partner:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     status: { type: string }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Partner not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch(
  '/partners/:id/status',
  validate({ params: idParam, body: partnerStatusSchema }),
  ctrl.setPartnerStatus,
);

/**
 * @openapi
 * /api/main/dashboard:
 *   get:
 *     tags: [Main Admin]
 *     summary: Platform-wide dashboard (aggregated totals across all partners)
 *     description: Our platform revenue = sum of each partner's computed monthly bill.
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
 *                     partners: { type: integer }
 *                     students: { type: integer }
 *                     branches: { type: integer }
 *                     ourMonthlyIncome: { type: number }
 *                     currency: { type: string, example: UZS }
 *                 pricing: { $ref: '#/components/schemas/PlatformPricing' }
 *                 partners:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PartnerSummary' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/dashboard', ctrl.dashboard);

/**
 * @openapi
 * /api/main/revenue:
 *   get:
 *     tags: [Main Admin]
 *     summary: Platform revenue detail — our income (sum of partner bills) + per-partner billing
 *     description: >
 *       Our monthly income = sum of each partner's computed bill (by student count).
 *       Read-only over money tables — writes nothing.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Revenue detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totals:
 *                   type: object
 *                   properties:
 *                     partners: { type: integer }
 *                     activePartners: { type: integer }
 *                     students: { type: integer }
 *                     branches: { type: integer }
 *                     ourMonthlyIncome: { type: number }
 *                     partnersRevenue: { type: number }
 *                     partnersExpenses: { type: number }
 *                     partnersProfit: { type: number }
 *                     currency: { type: string, example: UZS }
 *                 partners:
 *                   type: array
 *                   items: { type: object }
 *                 pricing: { $ref: '#/components/schemas/PlatformPricing' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/revenue', ctrl.revenue);

/**
 * @openapi
 * /api/main/pricing:
 *   get:
 *     tags: [Main Admin]
 *     summary: Get current platform pricing (per-partner billing formula, in UZS)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pricing: { $ref: '#/components/schemas/PlatformPricing' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/pricing', ctrl.getPricing);

/**
 * @openapi
 * /api/main/pricing:
 *   put:
 *     tags: [Main Admin]
 *     summary: Update platform pricing (partial — at least one field required)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdatePricingRequest' }
 *     responses:
 *       200:
 *         description: Updated pricing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pricing: { $ref: '#/components/schemas/PlatformPricing' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.put('/pricing', validate({ body: updatePricingSchema }), ctrl.updatePricing);

/**
 * @openapi
 * /api/main/leads:
 *   get:
 *     tags: [Main Admin]
 *     summary: List landing-page leads, optionally filtered by status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [new, contacted, onboarded, rejected] }
 *     responses:
 *       200:
 *         description: List of leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Lead' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/leads', validate({ query: leadListQuery }), ctrl.listLeads);

/**
 * @openapi
 * /api/main/leads/{id}:
 *   patch:
 *     tags: [Main Admin]
 *     summary: Update a lead's status and/or notes (partial — at least one field)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { $ref: '#/components/parameters/IdParam' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LeadUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated lead
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lead: { $ref: '#/components/schemas/Lead' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: Lead not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       422: { $ref: '#/components/responses/ValidationError' }
 */
router.patch('/leads/:id', validate({ params: idParam, body: leadUpdateSchema }), ctrl.updateLead);

export default router;
