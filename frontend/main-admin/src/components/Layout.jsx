import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Building2, CreditCard, TrendingUp, Settings, LogOut, Menu,
  Megaphone, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';

const nav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Заявки', Icon: Inbox },
  { to: '/organizations', label: 'Партнёры', Icon: Building2 },
  { to: '/announcements', label: 'Анонсы', Icon: Megaphone },
  { to: '/fines', label: 'Штрафы', Icon: AlertTriangle },
  { to: '/billing', label: 'Тарифы', Icon: CreditCard },
  { to: '/revenue', label: 'Доход', Icon: TrendingUp },
  { to: '/settings', label: 'Настройки', Icon: Settings },
];

// UI/UX сайдбара — как в frontend/student (Layout.jsx): карточка пользователя
// + логаут внизу сайдбара, без отдельной верхней шапки, лайм-подсветка активного пункта.
function SidebarContent({ user, logout }) {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M';

  return (
    <aside className="w-64 min-h-full bg-sidebar text-neutral-content flex flex-col py-5 px-3.5">
      <div className="flex items-center gap-2.5 font-extrabold text-[17px] text-white px-2.5 pb-5">
        <img src="/logo-mark.svg" alt="" className="w-7 h-7" />
        LevelUp Academy
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-primary/[0.13] text-primary'
                  : 'text-neutral-content/60 hover:bg-white/[0.07] hover:text-neutral-content'
              }`
            }
          >
            <Icon size={19} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 pt-3 mt-2 border-t border-white/10">
        <div className="w-9 h-9 rounded-full bg-primary text-primary-content font-extrabold text-[13px] grid place-items-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs text-neutral-content/50">Main Admin</div>
        </div>
        <button
          className="ml-auto p-1.5 rounded-lg text-neutral-content/50 hover:text-error hover:bg-error/10 transition-colors"
          onClick={logout}
          title="Выйти"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <label
          htmlFor="nav-drawer"
          className="btn btn-ghost btn-sm btn-circle lg:hidden fixed top-3 left-3 z-30 bg-base-100 shadow"
        >
          <Menu size={20} />
        </label>

        <main className="p-4 sm:p-7 max-w-6xl w-full mx-auto pt-16 lg:pt-7">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-30">
        <label htmlFor="nav-drawer" className="drawer-overlay" />
        <SidebarContent user={user} logout={logout} />
      </div>
    </div>
  );
}
