import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import * as ctrl from './users.controller.js';
import { idParamSchema, listUsersQuerySchema, updateProfileSchema } from './users.schemas.js';

const router = Router();

router.use(authenticate);

router.get('/me', ctrl.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), ctrl.updateMe);
router.get('/', authorize('admin', 'superadmin'), validate({ query: listUsersQuerySchema }), ctrl.listUsers);
// только персонал — member-роли (student/parent) не должны читать чужой PII;
// контроллер дополнительно скоупит по org/branch. Свои данные — через GET /me.
router.get('/:id', authorize('main_admin', 'superadmin', 'admin', 'mentor'), validate({ params: idParamSchema }), ctrl.getUser);

export default router;
