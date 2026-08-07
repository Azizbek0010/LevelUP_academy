import { useI18n, LANGS } from '../i18n.jsx';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          title={l.label}
          className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
            lang === l.code
              ? 'bg-primary text-primary-content shadow'
              : 'text-neutral-content/50 hover:text-neutral-content'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
