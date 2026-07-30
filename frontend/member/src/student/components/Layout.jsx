import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, Trophy, LogOut, Send, Bell, Star, Zap } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { fmtNum } from '../format.js';
import { Avatar, C } from './ui.jsx';
import { api } from '../api.js';

/**
 * Каркас кабинета ученика.
 *
 * По референсам от Karis (скриншоты 043704 и 044228):
 *   · сайдбар СВЕТЛЫЙ, активный пункт — залитая лаймовая таблетка
 *     (у Mars такая же по смыслу, но оранжевая; лайм — наш брендовый)
 *   · шапка во всю ширину: аккаунт, монеты, энергия, уведомления
 *
 * «Энергия» — задел под будущую механику (Karis: «Энергия от задач это
 * доп-фича потом сделаем»). Значение сейчас не выдумывается: показываем
 * прочерк, пока на бэкенде нет источника, чтобы цифра не врала.
 */

const NAV = [
  { to: '/student', label: 'Главная', icon: Home, end: true },
  { to: '/lessons', label: 'Мои уроки', icon: BookOpen },
  { to: '/shop', label: 'Магазин', icon: ShoppingBag },
  { to: '/leaderboard', label: 'Рейтинг', icon: Trophy },
];

/* Монеты нужны в шапке на всех страницах, поэтому запрос здесь: Layout
   монтируется один раз на весь /student/*. Дублирует /student/home с
   Home.jsx — дешевле, чем общий контекст ради двух чисел. */
function useHeaderStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api.home().then((d) => { if (!cancelled) setStats(d.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return stats;
}

/* Счётчик в шапке: цветной кружок-значок + число. Форма одна, меняются
   цвет и иконка — так монеты и энергия читаются как элементы одной HUD. */
function Counter({ icon: Icon, value, fill, title }) {
  return (
    <span
      className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full"
      style={{ background: C.bg }}
      title={title}
    >
      <span
        className="w-7 h-7 rounded-full grid place-items-center text-white shrink-0"
        style={{ background: fill, boxShadow: `0 3px 8px ${fill}66` }}
      >
        <Icon size={14} strokeWidth={2.8} fill="currentColor" />
      </span>
      <span className="k-num text-[15px]" style={{ color: C.text }}>{value}</span>
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const stats = useHeaderStats();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Ученик';

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
      {/* ══ Шапка во всю ширину ══ */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-[70px] flex items-center gap-3 px-4 sm:px-6"
        style={{ background: C.card, boxShadow: '0 1px 0 #EBF0E2, 0 4px 16px rgba(29,36,23,.05)' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo-mark.svg" alt="" className="h-8 w-auto" />
          <span className="hidden sm:block text-[17px] font-extrabold tracking-[-0.01em]" style={{ color: C.text }}>
            LevelUp
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-2.5">
          <Counter icon={Star} fill={C.amber} value={stats ? fmtNum(stats.coins) : '···'} title="Монеты" />
          {/* Энергия — доп-фича, источника пока нет: не выдумываем число */}
          <div className="hidden sm:block">
            <Counter icon={Zap} fill={C.violet} value="—" title="Энергия (скоро)" />
          </div>

          <button
            type="button"
            title="Уведомления"
            aria-label="Уведомления"
            className="relative w-10 h-10 rounded-full grid place-items-center shrink-0 transition-colors"
            style={{ background: C.bg, color: C.muted }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
          >
            <Bell size={18} strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-2.5 h-10 pl-1 pr-1 sm:pr-3 rounded-full" style={{ background: C.bg }}>
            <Avatar name={name} size={34} />
            <div className="hidden sm:block leading-none pr-1">
              <div className="text-[13px] font-extrabold truncate max-w-[120px]" style={{ color: C.text }}>{name}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: C.muted }}>УЧЕНИК</div>
            </div>
          </div>
        </div>
      </header>

      {/* ══ Светлый сайдбар под шапкой ══ */}
      <aside
        className="hidden lg:flex fixed top-[70px] bottom-0 left-0 w-[236px] z-40 flex-col"
        style={{ background: C.card, borderRight: `1px solid ${C.line}` }}
      >
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="block">
              {({ isActive }) => (
                <span
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-extrabold transition-colors ${
                    isActive ? 'k-nav-on' : ''
                  }`}
                  style={isActive ? undefined : { color: C.muted }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = C.bg; e.currentTarget.style.color = C.text; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.7 : 2.2} className="shrink-0" />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            <button
              onClick={onBindTelegram}
              disabled={tgBusy}
              title="Привязать Telegram"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40 transition-colors"
              style={{ background: '#E4F1FF', color: '#1668B8' }}
            >
              <Send size={15} strokeWidth={2.6} /> Telegram
            </button>
            <button
              onClick={logout}
              title="Выйти"
              aria-label="Выйти"
              className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: '#FFE9E6', color: '#C0392B' }}
            >
              <LogOut size={17} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ Контент ══ */}
      <main className="pt-[70px] lg:pl-[236px] min-h-screen">
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
              <span className="flex flex-col items-center gap-1">
                <span
                  className="w-11 h-8 rounded-xl grid place-items-center"
                  style={isActive
                    ? { background: C.lime, color: C.ink }
                    : { background: 'transparent', color: C.muted }}
                >
                  <Icon size={19} strokeWidth={2.6} />
                </span>
                <span className="text-[10px] font-extrabold" style={{ color: isActive ? C.text : C.muted }}>
                  {label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
