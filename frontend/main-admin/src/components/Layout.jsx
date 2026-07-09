import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Building2, CreditCard, TrendingUp, Settings, Bell, LogOut, Menu,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';

const nav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Заявки', Icon: Inbox },
  { to: '/organizations', label: 'Партнёры', Icon: Building2 },
  { to: '/billing', label: 'Тарифы', Icon: CreditCard },
  { to: '/revenue', label: 'Доход', Icon: TrendingUp },
  { to: '/settings', label: 'Настройки', Icon: Settings },
];

function SidebarContent() {
  return (
    <aside className="w-64 min-h-full bg-sidebar text-neutral-content flex flex-col">
      <div className="px-5 py-6">
        <img src="/logo-white.svg" alt="LevelUp Academy" className="h-8 w-auto" />
        <div className="text-[11px] uppercase tracking-widest opacity-50 mt-2">SaaS · Main Admin</div>
      </div>
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content font-semibold shadow'
                  : 'text-neutral-content/75 hover:bg-white/10 hover:text-neutral-content'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <header className="h-16 flex items-center gap-3 px-4 sm:px-6 bg-[#eef7e4] border-b border-base-300 sticky top-0 z-20">
          <label htmlFor="nav-drawer" className="btn btn-ghost btn-sm lg:hidden px-2">
            <Menu size={20} />
          </label>
          <div className="flex-1" />
          <button className="btn btn-ghost btn-circle btn-sm">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="avatar placeholder">
              <div className="bg-sidebar text-neutral-content w-9 rounded-full">
                <span className="text-sm">{user?.firstName?.[0] ?? 'M'}</span>
              </div>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-[11px] opacity-50">Main Admin</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm gap-1" onClick={logout} title="Выйти">
            <LogOut size={16} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </header>

        <main className="p-4 sm:p-7 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-30">
        <label htmlFor="nav-drawer" className="drawer-overlay" />
        <SidebarContent />
      </div>
    </div>
  );
}
