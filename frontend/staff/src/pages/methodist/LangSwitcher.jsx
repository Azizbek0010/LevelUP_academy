import { LANGS, useLang } from './i18n.js';

export default function LangSwitcher({ className = '' }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex items-center gap-0.5 p-1 rounded-[10px] border border-[var(--mt-border)] bg-white ${className}`}
      role="group"
      aria-label="Til / Язык / Language"
    >
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`px-2.5 py-1 rounded-[7px] text-[11px] font-bold transition-all ${
              active
                ? 'bg-[var(--mt-brand)] text-[var(--mt-brand-ink)] shadow-sm'
                : 'text-[var(--mt-text-muted)] hover:text-[var(--mt-accent)]'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
