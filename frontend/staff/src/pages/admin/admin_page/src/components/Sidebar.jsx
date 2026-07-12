import { useAuth } from '../context/AuthContext.jsx';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineSquares2X2, HiOutlineArrowRightOnRectangle, HiOutlineXMark,
  HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineCurrencyDollar,
  HiOutlineAcademicCap, HiOutlineChatBubbleLeftRight, HiOutlineDocumentText,
  HiOutlineReceiptRefund, HiOutlineCog8Tooth,
} from 'react-icons/hi2';

const navItems = [
  { path: '/', label: 'Panel', icon: HiOutlineSquares2X2 },
  { path: '/students', label: 'Talabalar', icon: HiOutlineUserGroup },
  { path: '/groups', label: 'Guruhlar', icon: HiOutlineBookOpen },
  { path: '/payments', label: "To'lovlar", icon: HiOutlineReceiptRefund },
  { path: '/expenses', label: 'Xarajatlar', icon: HiOutlineCurrencyDollar },
  { path: '/reports', label: 'Hisobotlar', icon: HiOutlineDocumentText },
  { path: '/mentors', label: 'Mentorlar', icon: HiOutlineAcademicCap },
  { path: '/chat', label: 'Chat', icon: HiOutlineChatBubbleLeftRight },
  { path: '/settings', label: 'Sozlamalar', icon: HiOutlineCog8Tooth },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const initials = user?.firstName
    ? (user.firstName[0] + (user.lastName?.[0] || '')).toUpperCase()
    : 'A';
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : 'Admin';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in" onClick={onClose} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] lg:w-[260px] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="flex items-center justify-between px-5 h-[68px] shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-[var(--green)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
                <path d="M50 14 A36 36 0 1 1 18.82 32" stroke="#141B10" strokeWidth="10" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="text-[16px] font-extrabold tracking-[-0.03em] leading-none block" style={{ color: 'var(--sidebar-text)' }}>LevelUp</span>
              <span className="text-[8px] font-semibold block leading-none mt-0.5 tracking-[0.06em] uppercase" style={{ color: 'var(--sidebar-text-muted)' }}>Admin panel</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden transition-colors p-1" style={{ color: 'var(--sidebar-text-muted)' }}>
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="text-[9px] font-semibold uppercase tracking-[0.06em] px-3 pb-2" style={{ color: 'var(--sidebar-text-muted)' }}>Navigatsiya</div>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => { if (open) onClose(); }}
                className="relative w-full flex items-center gap-3 px-3.5 py-3.5 mb-0.5 rounded-[10px] text-left transition-all duration-200 text-[13px] font-semibold"
                style={{
                  color: active ? 'var(--sidebar-text)' : 'var(--sidebar-text-secondary)',
                  background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 1px var(--sidebar-active-border)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--sidebar-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon className="w-5 h-5 shrink-0" style={{ color: active ? 'var(--sidebar-active-border)' : 'var(--sidebar-text-muted)' }} />
                <span className={active ? 'font-extrabold tracking-[-0.01em]' : ''}>{item.label}</span>
                {active && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full" style={{ background: 'var(--sidebar-active-border)' }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--sidebar-active-border)', opacity: 0.7 }} />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 px-4 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[var(--green)] flex items-center justify-center text-[#141B10] font-extrabold text-[14px] shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold leading-tight truncate" style={{ color: 'var(--sidebar-text)' }}>{displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse-dot" />
                <span className="text-[10px]" style={{ color: 'var(--sidebar-text-muted)' }}>Online</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="transition-colors p-1.5 rounded-[8px] hover:bg-[rgba(232,84,62,0.1)]"
              style={{ color: 'var(--sidebar-text-muted)' }}
              title="Chiqish"
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
