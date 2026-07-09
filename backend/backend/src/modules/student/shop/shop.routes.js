import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import { archiveGuard } from '../../../middlewares/archiveGuard.js';
import * as ctrl from './shop.controller.js';
import { itemIdParamSchema, createItemSchema, updateItemSchema } from './shop.schemas.js';

const router = Router();

// auth: authenticate + authorize('student','admin','mentor') навешаны в
// student.routes.js; роль на мутациях дополнительно проверяет сервис.
router.get('/items', ctrl.listItems);
router.post('/items/:itemId/purchase', validate({ params: itemIdParamSchema }), ctrl.purchase);
router.get('/orders', ctrl.listOrders);

router.post('/items', validate({ body: createItemSchema }), ctrl.createItem);
router.patch(
  '/items/:itemId',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  archiveGuard('shop_items', 'itemId'),
  ctrl.updateItem,
);

export default router;
