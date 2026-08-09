import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Inbox, AlertTriangle, Flame, Sparkles, UploadCloud, Paperclip } from 'lucide-react';
import { fmtFileSize } from '../format.js';
import { useI18n } from '../../i18n/index.jsx';

/**
 * UI-кит кабинета ученика (7-15 лет).
 *
 * 2026-08-01, версия 2 — версия 1 («Adventure Camp»: золото, маскот-смайлик,
 * объёмные игровые кнопки, сплошные цветные значки-«стикеры») отклонена
 * прямым фидбеком Karis: выглядело слишком по-детски/AI-сгенерированно,
 * серьёзности не было. Правки по конкретным пунктам:
 *   · маскот убран целиком (не понравился конкретный скриншот с ним)
 *   · палитра — приглушённый лайм (не неон), тона глубже/спокойнее
 *   · значки категорий — тонированный фон + цветная иконка (стиль Apple
 *     Health), а не сплошная плашка с бликом и «игровой» тенью
 *   · скругления заметно меньше везде (карточки/кнопки/значки)
 *   · кнопки — Apple-нажатие (scale 0.97 на :active), без «проседающей»
 *     3D-тени как в играх
 *   · вход карточек — чистый ease-out без пружинного нахлёста
 *
 * Экспортируемые имена и props оставлены как раньше (C, HUES, IconTile,
 * Ring, Button, Pill, Tabs, Skeleton, RowSkeleton, EmptyState, ErrorState,
 * Avatar, PageHeader, Panel, Modal, StreakFlame, LevelBar, levelFromCoins,
 * CountUp, ConfettiBurst, SurpriseCard) — их дёргают все страницы кабинета.
 * Убран только Mascot (по прямому запросу, использований больше нет).
 */

export const C = {
  bg: '#F6F8F3',
  card: '#FFFFFF',
  text: '#1C231A',
  muted: '#707F68',
  line: '#E4EAE0',
  lime: '#5FA33C',    // средний зелёный — ближе к бренду LevelUp (#C6FF34), не неон
  limeDk: '#3E6E26',  // тёмный вариант для акцентов
  limeSoft: '#EDF5E1',// светло-зелёная подложка карточек/активных вкладок
  limeLine: '#D7E7C2',// зелёная окантовка карточек
  ink: '#12190E',
  violet: '#6E62A6',
  blue: '#3E7CAE',
  coral: '#BD5B45',
  amber: '#B9832E',
  teal: '#2E8F76',
  pink: '#AD5A78',

  // ── Семантическая тройка: цвет = значение с одного взгляда ──
  action: '#5FA33C', // действие — кнопки, активное меню (= lime)
  learn: '#6E62A6',  // учёба — уроки, тесты, задания, видео (= violet)
  warn: '#B9832E',   // внимание — оплата, сроки: мягкий янтарь, без красного (= amber)
};

/* Цвета категорий — чтобы разделы и типы заданий различались с одного взгляда */
export const HUES = {
  lime: C.lime,
  violet: C.violet,
  blue: C.blue,
  coral: C.coral,
  amber: C.amber,
  teal: C.teal,
  pink: C.pink,
};

/* ── Значок категории — тонированный фон + цветная иконка ────────────────
   Раньше был сплошной цветной блок с бликом и цветной тенью ("стикер") —
   слишком по-детски. Теперь как в Apple Health/Notion: лёгкая тонировка
   цвета на фоне, сама иконка — в цвете, без заливки. Серьёзнее, но цвет
   категории всё ещё считывается мгновенно. */
export function IconTile({ icon: Icon, hue = 'violet', size = 56, radius, className = '' }) {
  const fill = HUES[hue] ?? C.violet;
  return (
    <span
      className={`shrink-0 grid place-items-center transition-transform duration-150 ${className}`}
      style={{
        width: size,
        height: size,
        background: `${fill}1c`,
        borderRadius: radius ?? Math.round(size * 0.26),
      }}
    >
      <Icon size={Math.round(size * 0.46)} strokeWidth={2.2} color={fill} />
    </span>
  );
}

/* ── Кольцо прогресса (percent+children) — как в Apple Fitness/Activity ── */
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

/* ── Кнопка — Apple-нажатие: scale(0.97) на :active, мягкая тень.
   Раньше — «проседающая» 3D-тень как в играх; убрано по фидбеку. */
const BSIZE = {
  sm: 'px-4 py-2 text-[13.5px] rounded-xl',
  md: 'px-5 py-2.5 text-[14.5px] rounded-xl',
  lg: 'px-7 py-3.5 text-[16px] rounded-2xl',
};

export function Button({ hue = 'lime', size = 'md', className = '', disabled, children, ...props }) {
  const fill = disabled ? C.line : HUES[hue] ?? C.lime;
  const fg = disabled ? C.muted : '#fff';
  return (
    <button
      {...props}
      disabled={disabled}
      className={`k-press inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap disabled:cursor-not-allowed ${BSIZE[size] ?? BSIZE.md} ${className}`}
      style={{
        background: fill,
        color: fg,
        boxShadow: disabled ? 'none' : `0 1px 2px rgba(18,25,14,0.08), 0 4px 12px ${fill}3d`,
      }}
    >
      {children}
    </button>
  );
}

/* ── Заголовок страницы — крупный, с цветной иконкой раздела ──
   Иконка = ребёнок узнаёт раздел по картинке, не читая название. */
export function PageHeader({ title, subtitle, actions, icon: Icon, hue = 'violet' }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && <IconTile icon={Icon} hue={hue} size={50} />}
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-[31px] font-extrabold leading-[1.1] tracking-[-0.02em]" style={{ color: C.text }}>
            {title}
          </h1>
          {subtitle && <p className="text-[15px] mt-1 font-semibold" style={{ color: C.muted }}>{subtitle}</p>}
          {/* Зелёная линия-акцент под заголовком — фирменный цвет LevelUp
              присутствует на каждой странице, не только в шапке. */}
          <span className="block w-14 h-[3px] rounded-full mt-2.5" style={{ background: C.lime }} aria-hidden="true" />
        </div>
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
      className="rounded-full grid place-items-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42, background: C.lime, color: '#fff' }}
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
    lime: { bg: '#E7F0DF', fg: C.limeDk },
    teal: { bg: '#E0F1EC', fg: '#1F6552' },
    coral: { bg: '#F5E4DF', fg: '#8C4432' },
    amber: { bg: '#F3E9D8', fg: '#8A6321' },
    blue: { bg: '#E1EDF5', fg: '#2E5E85' },
    violet: { bg: '#E9E6F3', fg: '#514877' },
    pink: { bg: '#F2E3EA', fg: '#83425B' },
    muted: { bg: '#EEF1EA', fg: C.muted },
  };
  const s = map[hue] ?? map.muted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold whitespace-nowrap px-2.5 py-1 rounded-lg ${className}`}
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

/* ── Вкладки ────────────────────────────────────────────────────────── */
export function Tabs({ value, onChange, items }) {
  return (
    <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: C.bg }}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className="k-press-sm px-4 py-2 rounded-lg text-[13.5px] font-bold"
            style={on
              ? { background: C.limeSoft, color: C.limeDk, boxShadow: `0 1px 3px ${C.lime}40` }
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
        <div key={i} className="animate-pulse" style={{ height: h, background: C.line, borderRadius: 16 }} />
      ))}
    </div>
  );
}

export function RowSkeleton({ count = 3, height = 62 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse" style={{ height, background: C.line, borderRadius: 12 }} />
      ))}
    </div>
  );
}

/* ── Пустое состояние ───────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, text, action, hue = 'violet' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <IconTile icon={Icon} hue={hue} size={60} />
      <p className="text-[16px] font-extrabold mt-4" style={{ color: C.text }}>{title}</p>
      {text && <p className="text-[13.5px] font-semibold mt-1.5 max-w-xs" style={{ color: C.muted }}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={AlertTriangle}
      hue="coral"
      title={t.ui.loadFailed}
      text={message}
      action={onRetry ? <Button onClick={onRetry}>{t.ui.retry}</Button> : null}
    />
  );
}

/* ── Модалка ──────────────────────────────────────────────────────────
   Рендерится через createPortal в document.body, а не на месте вызова:
   внутри кабинета есть обёртка с CSS transform (sidebar/контент), и при
   нём position:fixed прилипает к этому контейнеру — фон модалки тогда
   не накрывает сайдбар. Portal поднимает модалку на весь экран всегда. */
export function Modal({ title, onClose, children }) {
  const { t } = useI18n();
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(18,25,14,0.4)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
        aria-label={t.ui.close}
        tabIndex={-1}
      />
      {/* k-card здесь не подходит: его фон/рамка заданы через CSS-переменные
          .kid (--k-card, --k-lime-line), а portal рендерит модалку вне .kid —
          фон стал бы прозрачным. Задаём белую карточку + зелёную окантовку
          напрямую, из палитры C. */}
      <div
        className="relative w-full max-w-md p-6 k-pop-in"
        style={{
          background: C.card,
          border: `1px solid ${C.limeLine}`,
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(18,25,14,0.04), 0 6px 16px rgba(18,25,14,0.06)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h3 className="text-[19px] font-extrabold leading-tight" style={{ color: C.text }}>{title}</h3>
          <button
            onClick={onClose}
            className="k-press-sm w-9 h-9 rounded-xl grid place-items-center shrink-0"
            style={{ background: C.bg, color: C.muted }}
            aria-label={t.ui.close}
          >
            <X size={17} strokeWidth={2.6} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Загрузка файла — drag&drop зона + клик-выбор ──────────────────────
   Раньше был голый браузерный <input type=file>, выбивался из дизайна и
   не принимал перетаскивание. Пунктирная лайм-рамка вместо оранжевой —
   в тон остальному кабинету, не копия чужого референса. */
export function Dropzone({ file, onFileChange, disabled, accept }) {
  const { t } = useI18n();
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pick = () => !disabled && inputRef.current?.click();
  const take = (files) => { const f = files?.[0]; if (f) onFileChange(f); };

  if (file) {
    return (
      <div className="k-card flex items-center gap-3 px-4 py-3">
        <IconTile icon={Paperclip} hue="lime" size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-extrabold truncate" style={{ color: C.text }}>{file.name}</div>
          <div className="text-[12px] font-semibold" style={{ color: C.muted }}>{fmtFileSize(file.size)}</div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="k-press-sm shrink-0 w-8 h-8 rounded-full grid place-items-center"
            style={{ background: C.bg, color: C.muted }}
            aria-label={t.ui.removeFile}
          >
            <X size={15} strokeWidth={2.8} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick(); }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!disabled) take(e.dataTransfer.files); }}
      className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed transition-colors px-5 py-8 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      style={{ borderColor: dragOver ? C.lime : C.line, background: dragOver ? `${C.lime}14` : C.bg }}
    >
      <IconTile icon={UploadCloud} hue="lime" size={48} />
      <p className="text-[13.5px] font-bold mt-3" style={{ color: C.text }}>
        {t.ui.dropTitle} <span style={{ color: C.limeDk }}>{t.ui.dropChoose}</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => take(e.target.files)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Геймификация — только честные данные (реальные coins/рейтинг/группы)
   или явно подписанные локальные механики. Ничего не выдумываем как
   "настоящее", если бэкенд этого не считает.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Streak — визиты подряд. Считается ЛОКАЛЬНО на устройстве
   (useDailyStreak), поэтому подпись честно говорит "на этом устройстве" —
   это НЕ синхронизированное с сервером достижение. */
export function StreakFlame({ days, hue = 'coral' }) {
  const { t } = useI18n();
  const fill = HUES[hue] ?? C.coral;
  const lit = days > 0;
  return (
    <span
      className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full"
      style={{ background: 'rgba(0,0,0,0.2)' }}
      title={t.ui.streakTitle(days)}
    >
      <span className="w-7 h-7 rounded-full grid place-items-center shrink-0" style={{ background: lit ? `${fill}40` : 'transparent' }}>
        <Flame size={14} strokeWidth={2.4} color={lit ? fill : 'rgba(255,255,255,0.5)'} fill={lit ? fill : 'transparent'} />
      </span>
      <span className="k-num text-[15px]" style={{ color: lit ? '#fff' : 'rgba(255,255,255,0.5)' }}>{days}</span>
    </span>
  );
}

/* ── LevelBar — уровень и прогресс, посчитанные из НАСТОЯЩИХ coins.
   level = 1 + floor(coins/100); прогресс = остаток до следующего уровня.
   Формула — просто способ показать реальное число, не выдумка. */
export function levelFromCoins(coins) {
  const c = Math.max(0, Number(coins) || 0);
  const level = 1 + Math.floor(c / 100);
  const progress = (c % 100) / 100;
  return { level, progress, toNext: 100 - (c % 100) };
}

export function LevelBar({ level, progress, hue = 'lime', size = 'md' }) {
  const fill = HUES[hue] ?? C.lime;
  const h = size === 'lg' ? 10 : 7;
  return (
    <div className="flex items-center gap-3 w-full">
      <span
        className="shrink-0 grid place-items-center rounded-lg k-num text-[12px]"
        style={{ width: 28, height: 28, background: `${fill}1c`, color: fill }}
      >
        {level}
      </span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: h, background: C.line }}>
        <div
          className="h-full rounded-full k-levelbar-fill"
          style={{ width: `${Math.round(progress * 100)}%`, background: fill }}
        />
      </div>
    </div>
  );
}

/* ── CountUp — число "докручивается" до значения вместо мгновенной смены.
   Уважает prefers-reduced-motion (тогда просто показывает целевое число). */
export function CountUp({ value, duration = 600, className = '', style }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const reduceMotion = useRef(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const from = prev.current;
    const to = Number(value) || 0;
    prev.current = to;
    if (reduceMotion.current || from === to) { setDisplay(to); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={`k-num tabular-nums ${className}`} style={style}>{display.toLocaleString('ru-RU')}</span>;
}

/* ── ConfettiBurst — короткий, сдержанный залп при смене `fireKey`.
   Немного частиц, приглушённые цвета — подтверждение момента, не шоу.
   Под prefers-reduced-motion ничего не рендерит. */
const CONFETTI_COLORS = [C.lime, C.blue, C.amber, C.teal];
export function ConfettiBurst({ fireKey }) {
  const [pieces, setPieces] = useState([]);
  const prevKey = useRef(fireKey);

  useEffect(() => {
    if (fireKey === prevKey.current || !fireKey) return;
    prevKey.current = fireKey;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const next = Array.from({ length: 10 }, (_, i) => ({
      id: `${fireKey}-${i}`,
      left: 45 + (Math.random() - 0.5) * 50,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.round(Math.random() * 360),
      delay: Math.random() * 100,
      drift: Math.round((Math.random() - 0.5) * 100),
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 850);
    return () => clearTimeout(t);
  }, [fireKey]);

  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="k-confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── SurpriseCard — факт дня: переворот по тапу, меняется раз в день
   (по дню года), не при каждом заходе — даёт причину вернуться завтра,
   ничего не обещая про награду. Спокойная тонировка вместо яркого градиента.
   Факты — из словаря (ui.facts), чтобы меняться вместе с языком. */
export function SurpriseCard() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const facts = t.ui.facts ?? [];
  const dayIndex = facts.length ? Math.floor(Date.now() / 86400000) % facts.length : 0;
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="k-card k-press w-full text-left p-4 flex items-center gap-4"
      style={{ background: open ? `${C.violet}0f` : C.card }}
    >
      <IconTile icon={Sparkles} hue="violet" size={44} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.muted }}>
          {t.ui.factOfDay}
        </div>
        <div className="text-[14px] font-semibold mt-1 leading-snug" style={{ color: C.text }}>
          {open ? facts[dayIndex] : t.ui.tapToKnow}
        </div>
      </div>
    </button>
  );
}
