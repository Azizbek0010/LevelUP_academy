/**
 * Тарифная модель платформы (с 2026-07-16).
 *
 * Цена = фиксированная сумма за бакет активных учеников; филиалы включены
 * безлимитом. Старая формула (база за первый филиал + доплата за каждый
 * следующий + цена за ученика) ОТМЕНЕНА, и бэкенд соответствующих полей
 * больше не отдаёт: `GET /api/main/pricing` возвращает `{ tiers, currency }`.
 *
 * Модуль появился потому, что правило выбора бакета уже было продублировано
 * в Billing.jsx, а Dashboard, OrgDetail и Settings всё ещё читали
 * `pricing.baseFirstBranch` / `pricing.perStudent` и рисовали пустые значения.
 * Пусть правило живёт в одном месте.
 *
 * Зеркало `tierForStudents()` из `backend/src/config/plans.js`. Дублирование
 * намеренное: калькулятор должен считать мгновенно, без запроса. Сами тарифы
 * при этом приходят с сервера — здесь только правило выбора.
 */
import { fmt } from '../format.js';

export function tierForStudents(tiers, students) {
  const list = Array.isArray(tiers) ? tiers : [];
  const s = Math.max(0, Number(students) || 0);
  return (
    list.find((t) => s >= t.minStudents && (t.maxStudents == null || s <= t.maxStudents)) ??
    list[list.length - 1] ??
    null
  );
}

export function tierRange(t) {
  if (!t) return '—';
  if (t.maxStudents == null) return `${fmt(t.minStudents)}+`;
  return `${fmt(t.minStudents)}–${fmt(t.maxStudents)}`;
}

/** `price: null` — договорная цена (верхний бакет), `0` — бесплатно. */
export function tierPriceLabel(t, cur) {
  if (!t) return '—';
  if (t.price == null) return 'договорная';
  if (t.price === 0) return 'бесплатно';
  return `${fmt(t.price)} ${cur}`;
}
