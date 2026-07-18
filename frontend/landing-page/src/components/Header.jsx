import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { canonicalPath, localizePath, useLang, useLocalizePath, useT } from '../i18n/index.js';

export default function Header() {
  const [open, setOpen] = useState(false);
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
  const otherLang = lang === 'ru' ? 'uz' : 'ru';
  const switchHref = localizePath(canonicalPath(pathname), otherLang);

  const LangSwitch = ({ className = '' }) => (
    <Link
      to={switchHref}
      className={`lang-switch ${className}`}
      hrefLang={otherLang}
      aria-label={t.lang.switchTo}
      onClick={close}
    >
      {t.lang.switchTo}
    </Link>
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
