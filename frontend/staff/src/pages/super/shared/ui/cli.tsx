import { forwardRef, useEffect, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

// ── CliSection ─────────────────────────────────────────────────
// Небольшой заголовок группы полей: `Личное`, `Доступ`, `Безопасность`.

export function CliSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-baseline gap-2 pb-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/80">
          {label}
        </span>
        {hint && (
          <span className="text-[10px] text-base-content/40 font-mono">· {hint}</span>
        )}
      </legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

// ── CliField ───────────────────────────────────────────────────
// Строка вида:  ▸ Имя      [ Али__________ ]  · ✓ ок
//                                            (hint справа)

export interface CliFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  hintText?: ReactNode;
  hintTone?: 'ok' | 'warn' | 'error' | 'muted';
  mono?: boolean;
  required?: boolean;
}

const HINT_TONE = {
  ok: { icon: '✓', cls: 'text-success' },
  warn: { icon: '△', cls: 'text-warning' },
  error: { icon: '✕', cls: 'text-error' },
  muted: { icon: '○', cls: 'text-base-content/40' },
} as const;

export const CliField = forwardRef<HTMLInputElement, CliFieldProps>(function CliField(
  { label, hintText, hintTone = 'muted', mono, required, ...rest },
  ref,
) {
  return (
    <label className="group grid grid-cols-[14px_120px_1fr] items-center gap-x-3 gap-y-0.5 py-1 px-2 -mx-2 rounded hover:bg-base-200/40 transition-colors">
      <span className="text-base-content/30 font-mono text-sm select-none group-focus-within:text-primary">▸</span>
      <span className="text-[13px] text-base-content/70 font-medium">
        {label}
        {required && <span className="text-error/70 ml-0.5">*</span>}
      </span>
      <div className="flex items-center gap-2 min-w-0">
        <input
          ref={ref}
          className={clsx(
            'flex-1 min-w-0 bg-transparent border-0 border-b border-base-300 px-1 py-1 text-sm text-base-content outline-none',
            'focus:border-primary focus:ring-0 transition-colors',
            'placeholder:text-base-content/25',
            mono && 'font-mono',
          )}
          {...rest}
        />
        {hintText && (
          <span className={clsx('shrink-0 text-[11px] font-mono flex items-center gap-1', HINT_TONE[hintTone].cls)}>
            <span>{HINT_TONE[hintTone].icon}</span>
            <span>{hintText}</span>
          </span>
        )}
      </div>
    </label>
  );
});

// ── CliSelect ──────────────────────────────────────────────────
// Роль:  mentor · admin · superadmin  (сегментный переключатель)

export interface CliSelectOption {
  value: string;
  label: string;
}

export function CliSelect({
  label,
  options,
  value,
  onChange,
  hintText,
  hintTone = 'muted',
}: {
  label: string;
  options: CliSelectOption[];
  value: string;
  onChange: (v: string) => void;
  hintText?: ReactNode;
  hintTone?: keyof typeof HINT_TONE;
}): React.ReactElement {
  return (
    <div className="group grid grid-cols-[14px_120px_1fr] items-center gap-x-3 py-1 px-2 -mx-2 rounded hover:bg-base-200/40 transition-colors">
      <span className="text-base-content/30 font-mono text-sm select-none">▸</span>
      <span className="text-[13px] text-base-content/70 font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-0 font-mono text-[12px] p-0.5 rounded-md bg-base-200/60 border border-base-300">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={clsx(
                'px-2.5 py-0.5 rounded transition-all',
                value === opt.value
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content',
              )}
            >
              {value === opt.value && <span className="mr-0.5">▸</span>}
              {opt.label}
              {i < options.length - 1 && value !== opt.value && (
                <span className="ml-2.5 text-base-content/20">·</span>
              )}
            </button>
          ))}
        </div>
        {hintText && (
          <span className={clsx('shrink-0 text-[11px] font-mono flex items-center gap-1', HINT_TONE[hintTone].cls)}>
            <span>{HINT_TONE[hintTone].icon}</span>
            <span>{hintText}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Key hint (kbd chip) ────────────────────────────────────────

export function Key({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-base-300 bg-base-100 text-[10px] font-mono text-base-content/70 leading-none">
      {children}
    </kbd>
  );
}

// ── HintFooter ─────────────────────────────────────────────────
// Полоса подсказок: `Esc отмена · ⌘↵ сохранить · ↹ следующее поле`

export interface HintItem {
  keys: ReactNode[]; // Ключи: [<Key>Esc</Key>], [<Key>⌘</Key>,<Key>↵</Key>]
  label: string;
}

export function HintFooter({ items }: { items: HintItem[] }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 text-[11px] font-mono text-base-content/50 select-none">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-base-content/20 mr-1.5">·</span>}
          <span className="flex items-center gap-0.5">{it.keys}</span>
          <span className="ml-0.5">{it.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── useCliShortcuts ────────────────────────────────────────────
// Хук: Cmd/Ctrl + Enter → onSubmit, Esc через нативный dialog уже работает.

export function useCliShortcuts({ onSubmit, enabled }: { onSubmit: () => void; enabled: boolean }): void {
  useEffect(() => {
    if (!enabled) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onSubmit, enabled]);
}

// ── CliTextarea ────────────────────────────────────────────────

export function CliTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  maxLength,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  hint?: string;
}): React.ReactElement {
  const over = maxLength !== undefined && value.length > maxLength * 0.9;
  return (
    <label className="group grid grid-cols-[14px_120px_1fr] gap-x-3 py-1 px-2 -mx-2 rounded hover:bg-base-200/40 transition-colors">
      <span className="text-base-content/30 font-mono text-sm select-none pt-1 group-focus-within:text-primary">▸</span>
      <span className="text-[13px] text-base-content/70 font-medium pt-1">
        {label}
        {required && <span className="text-error/70 ml-0.5">*</span>}
      </span>
      <div className="min-w-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full bg-base-100 text-base-content border border-base-300 rounded-md px-2 py-1.5 text-sm outline-none font-mono resize-y focus:border-primary focus:ring-0 transition-colors placeholder:text-base-content/25"
        />
        <div className="flex items-center justify-between mt-1 text-[11px] font-mono text-base-content/40">
          <span>{hint ?? ''}</span>
          {maxLength !== undefined && (
            <span className={clsx(over ? 'text-warning' : '')}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    </label>
  );
}

// ── CliDayPicker ───────────────────────────────────────────────
// Строка дней: [Пн][Вт][Ср][Чт][Пт][Сб][Вс] — активные подсвечены.

export function CliDayPicker({
  label,
  value,
  onChange,
  options,
  required,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
}): React.ReactElement {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="group grid grid-cols-[14px_120px_1fr] items-center gap-x-3 py-1 px-2 -mx-2 rounded hover:bg-base-200/40 transition-colors">
      <span className="text-base-content/30 font-mono text-sm select-none">▸</span>
      <span className="text-[13px] text-base-content/70 font-medium">
        {label}
        {required && <span className="text-error/70 ml-0.5">*</span>}
      </span>
      <div className="flex items-center gap-1 flex-wrap font-mono text-[12px]">
        {options.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={clsx(
                'w-8 h-7 rounded border transition-all',
                active
                  ? 'bg-primary text-primary-content border-primary shadow-sm'
                  : 'border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content',
              )}
            >
              {opt.label}
            </button>
          );
        })}
        {hint && <span className="ml-2 text-[11px] text-base-content/40">· {hint}</span>}
      </div>
    </div>
  );
}

// ── CliCardChoice ──────────────────────────────────────────────
// Крупные «карточки» вариантов — для «Кому отправить», «Тип напоминания» и т.п.

export interface CliCardOption {
  value: string;
  label: string;
  hint?: string;
}

export function CliCardChoice({
  label,
  value,
  onChange,
  options,
  columns = 3,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: CliCardOption[];
  columns?: 2 | 3 | 4;
}): React.ReactElement {
  const colClass = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[columns];
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-base-content/50">
          <span className="text-base-content/30">▸</span>
          {label}
        </div>
      )}
      <div className={clsx('grid grid-cols-1 gap-1.5', colClass)}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={clsx(
                'text-left border rounded-md px-3 py-2 transition-all',
                active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-base-300 hover:border-base-content/30',
              )}
            >
              <div className="flex items-center gap-1.5 text-[13px] font-medium">
                <span className={clsx('font-mono', active ? 'text-primary' : 'text-base-content/25')}>▸</span>
                <span className={active ? 'text-primary' : ''}>{opt.label}</span>
              </div>
              {opt.hint && (
                <div className="text-[11px] text-base-content/50 mt-0.5 pl-4">{opt.hint}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CliError ───────────────────────────────────────────────────

export function CliError({ children }: { children: ReactNode }): React.ReactElement | null {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="mt-3 font-mono text-[12px] text-error border-l-2 border-error/50 pl-3 py-1 bg-error/5"
    >
      <span className="text-error/60 mr-1">✕</span>
      {children}
    </div>
  );
}

// ── Стандартный set хинтов для футера ──────────────────────────

export const STANDARD_HINTS: HintItem[] = [
  { keys: [<Key key="a">Esc</Key>], label: 'закрыть' },
  { keys: [<Key key="b">⌘</Key>, <Key key="c">↵</Key>], label: 'сохранить' },
  { keys: [<Key key="d">↹</Key>], label: 'след. поле' },
];

// ── CliPasswordField с проверкой длины ────────────────────────

export function CliPasswordField({
  label,
  value,
  onChange,
  required,
  minLength = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}): React.ReactElement {
  const [touched, setTouched] = useState(false);
  const ok = value.length >= minLength;
  const hintTone: keyof typeof HINT_TONE = value.length === 0 ? 'muted' : ok ? 'ok' : 'warn';
  const hintText = value.length === 0
    ? `мин. ${minLength} символов`
    : ok
      ? 'надёжно'
      : `${value.length}/${minLength}`;
  return (
    <CliField
      label={label}
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setTouched(true)}
      hintText={touched || value.length > 0 ? hintText : `мин. ${minLength} символов`}
      hintTone={hintTone}
      required={required}
      mono
      placeholder="••••••••"
    />
  );
}
