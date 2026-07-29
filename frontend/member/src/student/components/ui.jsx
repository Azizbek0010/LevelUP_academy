import { X, Inbox, AlertTriangle } from 'lucide-react';

/**
 * UI-кит кабинета ученика (7-14 лет).
 *
 * 2026-07-30, переписан целиком. До этого кит повторял staff/родительскую
 * панель: мягкие blur-тени, градиентные бейджи, иконка в бледном квадрате.
 * Это ровно тот «AI-дизайн», на который жаловался Karis — и объективно так
 * и есть: градиент + blur-тень + одинаковые скруглённые карточки это
 * статистический дефолт генеративных моделей.
 *
 * Новый язык — «наклейка на столе» (см. .kid-* в index.css):
 *   толстая чернильная обводка · ТВЁРДАЯ тень без размытия · плоские
 *   насыщенные заливки · физическое вдавливание при нажатии.
 * Ни одного градиента на поверхностях, ни одной размытой тени.
 */

/* Палитра. Дублирует CSS-переменные .kid — нужна в JS там, где цвет
   выбирается по смыслу (тон плитки, узел тропы), а не классом. */
export const INK = '#1B2A1B';
export const HUE = {
  lime: '#C6FF34',
  grass: '#3DA35D',
  sky: '#35A7FF',
  sun: '#FFC93C',
  coral: '#FF6B4A',
  grape: '#A265FF',
  slate: '#B8C4B0',
};
/* Тёмный текст на светлых заливках, светлый — на насыщенных. Лайм и
   солнечный жёлтый слишком светлые для белого текста (контраст ~1.5:1). */
const ON_LIGHT = new Set(['lime', 'sun', 'slate']);
export const textOn = (hue) => (ON_LIGHT.has(hue) ? INK : '#FFFFFF');

/* ── Заголовок страницы ─────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
      <div>
        <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ color: INK }}>
          {title}
        </h1>
        {subtitle && <p className="text-[15px] mt-1.5 font-bold" style={{ color: 'rgba(27,42,27,0.55)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Аватар ─────────────────────────────────────────────────────────────
   Плоский цветной круг с чернильной обводкой. Цвет закреплён за именем,
   поэтому свой аватар всегда одного цвета — ребёнок узнаёт себя в списке. */
const AVATAR_HUES = ['lime', 'sky', 'sun', 'coral', 'grape', 'grass'];

export function Avatar({ name, size = 'md', onDark = false }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase();
  const px = { sm: 34, md: 42, lg: 56 }[size] ?? 42;
  let h = 0;
  for (const c of name || '?') h = (h * 31 + c.charCodeAt(0)) % AVATAR_HUES.length;
  const hue = AVATAR_HUES[h];
  return (
    <span
      className="rounded-full grid place-items-center font-extrabold shrink-0"
      style={{
        width: px,
        height: px,
        fontSize: px * 0.42,
        background: HUE[hue],
        color: textOn(hue),
        border: `${size === 'sm' ? 2.5 : 3}px solid ${onDark ? 'rgba(255,255,255,0.85)' : INK}`,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/* ── Кнопка ─────────────────────────────────────────────────────────────
   Плоская заливка + твёрдая тень, вдавливается при нажатии. */
const BUTTON_SIZES = {
  sm: { pad: '8px 16px', font: 14, radius: 14, shadow: 3 },
  md: { pad: '13px 26px', font: 16, radius: 18, shadow: 5 },
  lg: { pad: '17px 34px', font: 18, radius: 20, shadow: 6 },
};

export function Button({ hue = 'grass', size = 'md', className = '', disabled, children, ...props }) {
  const s = BUTTON_SIZES[size] ?? BUTTON_SIZES.md;
  const fill = disabled ? HUE.slate : HUE[hue] ?? HUE.grass;
  return (
    <button
      {...props}
      disabled={disabled}
      className={`kid-press inline-flex items-center justify-center gap-2 font-extrabold whitespace-nowrap disabled:cursor-not-allowed ${className}`}
      style={{
        padding: s.pad,
        fontSize: s.font,
        borderRadius: s.radius,
        background: fill,
        color: disabled ? 'rgba(27,42,27,0.45)' : textOn(hue),
        border: `3px solid ${INK}`,
        boxShadow: `${s.shadow}px ${s.shadow}px 0 0 ${INK}`,
      }}
    >
      {children}
    </button>
  );
}

/* ── Плитка-показатель ──────────────────────────────────────────────────
   Раньше: белая карточка + градиентный квадратик с иконкой + серая
   подпись. Теперь вся плитка залита своим цветом, число — главный
   элемент композиции. Иконка ушла в угол мелким силуэтом, потому что
   значение важнее декора. */
export function StatTile({ Icon, label, value, hint, hue = 'sun', className = '' }) {
  const fill = HUE[hue] ?? HUE.sun;
  const fg = textOn(hue);
  return (
    <div
      className={`relative overflow-hidden p-5 ${className}`}
      style={{
        background: fill,
        color: fg,
        border: `3px solid ${INK}`,
        borderRadius: 22,
        boxShadow: `5px 5px 0 0 ${INK}`,
      }}
    >
      {Icon && (
        <Icon
          size={92}
          strokeWidth={2.5}
          className="absolute -right-4 -bottom-5 pointer-events-none"
          style={{ opacity: 0.16 }}
          aria-hidden="true"
        />
      )}
      <div className="relative">
        <div className="text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ opacity: 0.7 }}>
          {label}
        </div>
        <div className="kid-num text-[42px] leading-none mt-2">{value}</div>
        {hint && <div className="text-[13px] font-bold mt-1.5" style={{ opacity: 0.7 }}>{hint}</div>}
      </div>
    </div>
  );
}

/* ── Панель ─────────────────────────────────────────────────────────────
   Шапка — плоская цветная полоса, а не белая строка с бледной иконкой. */
export function Panel({ title, icon: Icon, action, hue = 'lime', children, bodyClass = 'p-5' }) {
  const fill = HUE[hue] ?? HUE.lime;
  return (
    <section className="kid-card overflow-hidden">
      {title && (
        <header
          className="flex items-center justify-between gap-3 px-5 py-3.5"
          style={{ background: fill, color: textOn(hue), borderBottom: `3px solid ${INK}` }}
        >
          <h2 className="text-[17px] font-extrabold flex items-center gap-2.5">
            {Icon && <Icon size={20} strokeWidth={2.6} className="shrink-0" />}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/* ── Ярлык ──────────────────────────────────────────────────────────────
   Обводка + плоская заливка, без 12%-тинтов. */
export function Pill({ hue = 'slate', children, className = '' }) {
  const fill = HUE[hue] ?? HUE.slate;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold whitespace-nowrap px-2.5 py-1 ${className}`}
      style={{ background: fill, color: textOn(hue), border: `2.5px solid ${INK}`, borderRadius: 999 }}
    >
      {children}
    </span>
  );
}

/* ── Вкладки ────────────────────────────────────────────────────────────
   Активная вкладка «выезжает» вперёд твёрдой тенью, остальные плоские. */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className="kid-press text-[14px] font-extrabold px-4 py-2.5"
            style={{
              background: active ? HUE.sky : HUE.slate,
              color: active ? '#fff' : 'rgba(27,42,27,0.6)',
              border: `3px solid ${INK}`,
              borderRadius: 16,
              boxShadow: active ? `4px 4px 0 0 ${INK}` : 'none',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Скелеты ────────────────────────────────────────────────────────────
   Форма совпадает с итоговой (обводка + тень), чтобы страница не
   «прыгала» после загрузки. */
export function Skeleton({ h = 132, count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: h, background: 'rgba(27,42,27,0.07)', border: `3px solid rgba(27,42,27,0.18)`, borderRadius: 22 }}
        />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3, height = 64 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height, background: 'rgba(27,42,27,0.07)', border: `3px solid rgba(27,42,27,0.14)`, borderRadius: 18 }}
        />
      ))}
    </div>
  );
}

/* ── Пустое состояние ───────────────────────────────────────────────────
   Никаких эмодзи: плоский цветной круг с обводкой + векторная иконка. */
export function EmptyState({ icon: Icon = Inbox, title, text, action, hue = 'lime' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <span
        className="w-[84px] h-[84px] rounded-full grid place-items-center mb-5"
        style={{ background: HUE[hue], color: textOn(hue), border: `3px solid ${INK}`, boxShadow: `4px 4px 0 0 ${INK}` }}
      >
        <Icon size={36} strokeWidth={2.6} />
      </span>
      <p className="text-[18px] font-extrabold" style={{ color: INK }}>{title}</p>
      {text && <p className="text-[14px] font-bold mt-1.5 max-w-xs" style={{ color: 'rgba(27,42,27,0.5)' }}>{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Ошибка ─────────────────────────────────────────────────────────────── */
export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      hue="coral"
      title="Не получилось загрузить"
      text={message}
      action={onRetry ? <Button hue="sky" onClick={onRetry}>Попробовать снова</Button> : null}
    />
  );
}

/* ── Модалка ────────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(27,42,27,0.45)' }}
        onClick={onClose}
        aria-label="Закрыть"
        tabIndex={-1}
      />
      <div className="kid-card relative w-full max-w-md p-6 animate-scale-in">
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-[22px] font-extrabold leading-tight" style={{ color: INK }}>{title}</h3>
          <button
            onClick={onClose}
            className="kid-press w-9 h-9 grid place-items-center shrink-0"
            style={{ background: HUE.slate, border: `2.5px solid ${INK}`, borderRadius: 12, color: INK }}
            aria-label="Закрыть"
          >
            <X size={17} strokeWidth={3} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
