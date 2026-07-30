import { X, Inbox, AlertTriangle } from 'lucide-react';

/**
 * UI-кит кабинета ученика (7-14 лет).
 *
 * 2026-07-30, собран по КОНКРЕТНЫМ референсам от Karis, а не по догадкам.
 * Ключевое из образца: светлая основа, белые карточки, КРУПНЫЕ ЦВЕТНЫЕ
 * значки категорий (именно они дают живость), лайм — цвет действия и
 * активного состояния.
 */

export const C = {
  bg: '#F4F7EF',
  card: '#FFFFFF',
  text: '#1D2417',
  muted: '#78876C',
  line: '#EBF0E2',
  lime: '#C6FF34',
  limeDk: '#A8E01F',
  ink: '#141B10',
  violet: '#7C5CFF',
  blue: '#2E9BFF',
  coral: '#FF6B5A',
  amber: '#FFB020',
  teal: '#12B886',
  pink: '#FF5FA2',
};

/* Цвета категорий — чтобы разделы и типы заданий различались мгновенно */
export const HUES = {
  lime: C.lime,
  violet: C.violet,
  blue: C.blue,
  coral: C.coral,
  amber: C.amber,
  teal: C.teal,
  pink: C.pink,
};

/* ── Крупный цветной значок ─────────────────────────────────────────────
   Главный носитель «детскости» из референса: большой сочный квадрат с
   мягким блеском, внутри белая иконка. */
export function IconTile({ icon: Icon, hue = 'violet', size = 56, radius, className = '' }) {
  const fill = HUES[hue] ?? C.violet;
  return (
    <span
      className={`k-icon shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: fill,
        borderRadius: radius ?? Math.round(size * 0.32),
        boxShadow: `0 6px 16px ${fill}59`,
      }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2.4} />
    </span>
  );
}

/* ── Кольцо прогресса (знак из логотипа LevelUp) ─────────────────────── */
export function Ring({ percent = 0, size = 76, thickness = 7, color = C.lime, track = C.line, children }) {
  return (
    <span
      className="k-ring shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${percent}%, ${track} 0)` }}
    >
      <i style={{ width: size - thickness * 2, height: size - thickness * 2 }}>{children}</i>
    </span>
  );
}

/* ── Кнопка ─────────────────────────────────────────────────────────── */
const BSIZE = {
  sm: 'px-4 py-2 text-[13.5px] rounded-xl',
  md: 'px-5 py-2.5 text-[14.5px] rounded-xl',
  lg: 'px-6 py-3.5 text-[16px] rounded-2xl',
};

export function Button({ hue = 'lime', size = 'md', className = '', disabled, children, ...props }) {
  const fill = disabled ? C.line : HUES[hue] ?? C.lime;
  const fg = disabled ? C.muted : hue === 'lime' ? C.ink : '#fff';
  return (
    <button
      {...props}
      disabled={disabled}
      className={`k-hover inline-flex items-center justify-center gap-2 font-extrabold whitespace-nowrap disabled:cursor-not-allowed ${BSIZE[size] ?? BSIZE.md} ${className}`}
      style={{ background: fill, color: fg, boxShadow: disabled ? 'none' : `0 5px 14px ${fill}55` }}
    >
      {children}
    </button>
  );
}

/* ── Заголовок страницы ─────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
      <div>
        <h1 className="text-[26px] sm:text-[31px] font-extrabold leading-[1.1] tracking-[-0.025em]" style={{ color: C.text }}>
          {title}
        </h1>
        {subtitle && <p className="text-[14px] mt-1 font-semibold" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Аватар ─────────────────────────────────────────────────────────── */
export function Avatar({ name, size = 38 }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase();
  return (
    <span
      className="rounded-full grid place-items-center font-extrabold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, background: C.lime, color: C.ink }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/* ── Панель ─────────────────────────────────────────────────────────── */
export function Panel({ title, icon: Icon, hue = 'violet', action, children, bodyClass = 'p-4 sm:p-5' }) {
  return (
    <section className="k-card overflow-hidden">
      {title && (
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3">
          <h2 className="text-[16px] font-extrabold flex items-center gap-2.5" style={{ color: C.text }}>
            {Icon && <IconTile icon={Icon} hue={hue} size={34} />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClass} style={title ? { paddingTop: 0 } : undefined}>{children}</div>
    </section>
  );
}

/* ── Ярлык ──────────────────────────────────────────────────────────── */
export function Pill({ hue = 'muted', children, className = '' }) {
  const map = {
    lime: { bg: '#F0FFD1', fg: '#4F7A00' },
    teal: { bg: '#DFF8EE', fg: '#0B7A5A' },
    coral: { bg: '#FFE9E6', fg: '#C0392B' },
    amber: { bg: '#FFF3DC', fg: '#96620A' },
    blue: { bg: '#E4F1FF', fg: '#1668B8' },
    violet: { bg: '#EEEAFF', fg: '#5136C4' },
    muted: { bg: '#F1F4EB', fg: C.muted },
  };
  const s = map[hue] ?? map.muted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold whitespace-nowrap px-2.5 py-1 rounded-lg ${className}`}
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

/* ── Вкладки ────────────────────────────────────────────────────────── */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-2xl" style={{ background: '#EDF2E4' }}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className="px-4 py-2 rounded-xl text-[13.5px] font-extrabold transition-all"
            style={on
              ? { background: C.card, color: C.text, boxShadow: '0 2px 6px rgba(29,36,23,.10)' }
              : { background: 'transparent', color: C.muted }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Скелеты ────────────────────────────────────────────────────────── */
export function Skeleton({ h = 108, count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse" style={{ height: h, background: '#E8EEDE', borderRadius: 18 }} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3, height = 62 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse" style={{ height, background: '#E8EEDE', borderRadius: 14 }} />
      ))}
    </div>
  );
}

/* ── Пустое состояние ───────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, text, action, hue = 'violet' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <IconTile icon={Icon} hue={hue} size={64} />
      <p className="text-[16.5px] font-extrabold mt-4" style={{ color: C.text }}>{title}</p>
      {text && <p className="text-[13.5px] font-semibold mt-1.5 max-w-xs" style={{ color: C.muted }}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      hue="coral"
      title="Не получилось загрузить"
      text={message}
      action={onRetry ? <Button onClick={onRetry}>Попробовать снова</Button> : null}
    />
  );
}

/* ── Модалка ────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(29,36,23,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
        aria-label="Закрыть"
        tabIndex={-1}
      />
      <div className="k-card relative w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-[20px] font-extrabold leading-tight" style={{ color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
            style={{ background: C.bg, color: C.muted }}
            aria-label="Закрыть"
          >
            <X size={17} strokeWidth={2.8} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
