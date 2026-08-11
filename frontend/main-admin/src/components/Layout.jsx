import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Building2, Settings, LogOut, Menu, ChevronDown, Search, Puzzle,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useDashboard, useLeads, useFeatureRequests } from '../queries.js';

/**
 * Меню намеренно короткое — как у ментора.
 *
 * Было восемь пунктов: Дашборд, Заявки, Партнёры, Анонсы, Штрафы, Тарифы,
 * Доход, Настройки. Половина из них — редкие справочные экраны, которые
 * открывают раз в неделю, но каждый занимал строку наравне с ежедневной
 * работой. У ментора ту же задачу решили так: главная сущность разворачивается
 * прямо в меню, а всё, что «про неё», — вкладки внутри. Главная сущность здесь
 * партнёр.
 *
 * Куда делись остальные:
 *   Штрафы  — удалены, дисциплина сотрудников это зона SEO;
 *   Тарифы  — открываются из Настроек, там же они и показаны;
 *   Доход   — открывается с дашборда, это его же цифра в развёрнутом виде;
 *   Анонсы  — из Настроек, создаются редко.
 */
const nav = [
  { to: '/', label: 'Дашборд', Icon: LayoutDashboard, end: true },
  { type: 'partners' },
  { to: '/leads', label: 'Заявки', Icon: Inbox, badge: 'leads' },
  { to: '/features', label: 'Фичи', Icon: Puzzle, badge: 'featureRequests' },
  { to: '/settings', label: 'Настройки', Icon: Settings },
];

const itemBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors';
const itemIdle =
  'text-neutral-content/60 hover:bg-white/[0.07] hover:text-neutral-content';
const itemActive = 'bg-primary/[0.13] text-primary';

/**
 * Список партнёров прямо в меню.
 *
 * Отдельный компонент, а не ветка внутри сайдбара: список фильтруется и
 * сворачивается, и держать это состояние рядом с навигацией всей панели
 * незачем. Данные берём из уже загруженного дашборда — отдельный запрос за
 * тем же самым списком делать не за чем.
 */
function PartnersNav({ onNavigate }) {
  const { data } = useDashboard();
  const location = useLocation();
  const navigate = useNavigate();
  const partners = data?.partners ?? [];

  const inside = location.pathname.startsWith('/organizations');
  const [open, setOpen] = useState(true);
  const [q, setQ] = useState('');

  // Поиск появляется только когда список перестаёт помещаться в голове.
  const searchable = partners.length > 8;
  const shown = q.trim()
    ? partners.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    : partners;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${itemBase} w-full ${inside ? itemActive : itemIdle}`}
      >
        <Building2 size={19} className="shrink-0" />
        <span className="flex-1 text-left">Партнёры</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          {partners.length}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {searchable && (
            <div className="relative mb-1.5">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-content/35 pointer-events-none"
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск"
                aria-label="Поиск партнёра"
                // text-base до sm: iOS Safari зумит страницу на поле мельче 16px
                className="w-full rounded-lg bg-white/[0.06] pl-7 pr-2 py-1.5 text-base sm:text-xs
                           text-neutral-content placeholder:text-neutral-content/35
                           focus:outline-none focus:bg-white/[0.1]"
              />
            </div>
          )}

          <button
            onClick={() => { navigate('/organizations'); onNavigate?.(); }}
            className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              location.pathname === '/organizations'
                ? 'text-primary bg-primary/10'
                : 'text-neutral-content/45 hover:text-neutral-content hover:bg-white/[0.06]'
            }`}
          >
            Все партнёры
          </button>

          {shown.map((p) => {
            const active = location.pathname === `/organizations/${p.id}`;
            return (
              <button
                key={p.id}
                onClick={() => { navigate(`/organizations/${p.id}`); onNavigate?.(); }}
                title={p.name}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  active
                    ? 'bg-primary/[0.13] text-primary font-bold'
                    : 'text-neutral-content/55 hover:bg-white/[0.06] hover:text-neutral-content'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    p.status === 'active' ? 'bg-success'
                      : p.status === 'frozen' ? 'bg-error' : 'bg-warning'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}

          {shown.length === 0 && (
            <div className="px-2.5 py-2 text-xs text-neutral-content/35">
              {partners.length === 0 ? 'Партнёров пока нет' : 'Ничего не найдено'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ user, logout, onNavigate }) {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M';
  const { data: leads } = useLeads();
  const newLeads = (leads ?? []).filter((l) => l.status === 'new').length;
  const { data: pendingRequests } = useFeatureRequests('pending');

  return (
    <aside className="w-64 min-h-full bg-sidebar text-neutral-content flex flex-col py-5 px-3.5">
      <div className="px-2.5 pb-5">
        <img src="/logo-white.svg" alt="LevelUp Academy" className="h-7 w-auto" />
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item) => {
          if (item.type === 'partners') {
            return <PartnersNav key="partners" onNavigate={onNavigate} />;
          }
          const { to, label, Icon, end, badge } = item;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}
            >
              <Icon size={19} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge === 'leads' && newLeads > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-content">
                  {newLeads}
                </span>
              )}
              {badge === 'featureRequests' && (pendingRequests?.length ?? 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-content">
                  {pendingRequests.length}
                </span>
              )}
            </NavLink>
          );
        })}
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
  // на телефоне переход по пункту меню должен закрывать сам drawer,
  // иначе выбранная страница остаётся за шторкой
  const closeDrawer = () => {
    const el = document.getElementById('nav-drawer');
    if (el) el.checked = false;
  };

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
        <SidebarContent user={user} logout={logout} onNavigate={closeDrawer} />
      </div>
    </div>
  );
}
