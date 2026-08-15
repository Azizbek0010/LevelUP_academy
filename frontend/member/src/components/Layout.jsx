import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Home, CalendarCheck, GraduationCap, Wallet, MessageSquare, LogOut, Bell, ChevronDown, Star,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import { useI18n } from '../i18n.jsx';
import { fmt, money } from '../format.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { Avatar, C } from '../student/components/ui.jsx';

/**
 * Каркас кабинета родителя (2026-08-10, v2 — переведён на дизайн кабинета
 * ученика: тёмная шапка + светлый сайдбар + нижняя навигация на мобильных).
 * Палитра и компоненты — из student/components/ui.jsx (C, k-card, k-press),
 * чтобы кабинеты ученика и родителя читались как одна система.
 */

const DARK_BG = 'linear-gradient(135deg, #21391A 0%, #142A0F 100%)';
const SIDEBAR_W = 252;

const NAV = [
  { to: '/dashboard', label: 'nav.dashboard', icon: Home, end: true },
  { to: '/attendance', label: 'nav.attendance', icon: CalendarCheck },
  { to: '/grades', label: 'nav.grades', icon: GraduationCap },
  { to: '/debt', label: 'nav.debt', icon: Wallet },
  { to: '/chat', label: 'nav.chat', icon: MessageSquare },
];

/* Карточка ребёнка внизу сайдбара: вместо пустоты — настоящие числа
   (коины + долг приходят в списке детей родителя). */
function ChildCard({ child }) {
  const { t } = useI18n();
  if (!child) return null;
  const debt = Number(child.totalDebt) || 0;
  return (
    <div className="px-2.5 pb-3">
      <div className="rounded-xl p-3.5" style={{ background: C.card }}>
        <div className="flex items-center gap-3">
          <Avatar name={`${child.firstName} ${child.lastName}`} size={38} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold truncate" style={{ color: C.text }}>
              {child.firstName} {child.lastName}
            </div>
            <div className="text-[11px] font-bold mt-0.5" style={{ color: C.muted }}>{t('nav.child')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg"
            style={{ background: `${C.lime}1c`, color: C.limeDk }}
          >
            <Star size={12} strokeWidth={2.6} /> {fmt(child.coins)}
          </span>
          {debt > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg"
              style={{ background: '#FDE8E7', color: '#C0392B' }}
            >
              <Wallet size={12} strokeWidth={2.6} /> {money(debt)}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg"
              style={{ background: '#E8F6EC', color: '#1F7A3D' }}
            >
              <Wallet size={12} strokeWidth={2.6} /> {t('debt.noDebtShort')}
            </span>
          )}
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
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setShowProfile(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Родитель';

  const sidebar = (
    <div className="flex flex-col h-full" style={{ background: C.bg }}>
      <nav className="shrink-0 px-1.5 py-5 space-y-1.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className="block">
            {({ isActive }) => (
              <span
                className="k-press-sm flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15.5px] font-bold transition-colors"
                style={{
                  color: isActive ? C.limeDk : C.muted,
                  background: isActive ? `${C.lime}1c` : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} className="shrink-0" />
                {t(label)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />
      <ChildCard child={selectedChild} />
    </div>
  );

  return (
    <div className="kid min-h-screen">
      {/* ══ Тёмная шапка во всю ширину ══ */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-20 flex items-center gap-3 px-4 sm:px-6"
        style={{ background: DARK_BG, boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo-white.svg" alt="LevelUp Academy" className="h-9 w-auto" />
        </div>

        <div className="flex-1" />

        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>

        <NavLink
          to="/notifications"
          title={t('nav.notifications')}
          aria-label={t('nav.notifications')}
          className="k-press-sm relative w-10 h-10 rounded-full grid place-items-center shrink-0 transition-colors"
          style={{ background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.75)' }}
        >
          <Bell size={18} strokeWidth={2.4} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border border-white/40" />
        </NavLink>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            aria-expanded={showProfile}
            onClick={() => setShowProfile((v) => !v)}
            className="k-press-sm flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-full transition-colors"
            style={{ background: showProfile ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)' }}
          >
            <Avatar name={name} size={34} />
            <div className="hidden sm:block leading-none pr-1 text-left">
              <div className="text-[13px] font-extrabold truncate max-w-[120px] text-white">{name}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('common.role.parent').toUpperCase()}</div>
            </div>
            <ChevronDown size={14} strokeWidth={2.6} className={`hidden sm:block shrink-0 transition-transform ${showProfile ? 'rotate-180' : ''}`} style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>

          {showProfile && (
            <div
              role="menu"
              className="k-popover animate-scale-in fixed sm:absolute left-3 right-3 top-[4.75rem] sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-64 overflow-hidden z-50"
            >
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${C.line}` }}>
                <Avatar name={name} size={44} />
                <div className="min-w-0">
                  <div className="text-[14.5px] font-extrabold truncate" style={{ color: C.text }}>{name}</div>
                  <div className="text-[12px] font-semibold mt-0.5" style={{ color: C.muted }}>{t('common.role.parent')}</div>
                </div>
              </div>
              <div className="p-1.5">
                <NavLink
                  to="/profile"
                  role="menuitem"
                  onClick={() => setShowProfile(false)}
                  className="k-press-sm w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-bold"
                  style={{ color: C.text }}
                >
                  <ChevronDown size={16} strokeWidth={2.6} className="rotate-[-90deg]" style={{ color: C.muted }} />
                  {t('nav.profile')}
                </NavLink>
                <button
                  role="menuitem"
                  onClick={logout}
                  className="k-press-sm w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-bold"
                  style={{ color: '#C0392B' }}
                >
                  <LogOut size={16} strokeWidth={2.6} /> {t('prof.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══ Сайдбар под шапкой — светлый, как у ученика ══ */}
      <aside
        className="hidden lg:flex fixed top-20 bottom-0 left-0 z-40 flex-col"
        style={{ width: SIDEBAR_W, background: C.bg }}
      >
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 z-50 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      {/* ══ Контент ══ */}
      <main className="pt-20 lg:pl-[252px] min-h-screen">
        <div className="animate-page-enter max-w-[1080px] mx-auto p-4 sm:p-5 lg:p-7 pb-28 lg:pb-8">
          <Outlet />
        </div>
      </main>

      {/* ══ Нижняя навигация (мобильные) ══ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch h-[68px] px-2"
        style={{ background: C.card, borderTop: `1px solid ${C.line}` }}
      >
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="flex-1 grid place-items-center">
            {({ isActive }) => (
              <span className="k-press-sm flex flex-col items-center gap-1">
                <span
                  className="w-11 h-8 rounded-xl grid place-items-center"
                  style={isActive
                    ? { background: C.lime, color: '#fff' }
                    : { background: 'transparent', color: C.muted }}
                >
                  <Icon size={19} strokeWidth={2.6} />
                </span>
                <span className="text-[10px] font-extrabold" style={{ color: isActive ? C.text : C.muted }}>
                  {t(label)}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
