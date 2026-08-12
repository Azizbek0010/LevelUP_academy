import { createContext, useContext, useMemo, useState } from 'react';
import ru from './i18n/ru.js';
import uz from './i18n/uz.js';
import en from './i18n/en.js';

/**
 * Лёгкий i18n для панели родителя/ученика.
 *
 * Язык — настройка кабинета (а не URL, как на лендинге): личный кабинет не
 * индексируется поисковиками, поэтому храним выбор в localStorage.
 *
 * Переводы — плоские ключи `page.key`, подстановка через `{param}`.
 * Недостающий ключ отдаёт русский, а если нет и его — сам ключ.
 */

export const LANGS = [
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'en', label: 'English', short: 'EN' },
];

const DICTS = { ru, uz, en };
export const DEFAULT_LANG = 'ru';
const STORAGE_KEY = 'levelup_member_lang';

function loadLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DICTS[stored]) return stored;
  } catch {
    /* localStorage недоступен — молча берём дефолт */
  }
  return DEFAULT_LANG;
}

/** Текущий язык для не-хуков (format.js и т.п.). Модульная переменная + реакт-состояние. */
let currentLang = loadLang();
export function getLang() {
  return currentLang;
}
export function setLang(lang) {
  if (!DICTS[lang]) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  } catch {
    /* noop */
  }
}

function translate(key, params, dict) {
  let value = dict[key];
  if (value === undefined) value = DICTS[DEFAULT_LANG][key];
  if (value === undefined) return key;
  let out = String(value);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replaceAll(`{${k}}`, String(v ?? ''));
    }
  }
  return out;
}

/** Перевод без React — для сервисных модулей (format.js). */
export function t(key, params) {
  return translate(key, params, DICTS[currentLang]);
}

const I18nContext = createContext({ lang: DEFAULT_LANG, setLang: () => {}, t: () => '' });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(loadLang);

  const value = useMemo(() => {
    const dict = DICTS[lang] || DICTS[DEFAULT_LANG];
    return {
      lang,
      setLang: (next) => {
        setLang(next);
        setLangState(next);
      },
      t: (key, params) => translate(key, params, dict),
      dict,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
