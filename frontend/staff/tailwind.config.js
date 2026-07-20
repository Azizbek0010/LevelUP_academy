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
    // Одна тема. Тёмной нет — см. комментарий в src/index.css.
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
    ],
  },
};
