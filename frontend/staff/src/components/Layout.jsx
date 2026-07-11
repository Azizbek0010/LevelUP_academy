import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, BarChart3, Settings, LogOut, Menu, Bell, BookOpen, TrendingUp,
  GraduationCap, UsersRound, CalendarCheck, Megaphone, AlarmClock, ShieldAlert, PieChart,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';

const superNav = [
  { to: '/',             label: 'Дашборд',      Icon: LayoutDashboard, end: true },
  { to: '/branches',     label: 'Филиалы',       Icon: Building2 },
  { to: '/admins',       label: 'Сотрудники',    Icon: Users },
  { to: '/students',     label: 'Студенты',      Icon: GraduationCap,  soon: true },
  { to: '/groups',       label: 'Группы',        Icon: UsersRound,     soon: true },
  { to: '/attendance',   label: 'Посещаемость',  Icon: CalendarCheck,  soon: true },
  { to: '/reports',      label: 'Аналитика',     Icon: BarChart3 },
  { to: '/stats',        label: 'Статистика',    Icon: PieChart,       soon: true },
  { to: '/announcements',label: 'Объявления',    Icon: Megaphone,      soon: true },
  { to: '/reminders',    label: 'Напоминания',   Icon: AlarmClock,     soon: true },
  { to: '/audit',        label: 'Аудит',         Icon: ShieldAlert,    soon: true },
  { to: '/settings',     label: 'Настройки',     Icon: Settings },
];

const adminNav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
];

const mentorNav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
];

const methodistNav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
  { to: '/methodist/types', label: 'Типы обучения', Icon: BookOpen },
  { to: '/methodist/analytics', label: 'Аналитика', Icon: TrendingUp },
];

const ROLE_NAV = {
  superadmin: superNav,
  admin: adminNav,
  mentor: mentorNav,
  methodist: methodistNav,
};

const ROLE_TITLE = {
  superadmin: 'Super Admin',
  admin: 'Администратор',
  mentor: 'Ментор',
  methodist: 'Методист',
};

function SidebarContent({ role }) {
  const nav = ROLE_NAV[role] || superNav;
  return (
    <aside className="w-64 min-h-full bg-sidebar text-neutral-content flex flex-col">
      <div className="px-5 py-6">
        <img src="/logo-white.svg" alt="LevelUp Academy" className="h-8 w-auto" />
        <div className="text-[11px] uppercase tracking-widest opacity-50 mt-2">
          {ROLE_TITLE[role] || 'Панель'}
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {nav.map(({ to, label, Icon, end, soon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-content font-semibold shadow'
                  : soon
                  ? 'text-neutral-content/35 hover:text-neutral-content/55'
                  : 'text-neutral-content/75 hover:bg-white/10 hover:text-neutral-content'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span className="flex-1">{label}</span>
            {soon && (
              <span className="text-[9px] bg-warning/20 text-warning/80 px-1.5 py-0.5 rounded font-bold tracking-wide uppercase">
                скоро
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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
                <span className="text-sm">{user?.firstName?.[0] ?? 'U'}</span>
              </div>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-[11px] opacity-50">{ROLE_TITLE[role] || role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm gap-1" onClick={onLogout} title="Выйти">
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
        <SidebarContent role={role} />
      </div>
    </div>
  );
}
