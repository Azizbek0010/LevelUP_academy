import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icons.jsx';

const NAV = [
  { to: '/dashboard', label: 'Обзор', icon: 'home' },
  { to: '/attendance', label: 'Посещаемость', icon: 'calendar-check' },
  { to: '/grades', label: 'Оценки', icon: 'academic' },
  { to: '/debt', label: 'Оплата', icon: 'wallet' },
  { to: '/chat', label: 'Чат', icon: 'chat' },
];

function ChildSwitcher({ childList, selectedChild, selectChild }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (childList.length <= 1) {
    if (!selectedChild) return null;
    return (
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
          <Avatar name={`${selectedChild.firstName} ${selectedChild.lastName}`} size={34} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{selectedChild.firstName}</p>
            <p className="text-[11px] opacity-40 flex items-center gap-1">
              <Icon name="user" className="w-3 h-3" />
              Ребёнок
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3 relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
      >
        <div className="relative">
          <Avatar name={`${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`} size={34} />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-sidebar" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold truncate">{selectedChild?.firstName} {selectedChild?.lastName}</p>
          <p className="text-[11px] opacity-40">{childList.length} ребёнка</p>
        </div>
        <Icon name="chevron-down" className={`w-4 h-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-4 right-4 mt-1 bg-sidebar border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {childList.map((child) => {
            const isActive = selectedChild?.id === child.id;
            return (
              <button
                key={child.id}
                onClick={() => { selectChild(child.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 ${
                  isActive ? 'bg-primary/15' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Avatar name={`${child.firstName} ${child.lastName}`} size={30} />
                  {isActive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-sidebar" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm ${isActive ? 'font-bold text-primary' : 'font-medium'}`}>
                    {child.firstName} {child.lastName}
                  </p>
                </div>
                {isActive && (
                  <Icon name="check" className="w-4 h-4 text-primary" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
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
      <div className="px-5 pt-6 pb-4">
        <img src="/logo-white.svg" alt="LevelUp" className="h-7 w-auto" />
      </div>

      <ChildSwitcher
        childList={childList}
        selectedChild={selectedChild}
        selectChild={selectChild}
      />

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-content font-bold shadow-lg shadow-primary/20'
                  : 'text-neutral-content/50 hover:bg-white/5 hover:text-neutral-content'
              }`
            }
          >
            <Icon name={item.icon} className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3 border-t border-white/5">
        <NavLink
          to="/notifications"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-1 ${
              isActive
                ? 'bg-primary text-primary-content font-bold shadow-lg shadow-primary/20'
                : 'text-neutral-content/50 hover:bg-white/5 hover:text-neutral-content'
            }`
          }
        >
          <Icon name="bell" className="w-5 h-5 shrink-0" />
          <span>Уведомления</span>
        </NavLink>

        <NavLink
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 p-2 -mx-1 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="relative">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size={36} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[11px] opacity-40 flex items-center gap-1">
              Профиль
              <Icon name="chevron-right" className="w-3 h-3" />
            </p>
          </div>
        </NavLink>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-base-200">
      <aside className="hidden lg:flex w-64 shrink-0">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="btn btn-ghost btn-sm btn-circle">
              <Icon name="bars-3" className="w-5 h-5" />
            </button>
            <img src="/logo-white.svg" alt="LevelUp" className="h-5 w-auto" />
          </div>
          <NavLink to="/notifications" className="btn btn-ghost btn-sm btn-circle relative">
            <Icon name="bell" className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </NavLink>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
