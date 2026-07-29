import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  ClipboardCheck,
  BookOpen,
  PlayCircle,
  ShoppingBag,
  Trophy,
  LogOut,
  Send,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { initials } from '../format.js';
import { Avatar } from './ui.jsx';
import { api } from '../api.js';

const NAV = [
  { to: '/student', label: 'Главная', icon: Home, end: true },
  { to: '/tests', label: 'Тесты', icon: ClipboardCheck },
  { to: '/homework', label: 'Домашки', icon: BookOpen },
  { to: '/videos', label: 'Видео', icon: PlayCircle },
  { to: '/shop', label: 'Магазин', icon: ShoppingBag },
  { to: '/leaderboard', label: 'Рейтинг', icon: Trophy },
];

/* Градиент и активные состояния — язык сайдбара staff. Лайм (limebrand) —
   брендовый акцент для тёмной поверхности: на #16210f он читается 12:1, тогда
   как лесной зелёный primary — всего ~2:1. */
const SIDEBAR_BG = 'linear-gradient(180deg, #0f1a0a 0%, #16210f 40%, #1a2912 100%)';

function DesktopNavLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] transition-all duration-200"
      style={({ isActive }) => ({
        color: isActive ? '#141B10' : 'rgba(232, 239, 226, 0.6)',
        background: isActive ? '#C6FF34' : 'transparent',
        fontWeight: isActive ? 800 : 600,
        boxShadow: isActive ? '0 4px 14px rgba(198, 255, 52, 0.35)' : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} className="shrink-0 transition-transform group-hover:scale-110" />
          <span className="flex-1">{label}</span>
          {!isActive && (
            <span
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none -z-10"
              style={{ background: 'rgba(198, 255, 52, 0.08)' }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function MobileNavLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[11px] font-bold transition-colors"
      style={({ isActive }) => ({ color: isActive ? '#C6FF34' : 'rgba(232, 239, 226, 0.5)' })}
    >
      <Icon size={22} strokeWidth={2.1} />
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  // TG-FRONT: привязка Telegram-бота (напоминания об оплате, объявления центра)
  const [tgBusy, setTgBusy] = useState(false);
  const onBindTelegram = async () => {
    setTgBusy(true);
    try {
      const res = await api.telegramBindToken();
      window.open(res.data.deepLink, '_blank', 'noopener,noreferrer');
    } catch {
      // тихо: кнопка — необязательное удобство, не блокирующий флоу
    } finally {
      setTgBusy(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full w-64 z-40 flex-col"
        style={{ background: SIDEBAR_BG, borderRight: '1px solid rgba(64, 131, 59, 0.15)', borderRadius: '0 0 16px 0' }}
      >
        <div
          className="flex items-center gap-3 px-5 h-16 shrink-0"
          style={{ borderBottom: '1px solid rgba(64, 131, 59, 0.15)' }}
        >
          <img src="/logo-white.svg" alt="LevelUp Academy" className="h-7 w-auto animate-fade-in" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {NAV.map((item) => (
            <DesktopNavLink key={item.to} {...item} />
          ))}
        </nav>

        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(64, 131, 59, 0.15)' }}
        >
          <Avatar name={name || 'С'} size="md" onDark />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold leading-tight truncate" style={{ color: 'rgba(232, 239, 226, 0.92)' }}>
              {name || 'Студент'}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(232, 239, 226, 0.45)' }}>
              Ученик
            </div>
          </div>
          <button
            onClick={onBindTelegram}
            disabled={tgBusy}
            title="Привязать Telegram"
            aria-label="Привязать Telegram"
            className="w-8 h-8 rounded-lg grid place-items-center transition-colors disabled:opacity-40"
            style={{ color: 'rgba(232, 239, 226, 0.5)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C6FF34'; e.currentTarget.style.background = 'rgba(198,255,52,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,239,226,0.5)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Send size={16} />
          </button>
          <button
            onClick={logout}
            title="Выйти"
            aria-label="Выйти"
            className="w-8 h-8 rounded-lg grid place-items-center transition-colors"
            style={{ color: 'rgba(232, 239, 226, 0.5)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e8543e'; e.currentTarget.style.background = 'rgba(232,84,62,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,239,226,0.5)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-h-screen overflow-x-hidden">
        <div className="animate-page-enter max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch h-16 px-1"
        style={{ background: SIDEBAR_BG, borderTop: '1px solid rgba(64, 131, 59, 0.15)' }}
      >
        {NAV.map((item) => (
          <MobileNavLink key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
