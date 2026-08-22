import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LANGS, canonicalPath, dictOf, localizePath, useLang, useLocalizePath, useT } from '../i18n/index.js';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const close = () => setOpen(false);
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const { pathname } = useLocation();

  const links = [
    { to: lp('/landing/features'), label: t.nav.features },
    { to: lp('/landing/roles'), label: t.nav.roles },
    { to: lp('/landing/finance'), label: t.nav.finance },
    { to: lp('/landing/pricing'), label: t.nav.pricing },
    { to: lp('/landing/gamification'), label: t.nav.gamification },
  ];

  // Переключатель ведёт на ЭТУ ЖЕ страницу на другом языке, а не на главную:
  // сбрасывать пользователя на главную при смене языка — потеря контекста.
  //
  // Языков больше двух, поэтому это список, а не тумблер. Каждый вариант — обычная
  // <a> с hrefLang: перекрёстные ссылки между версиями сами по себе сигнал для
  // краулера, что версии связаны, и работают они без JavaScript.
  const canonical = canonicalPath(pathname);
  const otherLangs = LANGS.filter((l) => l !== lang);

  const LangSwitch = ({ className = '' }) => (
    <span className={`lang-switch ${className}`}>
      {otherLangs.map((l) => (
        <Link
          key={l}
          to={localizePath(canonical, l)}
          hrefLang={l}
          aria-label={dictOf(l).lang.label}
          onClick={close}
        >
          {dictOf(l).lang.label}
        </Link>
      ))}
    </span>
  );

  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link to={lp('/landing')} className="header__logo" onClick={close}>
            <img src="/logo-mark.svg" alt="LevelUp Academy" width="30" height="30" />
            LevelUp Academy
          </Link>

          {/* Десктоп-навигация */}
          <nav className="nav" aria-label={t.nav.primaryLabel}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <LangSwitch />

          <Link to={lp('/landing/contacts')} className="btn btn--dark header__cta">
            {t.nav.login}
          </Link>

          {/* Пользовательский профиль (выпадающее меню) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Меню аккаунта"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--gray-100)] transition-colors"
            >
              <img
                src="/avatar.svg"
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <svg
                className="w-4 h-4 text-[var(--gray-500)] transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 5a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V5zm3 4a1 1 0 000 2h3a1 1 0 000-2v-3a1 1 0 000-2h-3a1 1 0 000 2zm4-6a1 1 0 011 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 01-1-1zm1.5 7.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </button>

            {/* Меню аккаунта */}
            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
              >
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Профиль
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Выйти
                </a>
              </div>
            )}
          </div>

          {/* Мобильный бургер */}
          <button
            className={`burger${open ? ' burger--open' : ''}`}
            aria-label={t.nav.menu}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Мобильный sidebar — ВНЕ header: backdrop-filter хедера ломает
          position:fixed у потомков */}
      <div
        className={`drawer-overlay${open ? ' drawer-overlay--show' : ''}`}
        onClick={close}
      />
      <aside className={`drawer${open ? ' drawer--open' : ''}`}>
        <div className="drawer__head">
          <img src="/logo-mark.svg" alt="" width="28" height="28" />
          <span>LevelUp Academy</span>
        </div>
        <nav className="drawer__nav" aria-label={t.nav.mobileLabel}>
          <NavLink to={lp('/landing')} end onClick={close}>
            {t.nav.home}
          </NavLink>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={close}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink to={lp('/landing/contacts')} onClick={close}>
            {t.nav.contacts}
          </NavLink>
          <LangSwitch className="drawer__lang" />
        </nav>
        <Link
          to={lp('/landing/contacts')}
          className="btn btn--accent drawer__cta"
          onClick={close}
        >
          {t.nav.login}
        </Link>
      </aside>
    </>
  );
}
