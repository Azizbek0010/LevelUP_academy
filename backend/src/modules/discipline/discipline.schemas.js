import { z } from 'zod';

// penalty_type (Postgres ENUM) — 4 уровня, от мягкого к жёсткому:
//  sariq (жёлтый)  — предупреждение, без блокировки
//  qizil (красный) — строгое предупреждение, без блокировки
//  shtraf          — денежный штраф, сумма обязательна
//  qora            — увольнение
// sariq/qizil — НЕ автоматика: накопление их количества нигде не порождает
// qora само по себе, это остаётся ручным решением того, кто выдаёт взыскание.
//
// Сумма (amount): обязательна только у shtraf. У остальных трёх — необязательный
// довесок (например «жёлтое предупреждение» + вычет 20 000 сум одной записью),
// а не эксклюзив shtraf — до 2026-07-28 amount у не-штрафов был вообще запрещён.
export const PENALTY_TYPES = ['sariq', 'qizil', 'shtraf', 'qora'];

const amountField = z.coerce.number().min(0, 'Сумма не может быть отрицательной').max(1_000_000_000_000).optional();

// Выдать взыскание сотруднику.
export const issuePenaltySchema = z
  .object({
    targetUserId: z.string().uuid('Некорректный id сотрудника'),
    type: z.enum(PENALTY_TYPES),
    amount: amountField,
    reason: z.string().trim().min(1, 'Причина обязательна').max(2000, 'Макс. 2000 символов'),
  })
  .refine((v) => v.type !== 'shtraf' || v.amount !== undefined, {
    message: 'Для штрафа нужна сумма (amount)',
    path: ['amount'],
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
    amount: amountField,
    description: z.string().trim().min(1, 'Опишите правило').max(500, 'Макс. 500 символов'),
  })
  .refine((v) => v.type !== 'shtraf' || v.amount !== undefined, {
    message: 'Для штрафа нужна сумма (amount)',
    path: ['amount'],
  });

export const idParam = z.object({ id: z.string().uuid('Invalid id') });
