/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: '#16210f', // тёмный графит-зелёный сайдбар (как в макете)
        limebrand: '#C6FF34',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    // Две темы: светлая `levelup` (по умолчанию) и тёмная `levelup-dark`.
    // Переключаются через data-theme на <html> (см. ThemeToggle + анти-FOUC
    // скрипт в index.html). Тёмная сделана переменными темы DaisyUI — БЕЗ
    // !important. Фирменный лаймовый акцент (primary/accent + тёмный сайдбар)
    // сохранён в обеих темах; в тёмной меняются только нейтрали и статусы.
    darkTheme: 'levelup-dark',
    themes: [
      {
        levelup: {
          primary: '#C6FF34',
          'primary-content': '#16210f',
          secondary: '#16210f',
          'secondary-content': '#ffffff',
          accent: '#a3e635',
          'accent-content': '#16210f',
          neutral: '#16210f',
          'neutral-content': '#e8f0df',
          'base-100': '#ffffff',
          'base-200': '#f5f8f1',
          'base-300': '#e7eede',
          'base-content': '#1D2417',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.6rem',
        },
      },
      {
        'levelup-dark': {
          // Бренд без изменений: неоновый лайм остаётся акцентом, тёмный
          // графит-зелёный — сайдбаром. Лайм с тёмным текстом (primary-content)
          // читается и на тёмном фоне, поэтому кнопки/бейджи не трогаем.
          primary: '#C6FF34',
          'primary-content': '#16210f',
          secondary: '#16210f',
          'secondary-content': '#ffffff',
          accent: '#a3e635',
          'accent-content': '#16210f',
          neutral: '#16210f',
          'neutral-content': '#e8f0df',
          // Тёплые угольные нейтрали (палитра «Iliq + Yashil», как в staff):
          // base-100 — поверхность карточек, base-200 — фон страницы (темнее),
          // base-300 — границы/hover.
          'base-100': '#1E1D17',
          'base-200': '#141410',
          'base-300': '#2E2B22',
          'base-content': '#EDEBE2',
          // Статусы подсветлены, чтобы читаться на тёмном фоне.
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
