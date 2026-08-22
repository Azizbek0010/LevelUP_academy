/* ─────────────────────────────────────────────────────────────────────────────
   Branch Manager — общие UI-хелперы (только для этой панели).
   Основные компоненты (Panel, Kpi, Avatar, Modal) импортируются из
   mentor/_ui.jsx — дизайн-система единая. Здесь только специфичные
   для branch-manager компоненты: финансовый столбцовый график и бейдж статуса.
   ────────────────────────────────────────────────────────────────────────── */
import { money } from '../../format.js';

/* invoice_status enum (backend/src/modules/admin/payments/payments.schemas.js) */
const PAYMENT_STATUS = {
  paid:            { label: "To'langan",       cls: 'badge-success' },
  partially_paid:  { label: 'Qisman to‘langan', cls: 'badge-warning' },
  pending:         { label: 'Kutilmoqda',       cls: 'badge-ghost' },
  overdue:         { label: "Muddati o'tgan",  cls: 'badge-error' },
  cancelled:       { label: 'Bekor qilingan',   cls: 'badge-neutral' },
};

/* ── Столбцовый график «Доход vs Расход» ────────────────────────────────────
   Без Recharts, на чистом CSS: несколько столбцов не требуют библиотеки.
   Используется DaisyUI tooltip — при наведении показывает значение. */
export function FinanceBars({ months, height = 160 }) {
  const max = Math.max(...months.flatMap((m) => [m.income, m.expenses]), 1);
  const bar = (value) => `${Math.round((value / max) * height)}px`;

  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {months.map((m) => (
        <div key={m.month || m.key} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
          <div className="flex items-end justify-center gap-1 w-full flex-1">
            <div
              className="tooltip tooltip-top w-full max-w-[26px] rounded-t-md bg-success/70 hover:bg-success transition-colors"
              data-tip={`${m.label} · Доход ${money(m.income)}`}
              style={{ height: bar(m.income) }}
            />
            <div
              className="tooltip tooltip-top w-full max-w-[26px] rounded-t-md bg-error/60 hover:bg-error transition-colors"
              data-tip={`${m.label} · Расход ${money(m.expenses)}`}
              style={{ height: bar(m.expenses) }}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/40 truncate max-w-full">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Бейдж статуса платежа ────────────────────────────────────────────────── */
export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, cls: 'badge-ghost' };
  return <span className={`badge badge-sm ${meta.cls}`}>{meta.label}</span>;
}
