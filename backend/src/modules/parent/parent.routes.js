import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import overviewRoutes from './overview/overview.routes.js';

/** Агрегатор parent-домена — монтируется в app.js. */
const router = Router();

router.use(authenticate, authorize('parent'));

router.use('/', overviewRoutes);

export default router;
