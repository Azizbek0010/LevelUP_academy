/* ─────────────────────────────────────────────────────────────────────────────
   Branch Manager — umumiy UI yordamchilari (faqat shu panel uchun).
   Asosiy qurilmalar (Panel, Kpi, Avatar, Modal) mentor/_ui.jsx dan import
   qilinadi — dizayn tizimi bitta. Bu yerda faqat branch-manager'ga xos
   komponentlar: moliyaviy ustun-chart va status badge.
   ────────────────────────────────────────────────────────────────────────── */
import { money } from '../../format.js';
import { PAYMENT_STATUS } from './_data.js';

/* ── Daromad vs Xarajat ustun-charti ────────────────────────────────────────
   Recharts emas, sof CSS: bir nechta ustun uchun kutubxona olib kelishdan
   ko'ra oddiyroq va qulayroq. `tooltip` DaisyUI — hover'da qiymat ko'rsatadi. */
export function FinanceBars({ months, height = 160 }) {
  const max = Math.max(...months.flatMap((m) => [m.income, m.expenses]));
  const bar = (value) => `${Math.round((value / max) * height)}px`;

  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {months.map((m) => (
        <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
          <div className="flex items-end justify-center gap-1 w-full flex-1">
            <div
              className="tooltip tooltip-top w-full max-w-[26px] rounded-t-md bg-success/70 hover:bg-success transition-colors"
              data-tip={`${m.label} · Daromad ${money(m.income)}`}
              style={{ height: bar(m.income) }}
            />
            <div
              className="tooltip tooltip-top w-full max-w-[26px] rounded-t-md bg-error/60 hover:bg-error transition-colors"
              data-tip={`${m.label} · Xarajat ${money(m.expenses)}`}
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

/* ── To'lov statusi badge ────────────────────────────────────────────────── */
export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, cls: 'badge-ghost' };
  return <span className={`badge badge-sm ${meta.cls}`}>{meta.label}</span>;
}
