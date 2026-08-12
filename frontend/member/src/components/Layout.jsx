import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import { useI18n } from '../i18n.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icons.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const NAV = [
  { to: '/dashboard', label: 'nav.dashboard', icon: 'home' },
  { to: '/attendance', label: 'nav.attendance', icon: 'calendar-check' },
  { to: '/grades', label: 'nav.grades', icon: 'academic' },
  { to: '/debt', label: 'nav.debt', icon: 'wallet' },
  { to: '/chat', label: 'nav.chat', icon: 'chat' },
];

function ChildCard({ child }) {
  const { t } = useI18n();
  if (!child) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
        <Avatar name={`${child.firstName} ${child.lastName}`} size={34} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{child.firstName}</p>
          <p className="text-[11px] opacity-40 flex items-center gap-1">
            <Icon name="user" className="w-3 h-3" />
            {t('nav.child')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-neutral-content">
      <div className="px-5 pt-6 pb-4">
        <img src="/logo-white.svg" alt="LevelUp" className="h-7 w-auto" />
      </div>

      <ChildCard child={selectedChild} />

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
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3 space-y-2 border-t border-white/5 relative" ref={userMenuRef}>
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1b2612] border border-white/10 rounded-2xl shadow-xl p-3.5 z-50 animate-scale-in text-neutral-content space-y-3.5">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] opacity-50 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 uppercase tracking-wider">
                  {user?.role === 'parent' ? t('common.role.parent') : t('common.role.student')}
                </span>
              </div>
            </div>

            {/* Language Switcher inside popup */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold opacity-45 uppercase tracking-wider pl-1">
                {t('langSwitch.label') || 'Til'}
              </p>
              <LanguageSwitcher />
            </div>

            <div className="border-t border-white/5 my-1" />

            {/* Options */}
            <div className="space-y-1">
              <button
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/5 hover:text-white transition-colors text-left"
              >
                <Icon name="user" className="w-4 h-4 opacity-70 shrink-0" />
                <span>{t('prof.title') || 'Profil'}</span>
              </button>
              
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors text-left"
              >
                <Icon name="arrow-left-on-rectangle" className="w-4 h-4 opacity-70 shrink-0" />
                <span>{t('prof.logout') || 'Chiqish'}</span>
              </button>
            </div>
          </div>
        )}

        <NavLink
          to="/notifications"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isActive
                ? 'bg-primary text-primary-content font-bold shadow-lg shadow-primary/20'
                : 'text-neutral-content/50 hover:bg-white/5 hover:text-neutral-content'
            }`
          }
        >
          <Icon name="bell" className="w-5 h-5 shrink-0" />
          <span>{t('nav.notifications')}</span>
        </NavLink>

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${
            showUserMenu ? 'bg-white/5' : 'hover:bg-white/5'
          }`}
        >
          <div className="relative">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size={36} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[11px] opacity-40 flex items-center gap-1">
              {t('nav.profile')}
              <Icon name="chevron-up" className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </p>
          </div>
        </button>
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
          <div className="flex items-center gap-2">
            <div className="w-28"><LanguageSwitcher /></div>
            <NavLink to="/notifications" className="btn btn-ghost btn-sm btn-circle relative">
              <Icon name="bell" className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </NavLink>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
