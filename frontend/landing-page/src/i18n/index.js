import { useLocation } from 'react-router-dom';
import ru from './ru.js';
import uz from './uz.js';

/**
 * Язык живёт в URL, а не в состоянии: русский — на своих исходных адресах
 * (`/landing/...`), узбекский — с префиксом (`/uz/landing/...`).
 *
 * Почему так, а не переключатель в localStorage: у каждой языковой версии должен быть
 * собственный адрес, иначе Google не сможет её проиндексировать, а hreflang — связать
 * версии между собой. Русские URL при этом остались неизменными — они уже поданы в
 * Search Console, менять их нельзя.
 */
export const LANGS = ['ru', 'uz'];
export const DEFAULT_LANG = 'ru';

const DICTS = { ru, uz };

/** Язык текущего маршрута. */
export function langOf(pathname) {
  return pathname === '/uz' || pathname.startsWith('/uz/') ? 'uz' : 'ru';
}

export function useLang() {
  return langOf(useLocation().pathname);
}

/** Словарь текущего языка. */
export function useT() {
  return DICTS[useLang()];
}

/** Канонический путь (`/landing/finance`) → путь на нужном языке. */
export function localizePath(path, lang) {
  return lang === 'uz' ? `/uz${path}` : path;
}

/** Локализатор для ссылок внутри компонентов: <Link to={lp('/landing/contacts')}>. */
export function useLocalizePath() {
  const lang = useLang();
  return (path) => localizePath(path, lang);
}

/** Локализованный путь (`/uz/landing/finance`) → канонический (`/landing/finance`). */
export function canonicalPath(pathname) {
  return langOf(pathname) === 'uz' ? pathname.slice(3) || '/landing' : pathname;
}
