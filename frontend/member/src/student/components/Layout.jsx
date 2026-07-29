import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, Trophy, LogOut, Send, Bell, Star } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { fmtNum } from '../format.js';
import { Avatar, INK, HUE, textOn } from './ui.jsx';
import { api } from '../api.js';

/**
 * Каркас кабинета ученика.
 *
 * 2026-07-30, переписан: сайдбар был тёмно-зелёной панелью с лаймовой
 * «таблеткой» активного пункта — тот же язык, что у взрослой staff-панели.
 * Здесь он светлый, каждый пункт — отдельная карточка-наклейка со своим
 * закреплённым цветом (ребёнок запоминает раздел по цвету раньше, чем
 * читает подпись), активный физически выдвинут твёрдой тенью.
 *
 * Шапка: аккаунт слева, кошелёк с монетами и место в рейтинге справа —
 * обе величины видны всегда, даже когда данных ещё нет («—», а не
 * исчезающий элемент: пропажа читается как поломка).
 */

const NAV = [
  { to: '/student', label: 'Главная', icon: Home, hue: 'lime', end: true },
  { to: '/lessons', label: 'Мои уроки', icon: BookOpen, hue: 'sky' },
  { to: '/shop', label: 'Магазин', icon: 'shop', hue: 'grape' },
  { to: '/leaderboard', label: 'Рейтинг', icon: Trophy, hue: 'coral' },
];
const ICONS = { shop: ShoppingBag };
const iconOf = (icon) => (typeof icon === 'string' ? ICONS[icon] : icon);

function DesktopNavLink({ to, label, icon, hue, end }) {
  const Icon = iconOf(icon);
  return (
    <NavLink to={to} end={end} className="block">
      {({ isActive }) => (
        <span
          className="kid-press flex items-center gap-3 px-3.5 py-3 text-[15px] font-extrabold"
          style={{
            background: isActive ? HUE[hue] : 'transparent',
            color: isActive ? textOn(hue) : 'rgba(27,42,27,0.62)',
            border: `3px solid ${isActive ? INK : 'transparent'}`,
            borderRadius: 18,
            boxShadow: isActive ? `4px 4px 0 0 ${INK}` : 'none',
          }}
        >
          <Icon size={21} strokeWidth={2.7} className="shrink-0" />
          {label}
        </span>
      )}
    </NavLink>
  );
}

function MobileNavLink({ to, label, icon, hue, end }) {
  const Icon = iconOf(icon);
  return (
    <NavLink to={to} end={end} className="flex-1 grid place-items-center py-1.5">
      {({ isActive }) => (
        <span className="flex flex-col items-center gap-1">
          <span
            className="w-11 h-9 grid place-items-center"
            style={{
              background: isActive ? HUE[hue] : 'transparent',
              color: isActive ? textOn(hue) : 'rgba(27,42,27,0.5)',
              border: `2.5px solid ${isActive ? INK : 'transparent'}`,
              borderRadius: 13,
            }}
          >
            <Icon size={19} strokeWidth={2.7} />
          </span>
          <span className="text-[10.5px] font-extrabold" style={{ color: isActive ? INK : 'rgba(27,42,27,0.5)' }}>
            {label}
          </span>
        </span>
      )}
    </NavLink>
  );
}

/* Монеты/рейтинг нужны на всех страницах, а не только на Главной, поэтому
   запрос живёт здесь — Layout монтируется один раз на весь /student/*.
   Дублирует /student/home с Home.jsx: на этом масштабе дешевле, чем
   заводить общий контекст ради двух чисел. */
function useHeaderStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.home().then((d) => { if (!cancelled) setStats(d.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return stats;
}

/* Кошелёк: монета нарисована формой (круг с обводкой и знаком), а не
   иконкой в градиентном квадрате — так она читается как настоящая
   валюта, которую собирают. */
function CoinWallet({ value }) {
  return (
    <span
      className="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5"
      style={{ background: HUE.sun, border: `3px solid ${INK}`, borderRadius: 999, boxShadow: `3px 3px 0 0 ${INK}` }}
    >
      <span
        className="w-7 h-7 rounded-full grid place-items-center"
        style={{ background: '#FFF3C4', border: `2.5px solid ${INK}`, color: INK }}
        aria-hidden="true"
      >
        <Star size={14} strokeWidth={2.8} fill={INK} />
      </span>
      <span className="kid-num text-[17px]" style={{ color: INK }}>{value}</span>
    </span>
  );
}

function RankBadge({ value }) {
  return (
    <span
      className="inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5"
      style={{ background: HUE.grape, border: `3px solid ${INK}`, borderRadius: 999, boxShadow: `3px 3px 0 0 ${INK}` }}
      title="Место в рейтинге филиала"
    >
      <span
        className="w-7 h-7 rounded-full grid place-items-center"
        style={{ background: 'rgba(255,255,255,0.9)', border: `2.5px solid ${INK}`, color: INK }}
        aria-hidden="true"
      >
        <Trophy size={15} strokeWidth={2.8} />
      </span>
      <span className="kid-num text-[17px] text-white">{value}</span>
    </span>
  );
}

function TopBar() {
  const { user } = useAuth();
  const stats = useHeaderStats();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Ученик';

  return (
    <div className="flex items-center justify-between gap-3 mb-7">
      <div
        className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5"
        style={{ background: '#FFFDF7', border: `3px solid ${INK}`, borderRadius: 999, boxShadow: `3px 3px 0 0 ${INK}` }}
      >
        <Avatar name={name} size="sm" />
        <div className="leading-none">
          <div className="text-[14px] font-extrabold truncate max-w-[130px] sm:max-w-[190px]" style={{ color: INK }}>
            {name}
          </div>
          <div className="text-[10.5px] font-extrabold mt-0.5" style={{ color: 'rgba(27,42,27,0.45)' }}>УЧЕНИК</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <CoinWallet value={stats ? fmtNum(stats.coins) : '···'} />
        <div className="hidden sm:block">
          <RankBadge value={stats ? (stats.rank?.rank ? `#${stats.rank.rank}` : '—') : '···'} />
        </div>
        <button
          type="button"
          title="Уведомления"
          aria-label="Уведомления"
          className="kid-press w-11 h-11 grid place-items-center shrink-0"
          style={{ background: '#FFFDF7', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `3px 3px 0 0 ${INK}`, color: INK }}
        >
          <Bell size={18} strokeWidth={2.7} />
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  // TG-FRONT: привязка Telegram-бота (напоминания об оплате, объявления центра)
  const [tgBusy, setTgBusy] = useState(false);
  const onBindTelegram = async () => {
    setTgBusy(true);
    try {
      const res = await api.telegramBindToken();
      window.open(res.data.deepLink, '_blank', 'noopener,noreferrer');
    } catch {
      // тихо: кнопка — необязательное удобство, не блокирующий флоу
    } finally {
      setTgBusy(false);
    }
  };

  return (
    <div className="kid min-h-screen">
      {/* ── Сайдбар (десктоп) ── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full w-[264px] z-40 flex-col"
        style={{ background: '#FFFDF7', borderRight: `3px solid ${INK}` }}
      >
        <div className="flex items-center h-[76px] px-5 shrink-0" style={{ borderBottom: `3px solid ${INK}` }}>
          <img src="/logo-mark.svg" alt="LevelUp Academy" className="h-8 w-auto" />
          <span className="ml-2.5 text-[17px] font-extrabold leading-none" style={{ color: INK }}>
            LevelUp
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2.5">
          {NAV.map((item) => (
            <DesktopNavLink key={item.to} {...item} />
          ))}
        </nav>

        <div className="p-3.5 shrink-0" style={{ borderTop: `3px solid ${INK}` }}>
          <div
            className="flex items-center gap-2.5 p-2.5"
            style={{ background: '#F2F7EA', border: `3px solid ${INK}`, borderRadius: 18 }}
          >
            <Avatar name={name || 'У'} size="sm" />
            <div className="min-w-0 flex-1 leading-none">
              <div className="text-[13.5px] font-extrabold truncate" style={{ color: INK }}>{name || 'Ученик'}</div>
              <div className="text-[10.5px] font-extrabold mt-1" style={{ color: 'rgba(27,42,27,0.45)' }}>УЧЕНИК</div>
            </div>
            <button
              onClick={onBindTelegram}
              disabled={tgBusy}
              title="Привязать Telegram"
              aria-label="Привязать Telegram"
              className="kid-press w-8 h-8 grid place-items-center shrink-0 disabled:opacity-40"
              style={{ background: HUE.sky, border: `2.5px solid ${INK}`, borderRadius: 11, color: '#fff' }}
            >
              <Send size={14} strokeWidth={2.8} />
            </button>
            <button
              onClick={logout}
              title="Выйти"
              aria-label="Выйти"
              className="kid-press w-8 h-8 grid place-items-center shrink-0"
              style={{ background: HUE.coral, border: `2.5px solid ${INK}`, borderRadius: 11, color: '#fff' }}
            >
              <LogOut size={14} strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Контент ── */}
      <main className="lg:ml-[264px] p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 min-h-screen overflow-x-hidden">
        <div className="animate-page-enter max-w-5xl mx-auto">
          <TopBar />
          <Outlet />
        </div>
      </main>

      {/* ── Нижняя навигация (мобильные) ── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch h-[70px] px-1"
        style={{ background: '#FFFDF7', borderTop: `3px solid ${INK}` }}
      >
        {NAV.map((item) => (
          <MobileNavLink key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
