/**
 * Тарифные планы партнёров (Super Admin платит нам).
 *
 * ВАЖНО: цена больше НЕ зависит от плана. Реальные цены лежат в БД
 * (таблица platform_pricing) и редактируются Main Admin'ом — см. modules/main.
 * План pro/max здесь остаётся ТОЛЬКО как лимит (макс. филиалов/студентов).
 *
 * Счёт за месяц (все суммы в сумах):
 *   base_first_branch + (филиалы − 1) × per_extra_branch + ученики × per_student
 *   (если филиалов 0 — плата за филиалы не берётся).
 */
export const PLAN_IDS = ['pro', 'max'];

export const PLANS = {
  pro: { id: 'pro', label: 'Pro', maxBranches: 3, maxStudents: 300 },
  max: { id: 'max', label: 'Max', maxBranches: 10, maxStudents: 3000 },
};

/**
 * Счёт партнёра за месяц по ценам платформы и текущему использованию.
 * pricing — { baseFirstBranch, perExtraBranch, perStudent } из БД (в сумах).
 */
export function computeBill(pricing, { students = 0, branches = 0 } = {}) {
  if (!pricing) return 0;
  const branchCost =
    branches <= 0 ? 0 : pricing.baseFirstBranch + (branches - 1) * pricing.perExtraBranch;
  return branchCost + students * pricing.perStudent;
}

/** Лимиты плана (для будущей проверки при создании филиалов/студентов). */
export function planLimits(planId) {
  const p = PLANS[planId];
  return p ? { maxBranches: p.maxBranches, maxStudents: p.maxStudents } : null;
}
