import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './i18n/ru.js';
import uz from './i18n/uz.js';
import en from './i18n/en.js';

const resources = {
  ru: { common: ru },
  uz: { common: uz },
  en: { common: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uz',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources,
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18n;