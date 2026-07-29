import { X, Inbox, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Общий UI-кит кабинета студента.
 *
 * 2026-07-30: раньше кит был построен на той же дизайн-системе, что и
 * взрослая staff-панель (муted-иконки, тонкие плашки, канцелярский тон) —
 * ровно то, что подходит Super Admin/Admin, но не ребёнку 9-14 лет, для
 * которого сделан этот кабинет. Тут другая аудитория — крупнее, ярче,
 * дружелюбнее: цветные градиентные бейджи вместо приглушённых плашек,
 * более крупные скругления, поощряющий тон в пустых состояниях.
 */

/* ── Заголовок страницы ─────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-base-content/55 mt-1 font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Аватар (инициалы на цветной подложке) ──────────────────────────────── */
const AVATAR_PALETTE = [
  ['#FEF3C7', '#B45309'], ['#DBEAFE', '#1D4ED8'], ['#FCE7F3', '#BE185D'],
  ['#EDE9FE', '#6D28D9'], ['#DCFCE7', '#15803D'], ['#FFE4E6', '#BE123C'],
];

export function Avatar({ name, size = 'md', onDark = false }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase();
  const cls = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-lg',
  }[size];
  if (onDark) {
    return (
      <span className={`${cls} bg-limebrand/20 text-limebrand rounded-2xl grid place-items-center font-extrabold shrink-0`} aria-hidden="true">
        {letter}
      </span>
    );
  }
  let h = 0;
  for (const c of name || '?') h = (h * 31 + c.charCodeAt(0)) % AVATAR_PALETTE.length;
  const [bg, fg] = AVATAR_PALETTE[h];
  return (
    <span
      className={`${cls} rounded-2xl grid place-items-center font-extrabold shrink-0`}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/* ── KPI / стат-плитка ──────────────────────────────────────────────────
   Раньше: приглушённый квадрат-иконка 8×8 на 10%-тинте. Теперь: крупный
   градиентный значок 14×14 — так это читается как игровой счётчик
   (коины/трофей), а не строка в бухгалтерской таблице. */
const KPI_TONES = {
  neutral: { badge: 'linear-gradient(135deg, #FBBF24, #F59E0B)', text: 'text-amber-600' },
  success: { badge: 'linear-gradient(135deg, #4ADE80, #16A34A)', text: 'text-success' },
  warning: { badge: 'linear-gradient(135deg, #FB923C, #EA580C)', text: 'text-warning' },
  danger: { badge: 'linear-gradient(135deg, #F87171, #DC2626)', text: 'text-error' },
  info: { badge: 'linear-gradient(135deg, #60A5FA, #2563EB)', text: 'text-info' },
  purple: { badge: 'linear-gradient(135deg, #C084FC, #7C3AED)', text: 'text-violet-600' },
};

export function StatCard({ Icon, label, value, hint, tone = 'neutral', valueClass = '' }) {
  const t = KPI_TONES[tone] ?? KPI_TONES.neutral;
  return (
    <div className="card bg-base-100 rounded-3xl card-hover-premium">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 text-white shadow-sm"
            style={{ background: t.badge }}
          >
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wider text-base-content/45">
            {label}
          </span>
        </div>
        <div className={`text-4xl font-extrabold mt-4 leading-none tabular-nums ${valueClass}`}>{value}</div>
        {hint && <div className="text-sm text-base-content/45 mt-1.5 font-medium">{hint}</div>}
      </div>
    </div>
  );
}

/* ── Карточка-панель с шапкой ───────────────────────────────────────────── */
export function Panel({ title, icon: Icon, action, children, bodyClass = 'p-5' }) {
  return (
    <section className="card bg-base-100 rounded-3xl overflow-hidden">
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-base-200">
          <h2 className="text-base font-extrabold flex items-center gap-2 text-base-content/85">
            {Icon && (
              <span className="w-8 h-8 rounded-xl bg-primary/12 text-primary grid place-items-center shrink-0">
                <Icon size={16} />
              </span>
            )}
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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold whitespace-nowrap ${PILL_TONES[tone] ?? PILL_TONES.muted} ${className}`}>
      {children}
    </span>
  );
}

/* ── Кнопка ─────────────────────────────────────────────────────────────
   Фирменный «объёмный» вид игровых edtech-приложений (Duolingo и т.п.):
   плоская заливка + нижняя тень 4px, при нажатии кнопка «проваливается»
   на transform. Не градиент, не эмодзи — просто тактильная форма, которая
   и делает интерфейс «игровым» без единого стикера. Инлайн-style для
   цвета/тени, потому что Tailwind не даёт собрать произвольный
   box-shadow-цвет по имени тона во время сборки. */
const BUTTON_TONES = {
  primary: { bg: '#65A30D', shadow: '#3F6212' },
  info: { bg: '#2563EB', shadow: '#1E3A8A' },
  purple: { bg: '#7C3AED', shadow: '#4C1D95' },
  warning: { bg: '#F59E0B', shadow: '#92400E' },
  neutral: { bg: '#64748B', shadow: '#334155' },
};

const BUTTON_SIZES = {
  sm: 'px-4 py-2 text-[13px] rounded-xl',
  md: 'px-6 py-3 text-[15px] rounded-2xl',
};

export function Button({ tone = 'primary', variant = 'solid', size = 'md', className = '', disabled, children, ...props }) {
  const t = BUTTON_TONES[tone] ?? BUTTON_TONES.primary;
  const sizeCls = BUTTON_SIZES[size] ?? BUTTON_SIZES.md;
  if (variant === 'outline') {
    return (
      <button
        {...props}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 font-extrabold border-2 transition-colors disabled:opacity-40 disabled:pointer-events-none ${sizeCls} ${className}`}
        style={{ borderColor: t.bg, color: t.bg }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-extrabold text-white transition-transform active:translate-y-[3px] disabled:pointer-events-none ${sizeCls} ${className}`}
      style={{
        background: disabled ? '#CBD5E1' : t.bg,
        boxShadow: disabled ? 'none' : `0 ${size === 'sm' ? '3px' : '4px'} 0 0 ${disabled ? 'transparent' : t.shadow}`,
      }}
    >
      {children}
    </button>
  );
}

/* ── Сегментированные вкладки ───────────────────────────────────────────── */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="inline-flex gap-1 p-1.5 rounded-full bg-base-200 border border-base-300">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={`px-4 py-2 rounded-full text-sm font-extrabold transition-all ${
              active ? 'bg-primary text-primary-content shadow-sm scale-105' : 'text-base-content/55 hover:text-base-content'
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
export function Skeleton({ h = 96, count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton w-full rounded-3xl" style={{ height: h }} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3, height = 'h-14' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${height} w-full rounded-2xl`} />
      ))}
    </div>
  );
}

/* ── Пустое состояние ─────────────────────────────────────────────────────
   Karis: никаких эмодзи-как-иконок («стикеры») — даже для ободряющего тона.
   Цветной бейдж + нормальная векторная иконка (lucide, тот же язык, что и
   везде в приложении) делают то же самое дружелюбнее, без дешёвого вида. */
export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <span className="w-20 h-20 rounded-3xl bg-primary/10 text-primary grid place-items-center mb-4">
        <Icon size={34} />
      </span>
      <p className="text-base font-extrabold text-base-content/80">{title}</p>
      {text && <p className="text-sm text-base-content/50 mt-1.5 max-w-xs font-medium">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Состояние ошибки ───────────────────────────────────────────────────── */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <span className="w-20 h-20 rounded-3xl bg-error/10 text-error grid place-items-center mb-4">
        <AlertTriangle size={32} />
      </span>
      <p className="text-base font-extrabold text-base-content/80">Ой, что-то не загрузилось</p>
      {message && <p className="text-sm text-base-content/50 mt-1.5 max-w-xs font-medium">{message}</p>}
      {onRetry && (
        <Button type="button" onClick={onRetry} className="mt-4">
          Попробовать снова <ArrowRight size={14} />
        </Button>
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
      <div className="modal-box glass-strong border border-[var(--border)] animate-scale-in rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl grid place-items-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
