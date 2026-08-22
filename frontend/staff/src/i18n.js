import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './ru.js';
import uz from './uz.js';
import en from './en.js';
import { DICT as finance } from './pages/finance/_i18n.jsx';

const resources = {
  ru: { common: { ...ru, ...(finance?.ru || {}) } },
  uz: { common: { ...uz, ...(finance?.uz || {}) } },
  en: { common: { ...en, ...(finance?.en || {}) } },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru', 'en'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    resources,
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18n;

