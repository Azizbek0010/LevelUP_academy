import { useRef, useEffect } from 'react';
import { Search, Inbox, X } from 'lucide-react';

/**
 * Общие кирпичики панели ментора.
 *
 * До этого файла каждая страница ментора заводила свой `StudentAvatar`, свою
 * обёртку поиска и свою «пустоту» — с разными размерами, радиусами и цветами.
 * Отличия были не задуманы, а накоплены: три страницы — три вида одного и того
 * же элемента. Здесь один источник правды.
 */

/* ── Аватар ──────────────────────────────────────────────────────────────
   Было `bg-primary/20 text-primary-content`: primary-content — БЕЛЫЙ, то есть
   белая буква на бледно-зелёной заливке (контраст ~1.3:1, инициал не читался).
   Теперь буква — сам primary на его же светлой подложке. */
export function Avatar({ name, size = 'md', onPrimary = false }) {
  const letter = (name?.trim()?.[0] || '?').toUpperCase();
  const cls = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];
  // `onPrimary` — аватар лежит на заливке primary (выделенная строка списка).
  // Без него зелёная буква на зелёном фоне сливается ровно так же, как раньше
  // сливалась белая на светло-зелёном.
  const tone = onPrimary
    ? 'bg-primary-content/20 text-primary-content'
    : 'bg-primary/15 text-primary';
  return (
    <span
      className={`${cls} ${tone} rounded-full grid place-items-center font-bold shrink-0`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/* ── Поиск ────────────────────────────────────────────────────────────── */
export function SearchInput({ value, onChange, placeholder = 'Qidirish...', className = '' }) {
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
        // text-base до sm — иначе iOS Safari зумит страницу при фокусе
        // в поле со шрифтом мельче 16px и обратно уже не отпускает.
        className="input input-bordered input-sm w-full pl-9 rounded-lg text-base sm:text-sm"
      />
    </div>
  );
}

/* ── Пустое состояние ─────────────────────────────────────────────────── */
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

/* ── Выбор группы ──────────────────────────────────────────────────────
   Один и тот же селект был скопирован в Тесты и Коины с разной разметкой. */
export function GroupSelect({ groups, value, onChange, label = "Guruh" }) {
  return (
    <label className="form-control w-full max-w-xs">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
        {label}
      </span>
      <select
        className="select select-bordered select-sm rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Guruhni tanlang</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}{g.subject ? ` — ${g.subject}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ── Карточка-панель ──────────────────────────────────────────────────── */
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

/* ── Modal (overlay + box + backdrop) ────────────────────────────────────
   Везде в админке/менторе были сырые `<dialog className="modal modal-open">`.
   Теперь одна точка сборки: открытие через `isOpen`, закрытие по X / backdrop /
   Escape (браузерный `<dialog>` сам ловит Escape, но для единообразия
   прописано и здесь). */
export function Modal({ isOpen, onClose, title, children, actions }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen) el.showModal?.(); else el.close?.();
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <dialog ref={ref} className="modal modal-open" onClose={onClose}>
      <div className="modal-box glass-strong border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-colors"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>
        {children}
        {actions && <div className="modal-action">{actions}</div>}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

/* ── Скелет строки списка ─────────────────────────────────────────────── */
export function RowSkeleton({ count = 3, height = 'h-14' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton ${height} w-full rounded-xl`} />
      ))}
    </div>
  );
}
