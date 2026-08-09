import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/* Переключатель светлой/тёмной темы.
 *
 * Источник правды — атрибут data-theme на <html>. Его же в самом начале
 * выставляет инлайн-скрипт в index.html (по localStorage / системной теме),
 * поэтому здесь мы читаем текущее значение из DOM, а не заводим отдельное
 * состояние-дубль, которое разошлось бы с уже применённой темой.
 *
 * Тёмная тема реализована переменными темы DaisyUI (tailwind.config.js) —
 * никаких !important-слоёв. В этой панели своих :root-токенов нет, поэтому
 * классы кнопки используют базовые токены DaisyUI (base-content/base-200),
 * которые сами меняются вместе с темой.
 */
const LIGHT = 'levelup';
const DARK = 'levelup-dark';

function readTheme() {
  return document.documentElement.getAttribute('data-theme') === DARK ? DARK : LIGHT;
}

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lu-theme', theme);
    } catch (e) {
      /* приватный режим / заблокированное хранилище — тема всё равно применится,
         просто не переживёт перезагрузку */
    }
  }, [theme]);

  const isDark = theme === DARK;
  const toggle = () => setTheme((t) => (t === DARK ? LIGHT : DARK));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className={`w-10 h-10 rounded-full grid place-items-center text-base-content/70 hover:bg-base-200 transition-colors ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
