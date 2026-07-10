import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  ClipboardCheck,
  BookOpen,
  PlayCircle,
  ShoppingBag,
  Trophy,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { initials } from '../format.js';

const NAV = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/tests', label: 'Тесты', icon: ClipboardCheck },
  { to: '/homework', label: 'Домашки', icon: BookOpen },
  { to: '/videos', label: 'Видео', icon: PlayCircle },
  { to: '/shop', label: 'Магазин', icon: ShoppingBag },
  { to: '/leaderboard', label: 'Рейтинг', icon: Trophy },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__logo">
          <img src="/logo-mark.svg" alt="" />
          LevelUp Academy
        </div>
        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="sidebar__link">
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <div className="avatar">{initials(user?.firstName, user?.lastName)}</div>
          <div>
            <div className="sidebar__user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="sidebar__user-role">Студент</div>
          </div>
          <button className="sidebar__logout" onClick={logout} title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
