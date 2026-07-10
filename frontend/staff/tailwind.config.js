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
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
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
    ],
  },
};
