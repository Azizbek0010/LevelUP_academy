import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Settings, LogOut, Menu, BookOpen, TrendingUp,
  CalendarCheck, ClipboardCheck, Coins, GraduationCap, Wallet, Receipt, UserCog,
  UsersRound, Megaphone, AlarmClock, ShieldAlert, PieChart, MessageSquare,
  Building2, Search, Bell, Sun, Moon, ChevronLeft, ChevronRight, X,
  LogIn, User as UserIcon, PanelLeftClose, PanelLeft,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { disconnectSocket } from '../socket.js';

/* ──────────────────── HOOKS ──────────────────── */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

/* ──────────────────── NAV CONFIG ──────────────────── */
const superNav = [
  { to: '/',              label: 'Дашборд',       Icon: LayoutDashboard, end: true },
  { to: '/branches',      label: 'Филиалы',        Icon: Building2 },
  { to: '/admins',        label: 'Сотрудники',     Icon: Users },
  { to: '/students',      label: 'Студенты',       Icon: GraduationCap,  soon: true },
  { to: '/groups',        label: 'Группы',         Icon: UsersRound,     soon: true },
  { to: '/attendance',    label: 'Посещаемость',   Icon: CalendarCheck,  soon: true },
  { to: '/reports',       label: 'Аналитика',      Icon: BarChart3 },
  { to: '/stats',         label: 'Статистика',     Icon: PieChart,       soon: true },
  { to: '/announcements', label: 'Объявления',     Icon: Megaphone,      soon: true },
  { to: '/reminders',     label: 'Напоминания',    Icon: AlarmClock,     soon: true },
  { to: '/audit',         label: 'Аудит',          Icon: ShieldAlert,    soon: true },
  { to: '/settings',      label: 'Настройки',      Icon: Settings },
];

const adminNav = [
  { to: '/',          label: 'Дашборд',     Icon: LayoutDashboard, end: true },
  { to: '/students',  label: 'Студенты',    Icon: GraduationCap },
  { to: '/groups',    label: 'Группы',      Icon: Users },
  { to: '/mentors',   label: 'Менторы',     Icon: UserCog },
  { to: '/chat',      label: 'Чат',         Icon: MessageSquare },
  { to: '/payments',  label: 'Платежи',     Icon: Wallet },
  { to: '/expenses',  label: 'Расходы',     Icon: Receipt },
  { to: '/reports',   label: 'Отчёты',      Icon: BarChart3 },
  { to: '/settings',  label: 'Настройки',   Icon: Settings },
];

const mentorNav = [
  { to: '/',           label: 'Дашборд',   Icon: LayoutDashboard, end: true },
  { to: '/groups',     label: 'Группы',    Icon: Users },
  { to: '/attendance', label: 'Davomat',   Icon: CalendarCheck },
  { to: '/homework',   label: 'Домашки',   Icon: ClipboardCheck },
  { to: '/coins',      label: 'Коины',     Icon: Coins },
];

const methodistNav = [
  { to: '/',                   label: 'Дашборд',     Icon: LayoutDashboard, end: true },
  { to: '/methodist/types',    label: 'Типы обучения',Icon: BookOpen },
  { to: '/methodist/analytics',label: 'Аналитика',   Icon: TrendingUp },
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

const ROLE_COLORS = {
  superadmin: '#8b5cf6',
  admin: '#3b82f6',
  mentor: '#22c55e',
  methodist: '#f59e0b',
};

/* ──────────────────── SIDEBAR ──────────────────── */
function Sidebar({ role, collapsed, onToggle }) {
  const nav = ROLE_NAV[role] || [];
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 72 : 256,
        background: 'linear-gradient(180deg, #0f1a0a 0%, #16210f 40%, #1a2912 100%)',
        borderRight: '1px solid rgba(198, 255, 52, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0" style={{ borderBottom: '1px solid rgba(198, 255, 52, 0.06)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
          style={{
            background: 'linear-gradient(135deg, #C6FF34 0%, #a8e02c 100%)',
            color: '#0f1a0a',
            boxShadow: '0 0 20px rgba(198, 255, 52, 0.3)',
          }}
        >
          L
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div className="text-sm font-bold tracking-tight" style={{ color: '#C6FF34' }}>LevelUP</div>
            <div className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(198,255,52,0.4)' }}>Academy</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2 animate-fade-in">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: `${ROLE_COLORS[role] || '#6b7280'}18`,
              color: ROLE_COLORS[role] || '#6b7280',
              border: `1px solid ${ROLE_COLORS[role] || '#6b7280'}25`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ROLE_COLORS[role] }} />
            {ROLE_TITLE[role] || 'Панель'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {nav.map(({ to, label, Icon, end, soon }, i) => {
          const isActive = location.pathname === to || (end && location.pathname === to) || (!end && location.pathname.startsWith(to) && to !== '/');
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={`group flex items-center gap-3 rounded-xl transition-all duration-200 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } text-sm relative overflow-hidden`}
              style={{
                color: isActive ? '#C6FF34' : 'rgba(232, 239, 226, 0.55)',
                background: isActive ? 'rgba(198, 255, 52, 0.1)' : 'transparent',
                animationDelay: `${i * 40}ms`,
              }}
            >
              {/* Active indicator — green left bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: '#C6FF34', boxShadow: '0 0 8px rgba(198, 255, 52, 0.5)' }}
                />
              )}

              {/* Icon */}
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="shrink-0 transition-all duration-200"
                style={{
                  color: isActive ? '#C6FF34' : soon ? 'rgba(232,239,226,0.25)' : undefined,
                }}
              />

              {/* Label */}
              {!collapsed && (
                <span className="flex-1 font-medium transition-colors" style={{
                  color: isActive ? '#C6FF34' : soon ? 'rgba(232,239,226,0.3)' : undefined,
                }}>
                  {label}
                </span>
              )}

              {/* Soon badge */}
              {!collapsed && soon && (
                <span
                  className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                >
                  soon
                </span>
              )}

              {/* Hover glow — subtle green */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: 'rgba(198, 255, 52, 0.04)' }}
              />
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 pb-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-all duration-200"
          style={{
            color: 'rgba(232,239,226,0.35)',
            background: 'rgba(198,255,52,0.04)',
          }}
          title={collapsed ? 'Kengaytirish' : 'Kichiklashtirish'}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span className="font-medium">Yig'ish</span>}
        </button>
      </div>
    </aside>
  );
}

/* ──────────────────── HEADER ──────────────────── */
function Header({ sidebarWidth, onMobileToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('lu-theme') || 'system');
  const userMenuRef = useRef(null);

  // Theme cycling
  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.add('light');
    else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    }
    localStorage.setItem('lu-theme', theme);
  }, [theme]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  const themeIcon = theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Sun size={16} />;

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 transition-all duration-300"
      style={{
        left: sidebarWidth,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Mobile hamburger */}
      <button onClick={onMobileToggle} className="btn btn-ghost btn-sm lg:hidden px-2" style={{ color: 'var(--text)' }}>
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search bar (desktop) */}
      <div className="hidden md:flex items-center relative">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-200"
          style={{
            background: searchFocused ? 'var(--surface)' : 'var(--bg)',
            border: `1px solid ${searchFocused ? 'var(--green)' : 'var(--border)'}`,
            width: searchFocused ? 280 : 200,
            boxShadow: searchFocused ? '0 0 0 3px rgba(198, 255, 52, 0.1)' : 'none',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Qidirish..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: 'var(--text)' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          color: 'var(--text-secondary)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
        title={`Tema: ${theme}`}
      >
        {themeIcon}
      </button>

      {/* Notification bell */}
      <button
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
        style={{
          color: 'var(--text-secondary)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
      >
        <Bell size={16} />
        {/* Notification dot */}
        <span
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
          style={{ background: '#ef4444', color: '#fff', border: '2px solid var(--surface)' }}
        >
          3
        </span>
      </button>

      {/* Divider */}
      <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--border)' }} />

      {/* User profile */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
          style={{
            background: showUserMenu ? 'var(--surface-hover)' : 'transparent',
            border: `1px solid ${showUserMenu ? 'var(--border)' : 'transparent'}`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: `linear-gradient(135deg, ${ROLE_COLORS[role] || '#6b7280'}, ${ROLE_COLORS[role] || '#6b7280'}cc)`,
              color: '#fff',
            }}
          >
            {user?.firstName?.[0] ?? 'U'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {ROLE_TITLE[role] || role}
            </div>
          </div>
        </button>

        {/* Dropdown */}
        {showUserMenu && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl py-2 animate-scale-in z-50"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{user?.email}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ROLE_TITLE[role]}</div>
            </div>
            <button
              onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <UserIcon size={14} />
              Профиль
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--danger)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={14} />
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ──────────────────── LAYOUT ──────────────────── */
export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lu-sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role;
  const FULL_PAGE_ROUTES = ['/chat'];
  const isFullPage = FULL_PAGE_ROUTES.some(r => location.pathname.startsWith(r));

  const sidebarWidth = isDesktop ? (collapsed ? 72 : 256) : 0;

  // Persist collapse
  useEffect(() => {
    localStorage.setItem('lu-sidebar-collapsed', collapsed);
  }, [collapsed]);

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar role={role} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full animate-slide-right">
            <Sidebar role={role} collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Header */}
      <Header sidebarWidth={sidebarWidth} onMobileToggle={() => setMobileOpen(!mobileOpen)} />

      {/* Main content */}
      <main
        className="transition-all duration-300 pt-16 min-h-screen"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className={isFullPage ? 'flex-1 flex flex-col h-[calc(100vh-64px)]' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto'}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
