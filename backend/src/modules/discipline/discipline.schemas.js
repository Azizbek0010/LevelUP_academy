import { z } from 'zod';

// Выдать штраф или qora сотруднику.
//  - shtraf: обязательна сумма (в сумах, без автосписания) + причина
//  - qora:   без суммы (это увольнение), только причина
export const issuePenaltySchema = z
  .object({
    targetUserId: z.string().uuid('Некорректный id сотрудника'),
    type: z.enum(['shtraf', 'qora']),
    amount: z.coerce.number().min(0, 'Сумма не может быть отрицательной').max(1_000_000_000_000).optional(),
    reason: z.string().trim().min(1, 'Причина обязательна').max(2000, 'Макс. 2000 символов'),
  })
  .refine((v) => (v.type === 'shtraf' ? v.amount !== undefined : v.amount === undefined), {
    message: 'Для штрафа нужна сумма (amount); для qora — без суммы',
    path: ['amount'],
  });

// Устав организации — свободный текст правил (upsert, один на организацию)
export const upsertCharterSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().trim().max(20000, 'Макс. 20000 символов').default(''),
});

// Фильтры списка штрафов (super/admin)
export const listPenaltiesQuery = z.object({
  targetUserId: z.string().uuid().optional(),
  type: z.enum(['shtraf', 'qora']).optional(),
});

export const idParam = z.object({ id: z.string().uuid('Invalid id') });
