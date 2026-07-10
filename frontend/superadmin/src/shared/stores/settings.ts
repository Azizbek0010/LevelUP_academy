import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Lang = 'ru' | 'uz' | 'en';

interface SettingsState {
  theme: ThemeMode;
  lang: Lang;
  setTheme: (t: ThemeMode) => void;
  setLang: (l: Lang) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      lang: 'ru',
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
    }),
    { name: 'educrm-settings' },
  ),
);

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: ThemeMode): void {
  const resolved =
    theme === 'system'
      ? systemPrefersDark()
        ? 'levelup-dark'
        : 'levelup'
      : theme === 'dark'
        ? 'levelup-dark'
        : 'levelup';
  document.documentElement.setAttribute('data-theme', resolved);
}

/** Wire the OS theme change listener when in system mode. Returns cleanup. */
export function watchSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange();
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
