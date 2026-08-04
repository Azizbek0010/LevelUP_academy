import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, Trophy, LogOut, Send, Bell, BellOff, Star, ChevronDown } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { Avatar, C, StreakFlame, CountUp, LevelBar, levelFromCoins, EmptyState, Modal } from './ui.jsx';
import { useDailyStreak } from '../useDailyStreak.js';
import { api } from '../api.js';

/**
 * Каркас кабинета ученика (2026-08-01, v2 — без маскота, приглушённая
 * палитра, см. ui.jsx для полной хроники правок по фидбеку).
 *
 *   · монеты — CountUp (докручиваются, а не мгновенно меняются)
 *   · стрик визитов — честно посчитан локально (useDailyStreak), не
 *     выдаётся за синхронизированное с сервером достижение
 *
 * «Энергия» — задел под будущую механику (Karis: «Энергия от задач это
 * доп-фича потом сделаем»). Значение не выдумывается: прочерк, пока на
 * бэкенде нет источника, чтобы цифра не врала.
 */

/* Тёмная шапка. Первая версия (взята из палитры Staff-панели) была
   почти чёрной — зелёный едва читался. Эта явно зелёная, а не тёмная
   вообще. */
const DARK_BG = 'linear-gradient(135deg, #21391A 0%, #142A0F 100%)';
const SIDEBAR_W = 252;

/* Тесты/ДЗ/Видео сознательно НЕ в общем меню: по замыслу Karis они открываются
   в контексте конкретной темы урока (Мои уроки → тема → её тест/ДЗ/видео),
   а не как отдельные глобальные списки. Пока "Мои уроки" — мок (см. Home.jsx),
   поэтому реальный тест сейчас доступен через плитку на Главной. */
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
   цвет и иконка — так монеты и энергия читаются как элементы одной HUD.
   Число — CountUp: докручивается при смене, а не просто перерисовывается. */
function Counter({ icon: Icon, value, fill, title }) {
  return (
    <span
      className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full"
      style={{ background: 'rgba(0,0,0,0.2)' }}
      title={title}
    >
      <span
        className="w-7 h-7 rounded-full grid place-items-center shrink-0"
        style={{ background: `${fill}40`, color: fill }}
      >
        <Icon size={14} strokeWidth={2.4} />
      </span>
      {typeof value === 'number' ? (
        <CountUp value={value} className="text-[15px]" style={{ color: '#fff' }} />
      ) : (
        <span className="k-num text-[15px] text-white">{value}</span>
      )}
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const stats = useHeaderStats();
  const streak = useDailyStreak();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Ученик';
  // Уведомления и профиль — выпадающие панели от кнопки (как в Mentor-панели),
  // не модалки по центру экрана: закрываются кликом снаружи или Escape.
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') { setShowNotifications(false); setShowProfile(false); } };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  /* TG-FRONT: привязка Telegram-бота (напоминания об оплате, объявления центра,
     вход без логин-кода).

     Раньше здесь была одна кнопка без состояния и с `catch {}`. Из-за этого:
       · привязанный ученик жал её снова и получал от бота «уже привязано»;
       · когда на сервере не задан TELEGRAM_BOT_USERNAME (эндпоинт отвечал 500),
         кнопка молча не делала НИЧЕГО — ни ошибки, ни следа в консоли.
     Теперь состояние читается с сервера, ошибка показывается, а отвязка есть
     прямо здесь — иначе потерявший доступ к Telegram не мог привязать новый
     (user_id в telegram_accounts уникален). */
  const [tg, setTg] = useState(null); // null — ещё не загружено
  const [tgBusy, setTgBusy] = useState(false);
  const [tgError, setTgError] = useState('');
  /* Кнопка привязанного Telegram открывает карточку аккаунта, а не отвязывает
     сразу: одно случайное касание — и связь потеряна, а восстановить её можно
     только заново пройдя привязку через бота. Отвязка живёт внутри карточки и
     требует второго, явного подтверждения. */
  const [tgModal, setTgModal] = useState(false);
  const [tgConfirmUnlink, setTgConfirmUnlink] = useState(false);

  const loadTgStatus = async () => {
    try {
      const res = await api.telegramStatus();
      setTg(res.data);
    } catch {
      // Статус — украшение: не смогли прочитать, показываем кнопку как есть.
      setTg({ configured: true, linked: false });
    }
  };

  useEffect(() => {
    loadTgStatus();
  }, []);

  const onBindTelegram = async () => {
    setTgBusy(true);
    setTgError('');
    try {
      const res = await api.telegramBindToken();
      window.open(res.data.deepLink, '_blank', 'noopener,noreferrer');
      // Бот подтверждает привязку не мгновенно — перечитываем через паузу,
      // чтобы кнопка сама переключилась на «привязан», без перезагрузки страницы.
      setTimeout(loadTgStatus, 4000);
    } catch (e) {
      setTgError(
        e?.status === 503
          ? 'Telegram hali sozlanmagan — administratorga ayting'
          : 'Ulab bo‘lmadi, keyinroq urinib ko‘ring',
      );
    } finally {
      setTgBusy(false);
    }
  };

  const closeTgModal = () => {
    setTgModal(false);
    // Сбрасываем шаг подтверждения: иначе повторное открытие карточки сразу
    // показало бы «точно отвязать?», хотя человек её только что открыл.
    setTgConfirmUnlink(false);
    setTgError('');
  };

  const onUnlinkTelegram = async () => {
    setTgBusy(true);
    setTgError('');
    try {
      await api.telegramUnlink();
      await loadTgStatus();
      closeTgModal();
    } catch {
      setTgError('Uzib bo‘lmadi, keyinroq urinib ko‘ring');
    } finally {
      setTgBusy(false);
    }
  };

  return (
    <div className="kid min-h-screen">
      {/* ══ Шапка во всю ширину ══ */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-20 flex items-center gap-3 px-4 sm:px-6"
        style={{ background: DARK_BG, boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo-white.svg" alt="LevelUp Academy" className="h-9 w-auto" />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <StreakFlame days={streak} />
          </div>
          <Counter icon={Star} fill={C.lime} value={stats ? stats.coins : '···'} title="Монеты" />
          {/* Энергия убрана из отображения: показывать бы пришлось только "—"
             (доп-фича, источника ещё нет) — заглушка выглядела хуже, чем
             её отсутствие. Вернуть, когда появятся реальные данные. */}

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              title="Уведомления"
              aria-label="Уведомления"
              aria-expanded={showNotifications}
              onClick={() => { setShowNotifications((v) => !v); setShowProfile(false); }}
              className="k-press-sm relative w-10 h-10 rounded-full grid place-items-center shrink-0 transition-colors"
              style={{
                background: showNotifications ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
                color: showNotifications ? '#fff' : 'rgba(255,255,255,0.75)',
              }}
            >
              <Bell size={18} strokeWidth={2.4} />
            </button>

            {showNotifications && (
              <div
                role="dialog"
                className="k-popover animate-scale-in fixed sm:absolute left-3 right-3 top-[4.75rem] sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[340px] overflow-hidden z-50"
              >
                <div className="px-4 py-3 text-[14.5px] font-extrabold" style={{ color: C.text, borderBottom: `1px solid ${C.line}` }}>
                  Уведомления
                </div>
                <EmptyState
                  icon={BellOff}
                  hue="blue"
                  title="Уведомлений пока нет"
                  text="Здесь будут появляться напоминания об оплате и объявления от школы."
                />
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              aria-expanded={showProfile}
              onClick={() => { setShowProfile((v) => !v); setShowNotifications(false); }}
              className="k-press-sm flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-full transition-colors"
              style={{ background: showProfile ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)' }}
            >
              <Avatar name={name} size={34} />
              <div className="hidden sm:block leading-none pr-1 text-left">
                <div className="text-[13px] font-extrabold truncate max-w-[120px] text-white">{name}</div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>УЧЕНИК</div>
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
                    <div className="text-[12px] font-semibold mt-0.5" style={{ color: C.muted }}>Ученик</div>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    role="menuitem"
                    onClick={logout}
                    className="k-press-sm w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-bold"
                    style={{ color: '#C0392B' }}
                  >
                    <LogOut size={16} strokeWidth={2.6} /> Выйти из аккаунта
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ Сайдбар под шапкой — тот же фон, что у страницы (без разделительной
           линии, без другого оттенка — раньше был чуть темнее контента,
           это читалось как шов). Пустое место под меню занято настоящим
           виджетом прогресса, а не просто увеличенными отступами. ══ */}
      <aside
        className="hidden lg:flex fixed top-20 bottom-0 left-0 z-40 flex-col"
        style={{ width: SIDEBAR_W, background: C.bg }}
      >
        <nav className="shrink-0 px-1.5 py-5 space-y-1.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="block">
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
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Виджет прогресса + Telegram/Выход — единой группой у низа сайдбара
            (настоящие данные: те же coins, что и в шапке). */}
        <div className="px-2.5 pb-3">
          <div className="rounded-xl p-4" style={{ background: C.card }}>
            <div className="text-[11px] font-semibold mb-2.5" style={{ color: C.muted }}>Твой прогресс</div>
            <LevelBar {...levelFromCoins(stats?.coins)} hue="lime" />
          </div>
        </div>

        <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2">
            {/* Сервер сам говорит, настроен ли Telegram (`configured`). Если нет —
                кнопки нет вовсе: предлагать действие, которое гарантированно
                вернёт ошибку, хуже, чем не предлагать. */}
            {tg?.configured === false ? (
              <div
                className="flex-1 py-2.5 text-center text-[12px] font-semibold rounded-xl"
                style={{ background: C.card, color: C.muted }}
              >
                Telegram sozlanmagan
              </div>
            ) : tg?.linked ? (
              <button
                onClick={() => setTgModal(true)}
                title={tg.username ? `Ulangan: @${tg.username}` : 'Telegram ulangan'}
                className="k-press-sm flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40 transition-colors"
                style={{ background: '#E8F6EC', color: '#1F7A3D' }}
              >
                <Send size={15} strokeWidth={2.6} />
                <span className="truncate">
                  {tg.username ? `@${tg.username}` : 'Ulangan'}
                </span>
              </button>
            ) : (
              <button
                onClick={onBindTelegram}
                disabled={tgBusy}
                title="Telegramni ulash"
                className="k-press-sm flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40 transition-colors"
                style={{ background: '#E4F1FF', color: '#1668B8' }}
              >
                <Send size={15} strokeWidth={2.6} /> Telegram
              </button>
            )}
            <button
              onClick={logout}
              title="Выйти"
              aria-label="Выйти"
              className="k-press-sm w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: '#FFE6E2', color: '#C0392B' }}
            >
              <LogOut size={17} strokeWidth={2.6} />
            </button>
          </div>
          {tgError && (
            <div className="mt-2 text-[11px] font-semibold leading-snug" style={{ color: '#C0392B' }}>
              {tgError}
            </div>
          )}
        </div>
      </aside>

      {/* ══ Карточка привязанного Telegram ══
          Показывает, КАКОЙ именно аккаунт привязан: увидев чужой @username,
          ученик поймёт, что бот ушёл на телефон брата, — по одному tg_chat_id
          это было невозможно. Отвязка тут же, но в два шага. */}
      {tgModal && tg?.linked && (
        <Modal title="Telegram" onClose={closeTgModal}>
          <div className="rounded-xl p-4 mb-4" style={{ background: C.bg }}>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                style={{ background: '#E4F1FF', color: '#1668B8' }}
              >
                <Send size={19} strokeWidth={2.6} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-extrabold truncate" style={{ color: C.text }}>
                  {tg.username ? `@${tg.username}` : tg.firstName || 'Telegram ulangan'}
                </div>
                {tg.firstName && tg.username && (
                  <div className="text-[12px] font-semibold truncate" style={{ color: C.muted }}>
                    {tg.firstName}
                  </div>
                )}
              </div>
            </div>
            {tg.linkedAt && (
              <div className="text-[12px] font-semibold mt-3" style={{ color: C.muted }}>
                Ulangan sana:{' '}
                {new Date(tg.linkedAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>

          <div className="text-[13px] leading-relaxed mb-4" style={{ color: C.muted }}>
            Botda <b style={{ color: C.text }}>/home</b>, <b style={{ color: C.text }}>/coins</b> va{' '}
            <b style={{ color: C.text }}>/rating</b> buyruqlari ishlaydi. Saytga parolsiz kirish
            ham shu ulanish orqali.
          </div>

          {tgError && (
            <div className="text-[12px] font-semibold mb-3" style={{ color: '#C0392B' }}>
              {tgError}
            </div>
          )}

          {/* Второй шаг: до него кнопка «Uzish» ничего не отвязывает. */}
          {tgConfirmUnlink ? (
            <div className="rounded-xl p-4" style={{ background: '#FFF2EF' }}>
              <div className="text-[13px] font-bold mb-1" style={{ color: '#8E2C1B' }}>
                Aniq uzmoqchimisiz?
              </div>
              <div className="text-[12px] leading-snug mb-3" style={{ color: '#8E2C1B' }}>
                Xabarlar to‘xtaydi va Telegram orqali kirish ishlamay qoladi. Qayta ulash uchun
                yana shu tugmadan o‘tish kerak.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onUnlinkTelegram}
                  disabled={tgBusy}
                  className="k-press-sm flex-1 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40"
                  style={{ background: '#C0392B', color: '#fff' }}
                >
                  {tgBusy ? 'Uzilmoqda…' : 'Ha, uz'}
                </button>
                <button
                  onClick={() => setTgConfirmUnlink(false)}
                  disabled={tgBusy}
                  className="k-press-sm flex-1 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40"
                  style={{ background: C.card, color: C.text, border: `1px solid ${C.line}` }}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setTgConfirmUnlink(true)}
              className="k-press-sm w-full py-2.5 rounded-xl text-[13px] font-extrabold"
              style={{ background: '#FFE6E2', color: '#C0392B' }}
            >
              Ulanishni uzish
            </button>
          )}
        </Modal>
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
