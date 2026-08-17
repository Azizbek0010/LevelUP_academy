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

/* ── KPI-карточка с иконкой и подписью ──
   Токены и структура — те же "strict"-переменные, что у Admin/SEO дашборда
   (index.css § DASHBOARD STRICT TOKENS, components/ui.jsx KpiCard): плоская
   белая карточка, тонкая рамка вместо цветного ring-halo, компактная 8px
   плашка под иконку вместо круглой rounded-xl — раньше Finance выглядела
   заметно "мультяшнее" остальных панелей (Karis, 13.08.2026: "seryozini roq
   qil"). */
const TONES = {
  success: { bg: 'var(--bg-success)', fg: 'var(--success)' },
  warning: { bg: 'var(--bg-warning)', fg: 'var(--warning)' },
  neutral: { bg: 'var(--border-faint)', fg: 'var(--text-muted)' },
  info:    { bg: 'var(--bg-info)',    fg: 'var(--info)' },
};

export function Metric({ Icon, label, value, sub, tone = 'neutral', trend, trendLabel }) {
  const { bg, fg } = TONES[tone] ?? TONES.neutral;
  const up = (trend ?? 0) >= 0;
  return (
    <article className="
      bg-white
      border border-[var(--border-subtle)]
      rounded-[var(--radius-card)]
      p-4 md:p-5
      shadow-[var(--shadow-card)]
      transition-shadow duration-200
      hover:shadow-[var(--shadow-card-hover)]
    ">
      <div className="flex items-start justify-between gap-3">
        <span
          className="w-10 h-10 rounded-[var(--radius-tight)] grid place-items-center shrink-0"
          style={{ background: bg, color: fg }}
        >
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mt-3 truncate">
        {label}
      </p>
      <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-[var(--text)] mt-1.5">
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{sub}</p>}
      {trend !== undefined && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs">
          <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {up ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          {trendLabel && <span className="text-[var(--text-muted)]">{trendLabel}</span>}
        </div>
      )}
    </article>
  );
}

/* ── Карточка с заголовком — тот же DashboardPanel-паттерн, что у Admin/SEO ── */
export function Card({ title, subtitle, action, children, bodyClass = 'p-4', className = '' }) {
  return (
    <section className={`
      bg-white
      border border-[var(--border-subtle)]
      rounded-[var(--radius-card)]
      shadow-[var(--shadow-card)]
      transition-shadow duration-200
      hover:shadow-[var(--shadow-card-hover)]
      ${className}
    `}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border-faint)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
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
