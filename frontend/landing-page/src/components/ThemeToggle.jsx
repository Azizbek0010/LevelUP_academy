import { useState, useEffect } from 'react';

/* Переключатель светлой/тёмной темы для лендинга.
 *
 * Лендинг рендерится на сервере (entry-server.jsx), поэтому:
 *  - источник правды — атрибут data-theme на <html>, который ещё до гидрации
 *    выставляет инлайн-скрипт в index.html (по localStorage / системной теме);
 *  - на сервере document нет, поэтому начальное состояние — светлая тема, а
 *    реальное значение читается из DOM уже после монтирования (флаг mounted),
 *    чтобы не ловить hydration mismatch на иконке.
 *
 * Тёмная тема реализована переменными в src/index.css
 * (:root[data-theme='dark']) — никакого !important.
 */
const DARK = 'dark';
const LIGHT = 'light';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(LIGHT);
  const [mounted, setMounted] = useState(false);

  // После монтирования читаем тему, которую уже применил анти-FOUC скрипт.
  useEffect(() => {
    const cur =
      document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
    setTheme(cur);
    setMounted(true);
  }, []);

  // Применяем и запоминаем только при реальном переключении пользователем.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lu-theme', theme);
    } catch (e) {
      /* приватный режим — тема применится, но не переживёт перезагрузку */
    }
  }, [theme, mounted]);

  const isDark = theme === DARK;
  const toggle = () => setTheme((t) => (t === DARK ? LIGHT : DARK));

  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle ${className}`}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {mounted && isDark ? (
        /* солнце */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        /* луна */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
