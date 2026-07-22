import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, CalendarCheck, GraduationCap, Wallet, MessageSquare,
  Bell, ChevronDown, ChevronRight, User as UserIcon,
  PanelLeftClose, PanelLeft, LogOut, Menu, Settings,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import Avatar from './Avatar.jsx';

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
const NAV = [
  { to: '/dashboard', label: 'Обзор', Icon: Home, end: true },
  { to: '/attendance', label: 'Посещаемость', Icon: CalendarCheck },
  { to: '/grades', label: 'Оценки', Icon: GraduationCap },
  { to: '/debt', label: 'Оплата', Icon: Wallet },
  { to: '/chat', label: 'Чат', Icon: MessageSquare },
];

/* ──────────────────── SIDEBAR ──────────────────── */
function Sidebar({
  collapsed,
  pinned,
  onToggle,
  onExpandSidebar = () => {},
  hoverProps = {},
  overlaying = false,
  childList,
  selectedChild,
  selectChild,
}) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      className="fixed top-0 left-0 h-full z-40 flex flex-col transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
      {...hoverProps}
      style={{
        width: collapsed ? 72 : 256,
        background: 'linear-gradient(180deg, #0f1a0a 0%, #16210f 40%, #1a2912 100%)',
        borderRight: '1px solid rgba(64, 131, 59, 0.15)',
        boxShadow: overlaying
          ? '8px 0 32px rgba(0, 0, 0, 0.45)'
          : '4px 0 24px rgba(0, 0, 0, 0.3)',
        borderRadius: '0 0 16px 0',
      }}
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 px-4 h-16 shrink-0 transition-opacity hover:opacity-85"
        style={{ borderBottom: '1px solid rgba(64, 131, 59, 0.15)' }}
        aria-label="LevelUp Academy"
      >
        {collapsed ? (
          <img src="/logo-mark.svg" alt="" className="w-9 h-9 shrink-0" />
        ) : (
          <img src="/logo-white.svg" alt="LevelUp Academy" className="h-7 w-auto animate-fade-in" />
        )}
      </Link>

      {/* Child Selector */}
      {!collapsed && childList.length > 1 && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <select
              className="w-full bg-white/8 border border-white/10 text-white/70 text-sm font-medium rounded-xl px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-[#40833B]/50 transition-colors"
              value={selectedChild?.id || ''}
              onChange={(e) => selectChild(e.target.value)}
            >
              {childList.map((c) => (
                <option key={c.id} value={c.id} className="text-base-content">
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
          </div>
        </div>
      )}

      {/* Collapsed child indicator */}
      {collapsed && selectedChild && (
        <div className="px-3 pt-3 pb-1 flex justify-center">
          <div className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center" title={`${selectedChild.firstName} ${selectedChild.lastName}`}>
            <span className="text-xs font-bold text-white/60">
              {selectedChild.firstName?.[0]}{selectedChild.lastName?.[0]}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {NAV.map((item, i) => {
          const { to, label, Icon, end } = item;
          const isActive = location.pathname === to || (!end && location.pathname.startsWith(to) && to !== '/');
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
                color: isActive ? '#40833B' : 'rgba(232, 239, 226, 0.55)',
                background: isActive ? 'rgba(64, 131, 59, 0.1)' : 'transparent',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: '#40833B', boxShadow: '0 0 8px rgba(64, 131, 59, 0.4)' }}
                />
              )}

              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="shrink-0 transition-all duration-200"
                style={{ color: isActive ? '#40833B' : undefined }}
              />

              {!collapsed && (
                <span className="flex-1 font-medium transition-colors" style={{
                  color: isActive ? '#40833B' : undefined,
                }}>
                  {label}
                </span>
              )}

              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ background: 'rgba(64, 131, 59, 0.05)' }}
              />
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-3 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-all duration-200"
          style={{
            color: 'rgba(232,239,226,0.35)',
            background: 'rgba(64,131,59,0.06)',
          }}
          title={pinned ? "Panelni yig'ish" : 'Panelni ochiq qoldirish'}
          aria-pressed={pinned}
        >
          {pinned ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          {!collapsed && (
            <span className="font-medium">
              {pinned ? "Yig'ish" : 'Mahkamlash'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ──────────────────── HEADER ──────────────────── */
function Header({ sidebarWidth, onMobileToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 flex items-center gap-3 px-4 sm:px-6 transition-all duration-300"
      style={{
        left: sidebarWidth,
        background: 'rgba(15, 26, 10, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(64, 131, 59, 0.15)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Mobile hamburger */}
      <button onClick={onMobileToggle} className="lg:hidden px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60">
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Notification bell */}
      <NavLink
        to="/notifications"
        className="relative w-10 h-10 rounded-full grid place-items-center transition-colors text-white/60 hover:bg-white/5"
      >
        <Bell size={18} />
        {/* Badge placeholder — will be wired to real API later */}
      </NavLink>

      {/* User profile dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-expanded={showUserMenu}
          aria-label="Akkaunt menyusi"
          className={`flex items-center gap-2.5 p-1 sm:pr-3 rounded-full transition-colors ${
            showUserMenu ? 'bg-white/5' : 'hover:bg-white/5'
          }`}
        >
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={36} />
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-sm font-bold text-white/90">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block text-[11px] text-white/40">
              Родитель
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`hidden sm:block text-white/40 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showUserMenu && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden shadow-2xl animate-scale-in z-50"
            style={{
              background: 'linear-gradient(180deg, #16210f 0%, #1a2912 100%)',
              border: '1px solid rgba(64, 131, 59, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(64, 131, 59, 0.15)' }}>
              <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={44} />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white/90 truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-white/40 truncate">{user?.email || 'Родитель'}</div>
                <span className="inline-block mt-1 text-[10px] font-bold text-[#40833B] bg-[#40833B]/10 rounded-full px-2 py-0.5">
                  Родитель
                </span>
              </div>
            </div>

            <div className="p-1.5">
              <button
                role="menuitem"
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 grid place-items-center shrink-0">
                  <UserIcon size={14} />
                </span>
                Профиль
              </button>
              <button
                role="menuitem"
                onClick={() => { setShowUserMenu(false); navigate('/notifications'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 grid place-items-center shrink-0">
                  <Settings size={14} />
                </span>
                Настройки
              </button>
              <button
                role="menuitem"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-red-500/10 grid place-items-center shrink-0">
                  <LogOut size={14} />
                </span>
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ──────────────────── LAYOUT ──────────────────── */
export default function Layout() {
  const { user } = useAuth();
  const { childList, selectedChild, selectChild } = useChild();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lu-member-sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hover-to-expand for desktop
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimer = useRef(null);

  const expandedByHover = canHover && collapsed && hoverOpen;
  const visuallyCollapsed = collapsed && !expandedByHover;

  const openOnHover = () => {
    if (!canHover || !collapsed) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverOpen(true), 120);
  };

  const closeOnLeave = () => {
    clearTimeout(hoverTimer.current);
    setHoverOpen(false);
  };

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const sidebarWidth = isDesktop ? (collapsed ? 72 : 256) : 0;

  // Persist collapse
  useEffect(() => {
    localStorage.setItem('lu-member-sidebar-collapsed', collapsed);
  }, [collapsed]);

  // Close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarProps = {
    childList,
    selectedChild,
    selectChild,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, #f8faf8)' }}>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar
          collapsed={visuallyCollapsed}
          pinned={!collapsed}
          overlaying={expandedByHover}
          onToggle={() => { setCollapsed(!collapsed); setHoverOpen(false); }}
          onExpandSidebar={() => setCollapsed(false)}
          hoverProps={{
            onMouseEnter: openOnHover,
            onMouseLeave: closeOnLeave,
          }}
          {...sidebarProps}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full animate-slide-right">
            <Sidebar
              collapsed={false}
              pinned
              onToggle={() => setMobileOpen(false)}
              {...sidebarProps}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <Header sidebarWidth={sidebarWidth} onMobileToggle={() => setMobileOpen(!mobileOpen)} />

      {/* Main content */}
      <main
        className="transition-all duration-300 pt-16 min-h-screen overflow-x-hidden"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
