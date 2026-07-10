import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './reports.controller.js';
import { reportQuery } from './reports.schemas.js';

/**
 * K-PAY reports — выручка + долги по группам филиала. Смонтирован в
 * admin.routes.js под /reports; authenticate + authorize('admin') от родителя.
 */
const router = Router();

router.get('/', validate({ query: reportQuery }), ctrl.branchReport);

export default router;
