import { Router } from 'express';
import { validate } from '../../../middlewares/validate.js';
import * as ctrl from './payments.controller.js';
import {
  idParam,
  createAdHocPaymentSchema,
  payInvoiceSchema,
  refundSchema,
  voidSchema,
  receiptUploadUrlQuery,
  attachReceiptSchema,
  listInvoicesQuery,
} from './payments.schemas.js';

/**
 * K-PAY — платежи филиала. Смонтирован в admin.routes.js под /payments,
 * authenticate + authorize('admin') уже навешаны родителем; req.scope
 * жёстко = свой branch_id.
 *
 * NASIYA/рассрочки НЕТ (решение 2026-07-05, подтверждено 2026-07-07).
 * Долг появляется через авто-начисление за месяц (billing.worker), гасится
 * либо оплатой конкретного счёта (/invoices/:id/pay), либо разовым платежом
 * вне графика (/ — создаёт свой уже оплаченный invoice).
 */
const router = Router();

router.get('/invoices', validate({ query: listInvoicesQuery }), ctrl.listInvoices);
router.post('/invoices/:id/pay', validate({ params: idParam, body: payInvoiceSchema }), ctrl.payInvoice);

router.post('/', validate({ body: createAdHocPaymentSchema }), ctrl.createAdHocPayment);

router.post(
  '/transactions/:id/refund',
  validate({ params: idParam, body: refundSchema }),
  ctrl.refundTransaction,
);
router.post(
  '/transactions/:id/void',
  validate({ params: idParam, body: voidSchema }),
  ctrl.voidTransaction,
);
router.get(
  '/transactions/:id/receipt-upload-url',
  validate({ params: idParam, query: receiptUploadUrlQuery }),
  ctrl.getReceiptUploadUrl,
);
router.patch(
  '/transactions/:id/receipt',
  validate({ params: idParam, body: attachReceiptSchema }),
  ctrl.attachReceipt,
);

export default router;
