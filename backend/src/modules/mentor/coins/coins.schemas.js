import { z } from 'zod';

// Начисление/списание коинов ученику вручную (ментор/админ) — знак задаёт операцию.
export const grantCoinsSchema = z.object({
  studentId: z.string().uuid('Invalid studentId'),
  amount: z.coerce
    .number()
    .int('Amount must be an integer')
    .refine((n) => n !== 0, 'Amount must be a non-zero integer'),
  reason: z.string().trim().min(1, 'Reason is required').max(200),
});

export const studentParam = z.object({
  studentId: z.string().uuid('Invalid studentId'),
});

export const historyQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
