import { Link } from 'react-router-dom';
import { Search, Inbox, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Общие кирпичики панели Main Admin.
 *
 * Форма и правила взяты из `staff/src/pages/mentor/_ui.jsx` — панель ментора
 * уже прошла эту чистку, и повторять её путь заново незачем.
 *
 * Главное отличие от того, что было здесь раньше: цвет задаётся СМЫСЛОМ, а не
 * пикселем. В страницах панели лежало больше тридцати мест с `bg-lime-400`,
 * `text-lime-700`, `bg-red-50`, `border-lime-100` — при смене темы половина из
 * них осталась бы светлой, а «тревожный» и «обычный» отличались только тем,
 * какой оттенок кому-то понравился. Здесь `tone` → токен темы, и лаймовый
 * акцент бренда живёт в одном месте (`primary`), а не в каждом файле.
 */

const TONES = {
  neutral: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
};

/** KPI-плитка: иконка-чип, крупное число, подпись. Кликабельна, если задан `to`. */
export function Kpi({ Icon, title, value, unit, tone = 'neutral', trend, trendLabel, to, onClick }) {
  const body = (
    <div className="p-4 text-left w-full">
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${TONES[tone] ?? TONES.neutral}`}>
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {title}
        </span>
        {(to || onClick) && <ArrowRight size={14} className="ml-auto text-base-content/25 shrink-0" />}
      </div>
      <div className="text-3xl font-extrabold mt-3 leading-none tabular-nums">{value}</div>
      {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      {trend != null && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
            trend >= 0 ? 'text-success' : 'text-error'
          }`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend >= 0 ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
          </span>
          {trendLabel && <span className="text-[10px] text-base-content/40">{trendLabel}</span>}
        </div>
      )}
    </div>
  );

  const card = 'card bg-base-100 border border-base-200/60 shadow-sm';
  if (to) return <Link to={to} className={`${card} hover:border-primary/40 transition-colors block`}>{body}</Link>;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${card} hover:border-primary/40 transition-colors`}>
        {body}
      </button>
    );
  }
  return <div className={card}>{body}</div>;
}

/** Карточка-панель с заголовком и опциональным действием справа. */
export function Panel({ title, icon: Icon, action, children, bodyClass = 'p-4' }) {
  return (
    <section className="card bg-base-100 border border-base-200/60 shadow-sm">
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-200">
          <h2 className="text-sm font-bold flex items-center gap-2 text-base-content/80">
            {Icon && <Icon size={15} className="text-primary shrink-0" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** Пустое состояние — вместо голой строки «нет данных». */
export function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <span className="w-14 h-14 rounded-2xl bg-base-200 text-base-content/35 grid place-items-center mb-4">
        <Icon size={26} />
      </span>
      <p className="text-sm font-semibold text-base-content/70">{title}</p>
      {hint && <p className="text-xs text-base-content/45 mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Поиск. text-base до sm — иначе iOS Safari зумит страницу при фокусе. */
export function SearchInput({ value, onChange, placeholder = 'Поиск...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input input-bordered input-sm w-full pl-9 rounded-lg text-base sm:text-sm"
      />
    </div>
  );
}
