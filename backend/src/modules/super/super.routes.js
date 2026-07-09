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
} from './super.schemas.js';
import * as ctrl from './super.controller.js';

const router = Router();

// вся панель — только Super Admin (владелец организации-партнёра); scope = своя org
router.use(authenticate, authorize('superadmin'));

// дашборд организации (свой доход, долги, студенты, разбивка по филиалам)
router.get('/dashboard', ctrl.dashboard);

// филиалы
router.post('/branches', validate({ body: createBranchSchema }), ctrl.createBranch);
router.get('/branches', ctrl.listBranches);
router.get('/branches/:id', validate({ params: idParam }), ctrl.branchDetail);
router.patch('/branches/:id', validate({ params: idParam, body: updateBranchSchema }), ctrl.updateBranch);
router.post('/branches/:id/archive', validate({ params: idParam }), ctrl.archiveBranch);
router.post('/branches/:id/unarchive', validate({ params: idParam }), ctrl.unarchiveBranch);

// админы (несколько на филиал разрешено)
router.post('/admins', validate({ body: createAdminSchema }), ctrl.createAdmin);
router.get('/admins', ctrl.listAdmins);
router.patch('/admins/:id', validate({ params: idParam, body: updateAdminSchema }), ctrl.updateAdmin);
router.patch('/admins/:id/freeze', validate({ params: idParam, body: freezeSchema }), ctrl.freezeAdmin);

// методисты (на уровне организации, без привязки к филиалу)
router.post('/methodists', validate({ body: createMethodistSchema }), ctrl.createMethodist);
router.get('/methodists', ctrl.listMethodists);
router.patch('/methodists/:id', validate({ params: idParam, body: updateMethodistSchema }), ctrl.updateMethodist);
router.patch('/methodists/:id/freeze', validate({ params: idParam, body: freezeMethodistSchema }), ctrl.freezeMethodist);

export default router;
