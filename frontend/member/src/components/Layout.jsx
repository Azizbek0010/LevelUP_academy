import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
  const { user } = useAuth();
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const [mobileOpen, setMobileOpen] = useState(false);

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

      <div className="mt-auto p-3 space-y-2 border-t border-white/5">
        <LanguageSwitcher />
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
              {t('nav.profile')}
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
