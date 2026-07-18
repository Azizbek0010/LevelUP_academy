import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, ChevronLeft, ChevronRight, ChevronDown, X,
  LogIn, User as UserIcon, PanelLeftClose, PanelLeft, LogOut, Menu,
} from 'lucide-react';
import {
  HiOutlineSquares2X2, HiOutlineBuildingOffice2, HiOutlineUsers,
  HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineCalendarDays,
  HiOutlineChartBar, HiOutlineChartPie, HiOutlineMegaphone,
  HiOutlineBellAlert, HiOutlineShieldExclamation, HiOutlineCog,
  HiOutlineUserCircle, HiOutlineChatBubbleLeftRight, HiOutlineWallet,
  HiOutlineReceiptPercent, HiOutlineBookOpen, HiOutlineArrowTrendingUp,
  HiOutlineClipboardDocumentCheck, HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { useAuth } from '../auth.jsx';
import Avatar from './Avatar.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { disconnectSocket } from '../socket.js';
import { useMentorGroups, useChatContacts } from '../queries.js';

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
  { to: '/',              label: 'Дашборд',       Icon: HiOutlineSquares2X2, end: true },
  { to: '/branches',      label: 'Филиалы',        Icon: HiOutlineBuildingOffice2 },
  { to: '/admins',        label: 'Сотрудники',     Icon: HiOutlineUsers },
  { to: '/students',      label: 'Студенты',       Icon: HiOutlineAcademicCap },
  { to: '/groups',        label: 'Группы',         Icon: HiOutlineUserGroup },
  { to: '/attendance',    label: 'Посещаемость',   Icon: HiOutlineCalendarDays },
  { to: '/reports',       label: 'Аналитика',      Icon: HiOutlineChartBar },
  { to: '/stats',         label: 'Статистика',     Icon: HiOutlineChartPie },
  { to: '/announcements', label: 'Объявления',     Icon: HiOutlineMegaphone },
  { to: '/reminders',     label: 'Напоминания',    Icon: HiOutlineBellAlert },
  { to: '/audit',         label: 'Аудит',          Icon: HiOutlineShieldExclamation },
  { to: '/settings',      label: 'Настройки',      Icon: HiOutlineCog },
];

const adminNav = [
  { to: '/',          label: 'Дашборд',     Icon: HiOutlineSquares2X2, end: true },
  { to: '/students',  label: 'Студенты',    Icon: HiOutlineAcademicCap },
  { to: '/groups',    label: 'Группы',      Icon: HiOutlineUsers },
  { to: '/mentors',   label: 'Менторы',     Icon: HiOutlineUserCircle },
  { to: '/chat',      label: 'Чат',         Icon: HiOutlineChatBubbleLeftRight },
  { to: '/payments',  label: 'Платежи',     Icon: HiOutlineWallet },
  { to: '/expenses',  label: 'Расходы',     Icon: HiOutlineReceiptPercent },
  { to: '/reports',   label: 'Отчёты',      Icon: HiOutlineChartBar },
  { to: '/settings',  label: 'Настройки',   Icon: HiOutlineCog },
];

/**
 * Меню ментора намеренно короткое.
 *
 * Было пять пунктов — Группы, Davomat, Тесты, Коины, Чат — и каждый из трёх
 * средних начинался с одного и того же вопроса «а с какой группой работаем?».
 * Ментор выбирал группу заново в каждом разделе. Теперь группа выбирается один
 * раз здесь, а журнал/тесты/коины — вкладки внутри неё.
 *
 * Чат остаётся снаружи: переписка идёт с родителями, а не с группой.
 */
const mentorNav = [
  { to: '/',     label: 'Дашборд',  Icon: HiOutlineSquares2X2, end: true },
  { type: 'mentor-groups' },
  { to: '/chat', label: 'Xabarlar', Icon: HiOutlineChatBubbleLeftRight },
];

const methodistNav = [
  { to: '/',                   label: 'Дашборд',     Icon: HiOutlineSquares2X2, end: true },
  { to: '/methodist/types',    label: 'Типы обучения',Icon: HiOutlineBookOpen },
  { to: '/methodist/analytics',label: 'Аналитика',   Icon: HiOutlineArrowTrendingUp },
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

/* ──────────────────── MENTOR: раскрывающийся список групп ────────────────────
   Отдельный компонент, а не ветка внутри Sidebar: хук useMentorGroups не должен
   выполняться у админа и методиста — их эндпоинт ментора вернул бы 403. */
function MentorGroupsNav({ collapsed, onExpandSidebar }) {
  const { data } = useMentorGroups();
  const location = useLocation();
  const groups = data?.data || [];

  const insideGroup = location.pathname.startsWith('/groups');
  // Раскрыт по умолчанию: список групп — основная навигация ментора, прятать
  // её за лишним кликом незачем. Свернуть можно вручную.
  const [open, setOpen] = useState(true);

  const toggle = () => {
    // В свёрнутом сайдбаре списку негде показаться — сначала разворачиваем его.
    if (collapsed) { onExpandSidebar(); setOpen(true); return; }
    setOpen((v) => !v);
  };

  return (
    <div>
      <button
        onClick={toggle}
        title={collapsed ? 'Guruhlar' : undefined}
        aria-expanded={collapsed ? false : open}
        className={`group w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-sm ${
          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
        }`}
        style={{
          color: insideGroup ? '#C6FF34' : 'rgba(232, 239, 226, 0.55)',
          background: insideGroup ? 'rgba(198, 255, 52, 0.1)' : 'transparent',
        }}
      >
        <HiOutlineUserGroup size={18} strokeWidth={insideGroup ? 2.2 : 1.8} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium">Guruhlar</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(198,255,52,0.12)', color: 'rgba(198,255,52,0.75)' }}
            >
              {groups.length}
            </span>
            <ChevronDown
              size={14}
              className="shrink-0 transition-transform duration-200"
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
          </>
        )}
      </button>

      {!collapsed && open && (
        <ul className="mt-1 space-y-0.5 pl-3 border-l ml-4" style={{ borderColor: 'rgba(198,255,52,0.12)' }}>
          {groups.length === 0 ? (
            <li className="px-3 py-2 text-[11px]" style={{ color: 'rgba(232,239,226,0.3)' }}>
              Guruh yo'q
            </li>
          ) : (
            groups.map((g) => {
              const active = location.pathname === `/groups/${g.id}`;
              return (
                <li key={g.id}>
                  <NavLink
                    to={`/groups/${g.id}`}
                    className="block rounded-lg px-3 py-2 text-[13px] transition-colors truncate"
                    style={{
                      color: active ? '#C6FF34' : 'rgba(232, 239, 226, 0.5)',
                      background: active ? 'rgba(198, 255, 52, 0.08)' : 'transparent',
                      fontWeight: active ? 600 : 400,
                    }}
                    title={g.name}
                  >
                    {g.name}
                  </NavLink>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

/* ──────────────────── SIDEBAR ──────────────────── */
function Sidebar({
  role,
  collapsed,          // визуальное состояние: свёрнут ли сейчас
  pinned,             // закреплён ли открытым (осознанный выбор пользователя)
  onToggle,
  onExpandSidebar = () => {},
  hoverProps = {},    // обработчики наведения — только у десктопного экземпляра
  overlaying = false, // раскрыт наведением поверх контента
}) {
  const nav = ROLE_NAV[role] || [];
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      {...hoverProps}
      className="fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-200 ease-out overflow-hidden"
      style={{
        width: collapsed ? 72 : 256,
        background: 'linear-gradient(180deg, #0f1a0a 0%, #16210f 40%, #1a2912 100%)',
        borderRight: '1px solid rgba(198, 255, 52, 0.08)',
        // Когда панель выехала поверх страницы, тень должна быть заметнее:
        // иначе не читается, что это слой над контентом, а не раздвинувшая его колонка.
        boxShadow: overlaying
          ? '8px 0 32px rgba(0, 0, 0, 0.45)'
          : '4px 0 24px rgba(0, 0, 0, 0.3)',
        borderRadius: '0 0 16px 0',
      }}
    >
      {/* Логотип.
          Раньше здесь был самодельный градиентный квадрат с буквой «L» и текст
          «LevelUP / Academy», набранный вручную — фирменный знак (незамкнутое
          кольцо-прогресс) в панели не появлялся вообще, хотя лежит готовым в
          public/ и уже используется на логине и сплэше.
          Развёрнутый сайдбар — выворотка целиком (тот же файл, что на тёмной
          панели логина), свёрнутый — только лаймовый знак. */}
      <Link
        to="/"
        className="flex items-center gap-3 px-4 h-16 shrink-0 transition-opacity hover:opacity-85"
        style={{ borderBottom: '1px solid rgba(198, 255, 52, 0.06)' }}
        aria-label="LevelUp Academy — bosh sahifa"
      >
        {collapsed ? (
          <img src="/logo-mark.svg" alt="" className="w-9 h-9 shrink-0" />
        ) : (
          <img
            src="/logo-white.svg"
            alt="LevelUp Academy"
            className="h-7 w-auto animate-fade-in"
          />
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {nav.map((item, i) => {
          if (item.type === 'mentor-groups') {
            return (
              <MentorGroupsNav
                key="mentor-groups"
                collapsed={collapsed}
                onExpandSidebar={onExpandSidebar}
              />
            );
          }
          const { to, label, Icon, end, soon } = item;
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

      {/* Кнопка теперь управляет не «свёрнут/развёрнут», а «закреплён ли
          открытым». Панель и так раскрывается на наведении — кнопка нужна,
          чтобы зафиксировать её и не гонять мышь к краю каждый раз. */}
      <div className="px-3 pb-3 shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs transition-all duration-200"
          style={{
            color: 'rgba(232,239,226,0.35)',
            background: 'rgba(198,255,52,0.04)',
            marginBottom: '4px',
          }}
          title={pinned ? 'Panelni yig\'ish' : 'Panelni ochiq qoldirish'}
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

/* ──────────────────── УВЕДОМЛЕНИЯ ────────────────────
   Колокольчик раньше был картинкой: жёстко нарисованная «3» и клик, который
   ничего не открывал.

   Отдельного API уведомлений в бэкенде нет — есть только очередь рассылки
   (telegram/email), читать из неё нечего. Поэтому панель показывает то, что
   действительно существует и требует реакции: непрочитанные сообщения от
   родителей. Цифра на значке — их настоящее количество, а не константа.
   Появится таблица notifications — сюда добавится второй источник. */
/** «14:30» сегодня, «Kecha» вчера, дальше — дата. Как в списке чата. */
function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Чат есть только у ментора и админа; у остальных ролей эндпоинт ответит 403.
  const hasChat = user?.role === 'mentor' || user?.role === 'admin';
  const { data } = useChatContacts({ enabled: hasChat });
  const contacts = data?.data ?? [];
  const unread = contacts.filter((c) => (c.unread_count ?? 0) > 0);
  const total = unread.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const openChat = (contactId) => {
    setOpen(false);
    navigate(`/chat${contactId ? `?with=${contactId}` : ''}`);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Круглая ghost-кнопка вместо квадрата с рамкой: в ряду с аватаром
          пользователя рамка выглядела чужеродной деталью. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? `Bildirishnomalar: ${total} ta yangi` : 'Bildirishnomalar'}
        aria-expanded={open}
        className={`relative w-10 h-10 rounded-full grid place-items-center transition-colors ${
          open ? 'bg-primary/10 text-primary' : 'text-base-content/60 hover:bg-base-200'
        }`}
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums bg-error text-white ring-2 ring-base-100">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Bildirishnomalar"
          /* На телефоне панель шириной 320px, привязанная к правому краю
             кнопки, уезжала левым краем за экран (замер: left = -26px).
             Там она растягивается по ширине окна с отступами, на sm+ —
             обычный выпадающий список под колокольчиком. */
          className="popover-surface fixed sm:absolute left-3 right-3 top-[4.25rem] sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[360px] overflow-hidden animate-scale-in z-50"
        >
          <header className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-base-200">
            <h2 className="text-[15px] font-bold">Bildirishnomalar</h2>
            {total > 0 && (
              <span className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5 tabular-nums">
                {total} yangi
              </span>
            )}
          </header>

          <div className="max-h-[min(60vh,380px)] overflow-y-auto">
            {!hasChat || unread.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-3 bg-base-200 text-base-content/30">
                  <Bell size={22} />
                </span>
                <p className="text-sm font-semibold text-base-content/70">
                  Yangi bildirishnoma yo'q
                </p>
                <p className="text-xs mt-1 text-base-content/45 max-w-[220px] mx-auto">
                  O'qilmagan xabarlar shu yerda ko'rinadi.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-base-200">
                {unread.map((c) => {
                  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => openChat(c.id)}
                        className="group w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-base-200/60 transition-colors"
                      >
                        <span className="relative shrink-0">
                          <Avatar name={name} size={40} />
                          {/* Точка непрочитанного на аватаре — статус читается
                              раньше, чем взгляд доходит до счётчика справа. */}
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-base-100" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold truncate">{name}</span>
                            <span className="text-[10px] text-base-content/40 shrink-0 tabular-nums">
                              {formatWhen(c.last_message_at)}
                            </span>
                          </span>
                          {c.child_names && (
                            <span className="block text-[11px] text-base-content/45 truncate">
                              {c.child_names}
                            </span>
                          )}
                          <span className="flex items-center justify-between gap-2 mt-0.5">
                            <span className="text-xs text-base-content/60 truncate">
                              {c.last_message || 'Yangi xabar'}
                            </span>
                            <span className="badge badge-primary badge-sm shrink-0 tabular-nums">
                              {c.unread_count}
                            </span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {unread.length > 0 && (
            <button
              onClick={() => openChat(null)}
              className="w-full px-4 py-3 text-sm font-semibold text-primary border-t border-base-200 hover:bg-base-200/60 transition-colors flex items-center justify-center gap-1.5"
            >
              Barcha xabarlar <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── HEADER ──────────────────── */
function Header({ sidebarWidth, onMobileToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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

      {/* Поиск и счётчик «онлайн» отсюда убраны.
          Поиск ничего не искал: поле не было ни к чему подключено, только
          подсвечивалось при фокусе — то есть обещало функцию, которой нет.
          Счётчик онлайна показывал число, на которое ментор всё равно никак
          не реагирует. */}

      <Notifications />

      {/* Разделительная палка убрана: колокольчик и профиль теперь один ряд
          однотипных элементов, разделять их нечем и незачем. */}

      {/* User profile */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          aria-expanded={showUserMenu}
          aria-label="Akkaunt menyusi"
          /* Было hover:scale — от наведения дёргался весь блок вместе с
             текстом. Подсветка фона спокойнее и не сдвигает соседей. */
          className={`flex items-center gap-2.5 p-1 sm:pr-3 rounded-full transition-colors ${
            showUserMenu ? 'bg-base-200' : 'hover:bg-base-200/70'
          }`}
        >
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={36} />
          <span className="hidden sm:block text-left leading-tight">
            <span className="block text-sm font-bold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block text-[11px] text-base-content/45">
              {ROLE_TITLE[role] || role}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={`hidden sm:block text-base-content/35 transition-transform ${
              showUserMenu ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Меню аккаунта.
            Ховеры теперь классами Tailwind, а не onMouseEnter/onMouseLeave с
            ручной подменой style: JS-обработчики не знают про :focus-visible,
            поэтому при навигации с клавиатуры пункты никак не подсвечивались. */}
        {showUserMenu && (
          <div
            role="menu"
            className="popover-surface fixed sm:absolute left-3 right-3 top-[4.25rem] sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-64 overflow-hidden animate-scale-in z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-base-200">
              <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={44} />
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-base-content/50 truncate">{user?.email}</div>
                <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {ROLE_TITLE[role] || role}
                </span>
              </div>
            </div>

            <div className="p-1.5">
              {/* Вело на /settings, а такого маршрута у ментора и методиста нет —
                  RoleView молча выкидывал их на дашборд. Профиль есть у всех. */}
              <button
                role="menuitem"
                onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-base-content/75 hover:bg-base-200 hover:text-base-content transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-base-200 grid place-items-center shrink-0">
                  <UserIcon size={14} />
                </span>
                Profil va sozlamalar
              </button>
              <button
                role="menuitem"
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-error/10 grid place-items-center shrink-0">
                  <LogOut size={14} />
                </span>
                Chiqish
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
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('lu-sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role;
  /* Страницы-«рабочие столы»: сами распоряжаются всей областью под шапкой и
     задают свой скролл.

     Карточка группы ментора (журнал) — из них: раньше она снимала отступы
     отрицательными маргинами, но `max-w-7xl mx-auto` контейнера оставался, и
     журнал упирался в 1280px по центру экрана. На широком мониторе со
     свёрнутым сайдбаром по бокам оставались пустые поля, а дни месяца при
     этом не помещались и уезжали в горизонтальную прокрутку.

     Проверяем ещё и роль: тот же путь `/groups/:id` у админа — обычная
     страница с отступами, ей полноэкранный режим не нужен. */
  const isMentorGroupPage = role === 'mentor' && /^\/groups\/[^/]+/.test(location.pathname);
  const isFullPage = ['/chat'].some(r => location.pathname.startsWith(r)) || isMentorGroupPage;

  /* ── Раскрытие по наведению ──────────────────────────────────────────────
     `collapsed` — закреплённое состояние, выбор пользователя, он же лежит в
     localStorage. Наведение его НЕ меняет: панель лишь временно выезжает.

     Ключевое решение — выезжает она ПОВЕРХ страницы, а не раздвигает её.
     Отступ контента считается от закреплённого состояния (`collapsed`), а не
     от того, что видно сейчас. Иначе каждое случайное движение мыши к левому
     краю сдвигало бы весь текст на 184px и обратно — читать во время этого
     невозможно.

     Только для мыши: на сенсорных экранах события наведения либо не приходят
     вовсе, либо «залипают» после тапа — панель осталась бы раскрытой навсегда. */
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const [hoverOpen, setHoverOpen] = useState(false);
  const hoverTimer = useRef(null);

  const expandedByHover = canHover && collapsed && hoverOpen;
  const visuallyCollapsed = collapsed && !expandedByHover;

  const openOnHover = () => {
    if (!canHover || !collapsed) return;
    clearTimeout(hoverTimer.current);
    // Небольшая задержка: без неё панель распахивается от любого пересечения
    // курсором левого края — например, по пути к кнопке «назад» браузера.
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
        <Sidebar
          role={role}
          collapsed={visuallyCollapsed}
          pinned={!collapsed}
          overlaying={expandedByHover}
          onToggle={() => { setCollapsed(!collapsed); setHoverOpen(false); }}
          onExpandSidebar={() => setCollapsed(false)}
          hoverProps={{
            onMouseEnter: openOnHover,
            onMouseLeave: closeOnLeave,
            // Клавиатура наведения не знает: без этого пользователь, идущий по
            // меню табом, водил бы фокус по невидимым подписям свёрнутой панели.
            onFocusCapture: () => collapsed && setHoverOpen(true),
            onBlurCapture: (e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) closeOnLeave();
            },
          }}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full animate-slide-right">
            <Sidebar role={role} collapsed={false} pinned onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Header */}
      <Header sidebarWidth={sidebarWidth} onMobileToggle={() => setMobileOpen(!mobileOpen)} />

      {/* Main content */}
      {/* overflow-x-hidden — страховка для всех панелей: одна распёртая
          таблица или длинное слово раньше давали горизонтальную прокрутку
          всей страницы, а вместе с ней съезжал и низ экрана (в чате под край
          уходило поле ввода). Пусть переполнение решает тот блок, который
          его создал, — своим внутренним скроллом. */}
      <main
        className="transition-all duration-300 pt-16 min-h-screen overflow-x-hidden"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Полноэкранные страницы (мессенджер) считают высоту от вьюпорта.
            Было `h-[calc(100vh-64px)]` без overflow-hidden: высота совпадала с
            экраном ровно впритык, и стоило появиться горизонтальной полосе
            прокрутки (~17px) — нижний край, а с ним поле ввода, уезжал под
            границу окна. `dvh` вдобавок учитывает выезжающие панели браузера
            на мобильных, где `vh` заведомо больше видимой области. */}
        {/* max-w-7xl (1280px) убран: на широком мониторе, тем более со
            свёрнутым сайдбаром, он оставлял по бокам сотни пикселей пустоты,
            хотя таблицам и сеткам карточек эта ширина как раз нужна. Поля
            задаёт только padding. */}
        <div className={isFullPage ? 'flex-1 flex flex-col h-[calc(100dvh-4rem)] overflow-hidden' : 'p-4 sm:p-6 lg:p-8'}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
