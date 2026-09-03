/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // '@fontsource-variable/manrope' регистрирует семейство как
        // 'Manrope Variable' — без него в списке шрифт не подхватывался и
        // весь кабинет рендерился системным (2026-08-30, Abduloh).
        sans: ['Manrope Variable', 'Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        sidebar: '#16210f',
        limebrand: '#C6FF34',
        danger: '#dc2626',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        levelup: {
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
