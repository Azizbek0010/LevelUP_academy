/**
 * Тарифные планы партнёров (Super Admin платит нам).
 *
 * ВАЖНО (2026-07-16): цена = фикс по числу активных учеников (см. TIERS ниже),
 * филиалы включены безлимитом. Старая модель (за филиал + за ученика) ОТМЕНЕНА.
 * PLANS pro/max ниже — legacy, не влияют на счёт (оставлены для совместимости).
 */
export const PLAN_IDS = ['pro', 'max'];

export const PLANS = {
  pro: { id: 'pro', label: 'Pro', maxBranches: 3, maxStudents: 300 },
  max: { id: 'max', label: 'Max', maxBranches: 10, maxStudents: 3000 },
};

/**
 * НОВАЯ модель тарификации (2026-07-16): фикс по бакету активных учеников,
 * филиалы включены безлимитом (на цену НЕ влияют). Прайс здесь = источник правды.
 * TODO v2: сделать тарифы редактируемыми Main Admin'ом через БД.
 */
export const TIERS = [
  { id: 'free', label: 'Free', minStudents: 0, maxStudents: 30, price: 0 },
  { id: 'start', label: 'Start', minStudents: 31, maxStudents: 100, price: 199000 },
  { id: 'standard', label: 'Standard', minStudents: 101, maxStudents: 300, price: 349000 },
  { id: 'pro', label: 'Pro', minStudents: 301, maxStudents: 600, price: 599000 },
  { id: 'business', label: 'Business', minStudents: 601, maxStudents: 1000, price: 799000 },
  { id: 'network', label: 'Network', minStudents: 1001, maxStudents: null, price: null }, // договорная
];

/** Тариф партнёра по числу активных учеников. */
export function tierForStudents(students = 0) {
  const s = Math.max(0, Number(students) || 0);
  return (
    TIERS.find((t) => s >= t.minStudents && (t.maxStudents == null || s <= t.maxStudents)) ??
    TIERS[TIERS.length - 1]
  );
}

/**
 * Счёт партнёра за месяц (сумы) = цена тарифа по числу учеников.
 * Филиалы на цену не влияют. Network (1000+) — договорная → в авто-расчёте 0.
 */
export function computeBill({ students = 0 } = {}) {
  return tierForStudents(students).price ?? 0;
}

/** Лимиты плана (для будущей проверки при создании филиалов/студентов). */
export function planLimits(planId) {
  const p = PLANS[planId];
  return p ? { maxBranches: p.maxBranches, maxStudents: p.maxStudents } : null;
}
