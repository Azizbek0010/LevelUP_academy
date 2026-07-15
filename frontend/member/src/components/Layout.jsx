import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import Avatar from './Avatar.jsx';

const NAV = [
  { to: '/dashboard', label: 'Обзор', icon: 'home' },
  { to: '/attendance', label: 'Посещаемость', icon: 'calendar' },
  { to: '/grades', label: 'Оценки', icon: 'grades' },
  { to: '/debt', label: 'Оплата', icon: 'wallet' },
  { to: '/chat', label: 'Чат', icon: 'chat' },
];

function NavIcon({ name, className = '' }) {
  const d = {
    home: 'M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    grades: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
    wallet: 'M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3',
    chat: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 20.105V4.875A1.875 1.875 0 015.625 3h12.75A1.875 1.875 0 0120.25 4.875v10.5A1.875 1.875 0 0118.375 17.25H7.5l-3.75 2.855z',
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d[name]} />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { childList, selectedChild, selectChild } = useChild();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-neutral-content">
      <div className="px-5 pt-5 pb-3">
        <img src="/logo-white.svg" alt="LevelUp" className="h-7 w-auto" />
      </div>

      {childList.length > 1 && (
        <div className="px-4 pb-2">
          <select
            className="select select-sm w-full bg-white/10 border-white/20 text-neutral-content text-sm"
            value={selectedChild?.id || ''}
            onChange={(e) => selectChild(e.target.value)}
          >
            {childList.map((c) => (
              <option key={c.id} value={c.id} className="text-base-content">
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {childList.length === 1 && selectedChild && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <Avatar name={`${selectedChild.firstName} ${selectedChild.lastName}`} size={28} />
            <span className="text-sm font-semibold truncate">
              {selectedChild.firstName} {selectedChild.lastName}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content font-semibold'
                  : 'text-neutral-content/75 hover:bg-white/10'
              }`
            }
          >
            <NavIcon name={item.icon} className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar name={`${user?.firstName} ${user?.lastName}`} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs opacity-50">Родитель</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-xs text-neutral-content/60 hover:text-error"
            title="Выйти"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-base-200">
      <aside className="hidden lg:flex w-64 shrink-0">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-sidebar text-white">
          <button onClick={() => setMobileOpen(true)} className="btn btn-ghost btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <img src="/logo-white.svg" alt="LevelUp" className="h-5 w-auto" />
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
