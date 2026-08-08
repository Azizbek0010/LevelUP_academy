import { z } from 'zod';

export const listExpensesQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().optional(),
});

export const listIncomeQuery = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM'),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const listReportsQuery = z.object({
  range: z.enum(['3m', '6m', '12m']).optional(),
});