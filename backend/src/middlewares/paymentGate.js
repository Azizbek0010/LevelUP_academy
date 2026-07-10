import { pool } from '../config/db.js';
import { AppError } from '../utils/AppError.js';

/**
 * Блокирует ВЕСЬ доступ студента к своим данным (домашка/тесты/видео/магазин/
 * дашборд), пока у него есть просроченный (>5 числа) неоплаченный счёт.
 * Оплата (даже частичная) сразу снимает статус 'overdue' у invoice
 * (см. payments.service.applyInvoicePayment) → на следующий же запрос доступ
 * восстанавливается, без ожидания cron-джобы.
 *
 * Не студент (admin/mentor, заходящие в общие роуты вроде /shop) — пропускает
 * молча: у них нет invoices на свой id, сумма всегда 0.
 */
export async function blockIfOverdue(req, _res, next) {
  if (req.user.role !== 'student') return next();

  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS amount
         FROM invoices
        WHERE student_id = $1 AND status = 'overdue' AND deleted_at IS NULL`,
      [req.user.id],
    );
    const amount = Number(rows[0].amount);
    if (amount > 0) {
      return next(new AppError(402, 'Payment overdue — access is blocked until paid', { amount }));
    }
    next();
  } catch (err) {
    next(err);
  }
}
