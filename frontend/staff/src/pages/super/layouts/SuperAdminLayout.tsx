import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../superadmin.css';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Search,
  Settings,
  Users,
  Users2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../shared/stores/auth';
import { useT } from '../shared/i18n/useT';
import { NotificationsBell } from '../shared/ui/NotificationsBell';
import { CommandPalette } from '../shared/ui/CommandPalette';
// @ts-expect-error -- auth.jsx (общий staff-контекст, не типизирован)
import { useAuth } from '../../../auth.jsx';

const NAV_ITEMS = [
  { to: '/super', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/super/branches', labelKey: 'nav.branches', icon: Building2 },
  { to: '/super/users', labelKey: 'nav.users', icon: Users },
  { to: '/super/stats', labelKey: 'nav.stats', icon: BarChart3, soon: true },
  { to: '/super/announcements', labelKey: 'nav.announcements', icon: Megaphone, soon: true },
  { to: '/super/audit', labelKey: 'nav.audit', icon: FileClock, soon: true },
  { to: '/super/reminders', labelKey: 'nav.reminders', icon: Bell, soon: true },
  { to: '/super/students', labelKey: 'nav.students', icon: GraduationCap, soon: true },
  { to: '/super/groups', labelKey: 'nav.groups', icon: Users2, soon: true },
  { to: '/super/attendance', labelKey: 'nav.attendance', icon: CalendarCheck2, soon: true },
  { to: '/super/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function SuperAdminLayout(): React.ReactElement {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- auth.jsx не типизирован
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    // единый логаут staff (реально ревокает refresh-cookie) — зеркалим в zustand-сторе ниже
    await logout();
    useAuthStore.setState({ accessToken: null, user: null, status: 'unauthenticated' });
    navigate('/login', { replace: true });
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <div className="min-h-screen bg-base-200 flex">
      <aside
        className={clsx(
          'panel-dark w-64 flex flex-col shrink-0 h-screen z-40 transition-transform duration-200',
          'md:sticky md:top-0 md:translate-x-0',
          'fixed inset-y-0 left-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        )}
      >
        {/* Brand block */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary text-primary-content grid place-items-center font-bold text-lg shadow-lg shadow-primary/20">
              L
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight truncate">
                {t('sidebar.title')}
              </div>
              <div className="text-[11px] text-white/40 font-medium">{t('sidebar.subtitle')}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square md:hidden text-white/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end, soon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-colors',
                  isActive
                    ? 'bg-white/[0.07] text-primary font-medium'
                    : soon
                      ? 'text-white/35 hover:text-white/50 hover:bg-white/[0.03]'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/[0.04]',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{t(labelKey)}</span>
              {soon && (
                <span className="text-[9px] bg-warning/20 text-warning/70 px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase">
                  скоро
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="mx-3 mb-3 rounded-xl bg-white/[0.05] border border-white/[0.06] p-2.5">
          {user && (
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="size-8 rounded-full bg-primary/20 text-primary grid place-items-center text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate text-white/90">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-white/40 truncate">{user.email}</div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition-colors"
          >
            <LogOut className="size-3.5" />
            {t('sidebar.logout')}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-base-100/95 backdrop-blur border-b border-base-300 flex items-center gap-3 px-5 py-2.5">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Меню"
          >
            <Menu className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="flex items-center gap-2 h-9 px-3 rounded-lg border border-base-300 bg-base-200/50 hover:bg-base-200 transition-colors text-sm text-base-content/60 flex-1 max-w-md"
          >
            <Search className="size-3.5" />
            <span className="truncate">Найти филиал, студента, действие…</span>
            <div className="ml-auto flex items-center gap-0.5">
              <kbd className="kbd kbd-xs">⌘</kbd>
              <kbd className="kbd kbd-xs">K</kbd>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="text-base-content/60">System status</span>
              <span className="text-success">OPTIMAL</span>
            </div>
            <NotificationsBell />
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
