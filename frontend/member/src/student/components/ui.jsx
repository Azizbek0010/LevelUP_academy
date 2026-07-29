import { X, Inbox, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Общий UI-кит кабинета студента.
 *
 * Строится на той же дизайн-системе, что и панель staff (admin/mentor):
 * DaisyUI-тема `levelup`, лесной зелёный primary, карточки `.card bg-base-100`,
 * Manrope. Форма компонентов повторяет staff `pages/mentor/_ui.jsx`, чтобы
 * обе панели выглядели как один продукт.
 */

/* ── Заголовок страницы ─────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-base-content/55 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Аватар (инициалы на светло-зелёной подложке) ───────────────────────── */
export function Avatar({ name, size = 'md', onDark = false }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase();
  const cls = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];
  const tone = onDark ? 'bg-limebrand/20 text-limebrand' : 'bg-primary/15 text-primary';
  return (
    <span className={`${cls} ${tone} rounded-full grid place-items-center font-bold shrink-0`} aria-hidden="true">
      {letter}
    </span>
  );
}

/* ── KPI / стат-плитка ──────────────────────────────────────────────────
   Цвет задаётся СМЫСЛОМ (tone → токен темы), а не пикселем — как в staff.
   `to` превращает плитку в ссылку (со стрелкой и hover). */
const KPI_TONES = {
  neutral: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
};

export function StatCard({ Icon, label, value, hint, tone = 'neutral', valueClass = '' }) {
  return (
    <div className="card bg-base-100 card-hover-premium">
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${KPI_TONES[tone] ?? KPI_TONES.neutral}`}>
            <Icon size={16} strokeWidth={2.2} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
            {label}
          </span>
        </div>
        <div className={`text-3xl font-extrabold mt-3 leading-none tabular-nums ${valueClass}`}>{value}</div>
        {hint && <div className="text-xs text-base-content/45 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

/* ── Карточка-панель с шапкой ───────────────────────────────────────────── */
export function Panel({ title, icon: Icon, action, children, bodyClass = 'p-4' }) {
  return (
    <section className="card bg-base-100">
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

/* ── Pill / бейдж ───────────────────────────────────────────────────────── */
const PILL_TONES = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  danger: 'bg-error/12 text-error',
  warning: 'bg-warning/12 text-warning',
  info: 'bg-info/12 text-info',
  muted: 'bg-base-200 text-base-content/55',
};

export function Pill({ tone = 'muted', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${PILL_TONES[tone] ?? PILL_TONES.muted} ${className}`}>
      {children}
    </span>
  );
}

/* ── Сегментированные вкладки ───────────────────────────────────────────── */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-full bg-base-200 border border-base-300">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${
              active ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/55 hover:text-base-content'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Скелеты ────────────────────────────────────────────────────────────── */
export function Skeleton({ h = 56, count = 3 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton w-full rounded-xl" style={{ height: h }} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3, height = 'h-14' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${height} w-full rounded-xl`} />
      ))}
    </div>
  );
}

/* ── Пустое состояние ───────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <span className="w-14 h-14 rounded-2xl bg-base-200 text-base-content/35 grid place-items-center mb-4">
        <Icon size={26} />
      </span>
      <p className="text-sm font-semibold text-base-content/70">{title}</p>
      {text && <p className="text-xs text-base-content/45 mt-1 max-w-xs">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Состояние ошибки ───────────────────────────────────────────────────── */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <span className="w-14 h-14 rounded-2xl bg-error/10 text-error grid place-items-center mb-4">
        <AlertTriangle size={26} />
      </span>
      <p className="text-sm font-semibold text-base-content/70">Не удалось загрузить</p>
      {message && <p className="text-xs text-base-content/45 mt-1 max-w-xs">{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-sm btn-primary mt-4 gap-1.5" onClick={onRetry}>
          Повторить <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Модалка ────────────────────────────────────────────────────────────
   Оверлей + бокс на стекле, как staff `_ui.jsx` Modal. Управляется условным
   рендером в родителе (`{open && <Modal .../>}`). */
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box glass-strong border border-[var(--border)] animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
