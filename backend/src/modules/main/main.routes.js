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

router.post('/partners', validate({ body: onboardPartnerSchema }), ctrl.onboardPartner);
router.get('/partners', ctrl.listPartners);
router.patch(
  '/partners/:id/status',
  validate({ params: idParam, body: partnerStatusSchema }),
  ctrl.setPartnerStatus,
);
router.get('/dashboard', ctrl.dashboard);

// цены платформы — смотреть и менять (в сумах)
router.get('/pricing', ctrl.getPricing);
router.put('/pricing', validate({ body: updatePricingSchema }), ctrl.updatePricing);

// заявки с лендинга — просмотр и обработка (приём заявки — публичный /api/leads)
router.get('/leads', validate({ query: leadListQuery }), ctrl.listLeads);
router.patch('/leads/:id', validate({ params: idParam, body: leadUpdateSchema }), ctrl.updateLead);

export default router;
