/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Палитра бренда — источник правды: frontend/logos/README.md.
        // Раньше sidebar/limebrand были случайными хексами, набранными на глаз
        // ("тёмный графит-зелёный, как в макете") — теперь это ровно те же
        // токены, что в фирменных логотипах, а не ещё один похожий оттенок.
        sidebar: '#1D2417', // Ink
        limebrand: '#C6FF34', // Lime
        ink: '#1D2417',
        paper: '#F6FBEA',
        muted: '#5E6E52',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        levelup: {
          primary: '#C6FF34',
          'primary-content': '#1D2417',
          secondary: '#1D2417',
          'secondary-content': '#ffffff',
          accent: '#a3e635',
          'accent-content': '#1D2417',
          neutral: '#1D2417',
          'neutral-content': '#e8f0df',
          'base-100': '#ffffff',
          'base-200': '#f5f8f1',
          'base-300': '#e7eede',
          'base-content': '#1D2417',
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          // Скругления уменьшены намеренно (11.08.2026, по прямой просьбе):
          // 1rem/0.6rem читались слишком "мягко/потребительски" для
          // финансовой admin-панели — острее углы = серьёзнее продукт.
          '--rounded-box': '0.5rem',
          '--rounded-btn': '0.375rem',
          '--rounded-badge': '0.25rem',
        },
      },
    ],
  },
};
