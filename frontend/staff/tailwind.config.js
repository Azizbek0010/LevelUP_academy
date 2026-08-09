/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: '#16210f',
        limebrand: '#C6FF34',
        // По коду панелей давно ходят `text-danger`, `bg-danger/15`,
        // `border-danger/30` — но такого цвета в конфиге не было, и Tailwind
        // молча выбрасывал эти классы: статус «не пришёл» рисовался без
        // красного. Определяем цвет, чтобы классы наконец работали.
        danger: '#dc2626',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    // Две темы: светлая `levelup` (по умолчанию) и тёмная `levelup-dark`.
    // Переключаются через data-theme на <html> (см. ThemeToggle + скрипт в
    // index.html). Тёмная сделана переменными темы DaisyUI — БЕЗ !important-
    // патчей, как и требует комментарий в src/index.css.
    darkTheme: 'levelup-dark',
    themes: [
      {
        levelup: {
          // Спокойный лесной зелёный: контраст с белым 4.6:1 (WCAG AA для
          // обычного текста). Неоновый лайм #C6FF34 остался ТОЛЬКО брендовым
          // акцентом на тёмном сайдбаре (colors.limebrand) — как заливка
          // кнопок он давал 1.3:1 и был нечитаем.
          primary: '#40833B',
          'primary-content': '#ffffff',
          secondary: '#16210f',
          'secondary-content': '#ffffff',
          accent: '#40833B',
          'accent-content': '#ffffff',
          neutral: '#16210f',
          'neutral-content': '#e8f0df',
          'base-100': '#ffffff',
          'base-200': '#f5f8f1',
          'base-300': '#e7eede',
          'base-content': '#1D2417',
          info: '#2563eb',
          success: '#15803d',
          warning: '#b45309',
          error: '#dc2626',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.6rem',
        },
      },
      {
        'levelup-dark': {
          // Палитра «Iliq + Yashil»: тёплые угольные нейтрали (не чистый чёрный)
          // + фирменный зелёный, подсветлённый до #5CA855 для контраста на
          //  тёмном фоне (текст-primary читается; кнопка primary — тёмный текст).
          primary: '#5CA855',
          'primary-content': '#08140A',
          secondary: '#16210f',
          'secondary-content': '#e8f0df',
          accent: '#5CA855',
          'accent-content': '#08140A',
          neutral: '#0f1a0a',
          'neutral-content': '#e8f0df',
          // base-100 — поверхность карточек (светлее фона, чтобы «всплывали»);
          // base-200 — фон страницы (самый тёмный); base-300 — границы/hover.
          'base-100': '#1E1D17',
          'base-200': '#141410',
          'base-300': '#2E2B22',
          'base-content': '#EDEBE2',
          info: '#5B8DEF',
          success: '#4ADE80',
          warning: '#FBBF24',
          error: '#F87171',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.6rem',
        },
      },
    ],
  },
};
