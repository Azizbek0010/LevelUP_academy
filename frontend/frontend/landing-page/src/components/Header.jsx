import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const links = [
  { to: '/landing/features', label: 'Возможности' },
  { to: '/landing/roles', label: 'Роли' },
  { to: '/landing/finance', label: 'Финансы' },
  { to: '/landing/gamification', label: 'Мотивация' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        <div className="container header__inner">
          <Link to="/landing" className="header__logo" onClick={close}>
            <img src="/logo-mark.svg" alt="LevelUp Academy" />
            LevelUp Academy
          </Link>

          {/* Десктоп-навигация */}
          <nav className="nav">
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
          <Link to="/landing/contacts" className="btn btn--dark header__cta">
            Войти
          </Link>

          {/* Мобильный бургер */}
          <button
            className={`burger${open ? ' burger--open' : ''}`}
            aria-label="Меню"
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
          <img src="/logo-mark.svg" alt="" />
          <span>LevelUp Academy</span>
        </div>
        <nav className="drawer__nav">
          <NavLink to="/landing" end onClick={close}>
            Главная
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
          <NavLink to="/landing/contacts" onClick={close}>
            Контакты
          </NavLink>
        </nav>
        <Link
          to="/landing/contacts"
          className="btn btn--accent drawer__cta"
          onClick={close}
        >
          Войти
        </Link>
      </aside>
    </>
  );
}
