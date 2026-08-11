/* ─────────────────────────────────────────────────────────────────────────────
   Finance Manager — общие UI-компоненты (только для этой панели). Стили —
   DaisyUI, тон — из дизайн-системы остальных панелей.
   ────────────────────────────────────────────────────────────────────────── */
import { money } from '../../format.js';
import { LANGS, useLang } from './_i18n.jsx';
import { PAYMENT_STATUS } from './_data.js';

/* ── Переключатель языка RU/UZ/EN ── */
export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="join bg-base-200 p-0.5 rounded-lg">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`join-item btn btn-xs border-0 rounded-md transition-colors ${
            lang === l.code ? 'btn-primary text-primary-content' : 'btn-ghost text-base-content/60'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/* ── KPI-карточка с иконкой и подписью ── */
const TONES = {
  success: { chip: 'bg-success/15 text-success', ring: 'ring-success/30' },
  warning: { chip: 'bg-warning/15 text-warning', ring: 'ring-warning/30' },
  neutral: { chip: 'bg-base-content/5 text-base-content/70', ring: 'ring-base-content/15' },
  info:    { chip: 'bg-info/15 text-info', ring: 'ring-info/30' },
};

export function Metric({ Icon, label, value, sub, tone = 'neutral', trend, trendLabel }) {
  const t = TONES[tone] ?? TONES.neutral;
  const up = (trend ?? 0) >= 0;
  return (
    <div className={`rounded-2xl border border-base-300 bg-base-100 p-5 ring-4 ${t.ring} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-base-content/50 truncate">{label}</p>
          <p className="text-[22px] font-extrabold tracking-tight mt-1.5 text-base-content">{value}</p>
          {sub && <p className="text-[12px] text-base-content/50 mt-1 truncate">{sub}</p>}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${t.chip}`}>
          <Icon size={20} />
        </span>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          <span className={`inline-flex items-center gap-0.5 font-bold ${up ? 'text-success' : 'text-error'}`}>
            {up ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          <span className="text-base-content/40">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

/* ── Карточка с заголовком ── */
export function Card({ title, subtitle, action, children, bodyClass = 'p-4', className = '' }) {
  return (
    <section className={`rounded-2xl border border-base-300 bg-base-100 shadow-[0_1px_2px_rgba(29,36,23,0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-2">
          <div>
            <h3 className="text-[15px] font-bold text-base-content">{title}</h3>
            {subtitle && <p className="text-[12px] text-base-content/50 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/* ── Badge статуса платежа ── */
export function StatusBadge({ status }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, cls: 'badge-ghost' };
  return <span className={`badge badge-sm ${meta.cls}`}>{meta.label}</span>;
}

/* ── Badge метода оплаты (карта / наличные / гибрид) ── */
const METHOD_META = {
  Karta:  { cls: 'badge-info',    icon: '💳' },
  Naqd:   { cls: 'badge-success', icon: '💵' },
  Hybrid: { cls: 'badge-warning', icon: '🔀' },
};

export function MethodBadge({ method, t }) {
  const meta = METHOD_META[method] ?? { cls: 'badge-ghost', icon: '' };
  const key = method === 'Karta' ? 'method.karta' : method === 'Naqd' ? 'method.naqd' : 'method.hybrid';
  return <span className={`badge badge-sm gap-1 ${meta.cls}`}><span className="text-[11px]">{meta.icon}</span>{t?.(key) ?? method}</span>;
}

/* ── Badge плановости расхода ── */
export function PlannedBadge({ planned, t }) {
  return planned
    ? <span className="badge badge-sm badge-ghost">{t('expenses.planned')}</span>
    : <span className="badge badge-sm badge-error gap-1">⚠ {t('expenses.unplanned')}</span>;
}

/* ── Селекты филиала и месяца ── */
export function BranchSelect({ value, onChange, allLabel, branches }) {
  return (
    <select className="select select-bordered select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">{allLabel}</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}

export function MonthSelect({ value, onChange, months }) {
  return (
    <select className="select select-bordered select-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {months.map((m) => (
        <option key={m.key} value={m.key}>{m.label}</option>
      ))}
    </select>
  );
}

/* ── Деньги с компактным форматированием (млн/тыс) ── */
export function compactMoney(n) {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.0', '')} mln`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} ming`;
  return money(v);
}
