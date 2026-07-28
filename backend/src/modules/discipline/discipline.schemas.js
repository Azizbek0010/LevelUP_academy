import { z } from 'zod';

// penalty_type (Postgres ENUM) — 4 уровня, от мягкого к жёсткому:
//  sariq (жёлтый)  — предупреждение, без денег, без блокировки
//  qizil (красный) — строгое предупреждение, без денег, без блокировки
//  shtraf          — денежный штраф, сумма обязательна
//  qora            — увольнение, суммы нет
// sariq/qizil — НЕ автоматика: накопление их количества нигде не порождает
// qora само по себе, это остаётся ручным решением того, кто выдаёт взыскание.
export const PENALTY_TYPES = ['sariq', 'qizil', 'shtraf', 'qora'];

// Выдать взыскание сотруднику.
export const issuePenaltySchema = z
  .object({
    targetUserId: z.string().uuid('Некорректный id сотрудника'),
    type: z.enum(PENALTY_TYPES),
    amount: z.coerce.number().min(0, 'Сумма не может быть отрицательной').max(1_000_000_000_000).optional(),
    reason: z.string().trim().min(1, 'Причина обязательна').max(2000, 'Макс. 2000 символов'),
  })
  .refine((v) => (v.type === 'shtraf' ? v.amount !== undefined : v.amount === undefined), {
    message: 'Для штрафа нужна сумма (amount); для остальных типов — без суммы',
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
  type: z.enum(PENALTY_TYPES).optional(),
});

// Правило дисциплины (qoyda) — каталог «нарушение → уровень», не привязан к
// конкретному сотруднику (см. discipline_rules).
export const createRuleSchema = z
  .object({
    type: z.enum(PENALTY_TYPES),
    amount: z.coerce.number().min(0, 'Сумма не может быть отрицательной').max(1_000_000_000_000).optional(),
    description: z.string().trim().min(1, 'Опишите правило').max(500, 'Макс. 500 символов'),
  })
  .refine((v) => (v.type === 'shtraf' ? v.amount !== undefined : v.amount === undefined), {
    message: 'Для штрафа нужна сумма (amount); для остальных типов — без суммы',
    path: ['amount'],
  });

export const idParam = z.object({ id: z.string().uuid('Invalid id') });
