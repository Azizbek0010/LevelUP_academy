import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // admin_page uses Tailwind v4 via @tailwindcss/vite plugin.
  // Local postcss.config.js overrides parent staff/ config (Tailwind v3 + PostCSS).
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
