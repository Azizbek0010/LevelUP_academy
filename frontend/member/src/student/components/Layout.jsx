import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, ShoppingBag, Trophy, LogOut, Send, Bell, BellOff, Star, ChevronDown,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { Avatar, C, StreakFlame, CountUp, LevelBar, levelFromCoins, EmptyState, Modal } from './ui.jsx';
import { LANGS, useI18n } from '../../i18n/index.jsx';
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

/* Меню — минимально (4 пункта). «Мои уроки» ведёт на ОТДЕЛЬНУЮ страницу-
   меню (/study): разделы там разложены большими карточками, и ребёнок всегда
   понимает, где он. Никаких раскрывающихся списков в сайдбаре. */
const LESSON_PATHS = ['/study', '/lessons', '/tests', '/homework', '/videos'];

/* Меню строится из словаря: подписи пунктов живут в i18n (nav.*),
   маршруты и иконки — здесь. */
function buildNav(t, orgFeatures) {
  return {
    main: [{ to: '/student', label: t.nav.home, icon: Home, end: true }],
    lessons: { to: '/study', label: t.nav.study, icon: BookOpen },
    // Karis (13.08.2026): Shop — управляемая Main Admin'ом фича, партнёру
    // может быть не включена — тогда пункта в меню нет вообще.
    rest: [
      ...(orgFeatures?.shop ? [{ to: '/shop', label: t.nav.shop, icon: ShoppingBag }] : []),
      { to: '/leaderboard', label: t.nav.rating, icon: Trophy },
    ],
  };
}

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

/* K-PAY: месячный платёж — до 5-го числа. СУММУ долга ребёнку НЕ показываем
   (пугает и отвлекает) — только сколько дней осталось. ≤5 дней = янтарь,
   остальное время = зелёный: ребёнку остаётся лишь напомнить родителям. */
function daysUntilPayment() {
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59);
  if (now > due) due.setMonth(due.getMonth() + 1);
  return Math.ceil((due - now) / 86_400_000);
}

function DebtChip({ days }) {
  const { t } = useI18n();
  const near = days <= 5;
  const soft = near
    ? { bg: `${C.warn}24`, line: `${C.warn}4d`, icon: `${C.warn}40`, fg: '#F0C96B' }
    : { bg: `${C.lime}24`, line: `${C.lime}4d`, icon: `${C.lime}40`, fg: '#BDE8A6' };
  return (
    <span
      className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3.5 rounded-full shrink-0"
      title={t.header.debtTitle}
      style={{ background: soft.bg, border: `1px solid ${soft.line}` }}
    >
      <span className="w-7 h-7 rounded-full grid place-items-center shrink-0" style={{ background: soft.icon }}>
        <CalendarClock size={14} strokeWidth={2.4} color={soft.fg} />
      </span>
      <span className="k-num text-[14px] font-bold" style={{ color: soft.fg }}>
        {days} {t.header.days(days)}
      </span>
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { lang, setLanguage, t } = useI18n();
  const nav = buildNav(t, user?.orgFeatures);
  const location = useLocation();
  const stats = useHeaderStats();
  const streak = useDailyStreak();
  const inLessons = LESSON_PATHS.some((p) => location.pathname.startsWith(p));
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || (lang === 'uz' ? "O'quvchi" : lang === 'en' ? 'Student' : 'Ученик');
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
      setTgError(e?.status === 503 ? t.header.tgNotConfigured : t.header.tgBindError);
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
      setTgError(t.header.tgUnlinkError);
    } finally {
      setTgBusy(false);
    }
  };

  return (
    <div className="kid min-h-screen">
      {/* ══ Шапка во всю ширину ══ */}
      <header
        className="fixed top-0 inset-x-0 z-50 h-20 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-6"
        style={{ background: DARK_BG, boxShadow: '0 1px 0 rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Полный логотип 448×80 на телефоне не влезает рядом с чипом оплаты
              и кнопками — до md показываем только квадратный знак, слово на
              планшете/десктопе. */}
          <img src="/logo-mark.svg" alt="LevelUp Academy" className="h-9 w-auto md:hidden" />
          <img src="/logo-white.svg" alt="LevelUp Academy" className="h-9 w-auto hidden md:block" />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <StreakFlame days={streak} />
          </div>
          {/* Оплата — ВСЕГДА на виду, но без суммы: только сколько дней осталось
             до месячного платежа (зелёный, янтарь за 5 дней). На телефоне чип
             вместо монет, на десктопе — рядом. */}
          <DebtChip days={daysUntilPayment()} />
          <div className="hidden sm:block">
            <Counter icon={Star} fill={C.lime} value={stats ? stats.coins : '···'} title={t.header.coins} />
          </div>
          {/* Энергия убрана из отображения: показывать бы пришлось только "—"
             (доп-фича, источника ещё нет) — заглушка выглядела хуже, чем
             её отсутствие. Вернуть, когда появятся реальные данные. */}

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              title={t.header.notifications}
              aria-label={t.header.notifications}
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
                  {t.header.notifications}
                </div>
                <EmptyState
                  icon={BellOff}
                  hue="blue"
                  title={t.header.noNotifsTitle}
                  text={t.header.noNotifsText}
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
                <div className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{t.header.student}</div>
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
                    <div className="text-[12px] font-semibold mt-0.5" style={{ color: C.muted }}>{t.header.studentRole}</div>
                  </div>
                </div>
                <div className="p-1.5">
                  {/* Telegram живёт здесь, а не в подвале сайдбара: это настройка
                      аккаунта, и место ей рядом с выходом, а не под меню разделов.
                      Скрыт целиком, когда сервер отвечает configured: false —
                      предлагать действие, которое заведомо вернёт ошибку, хуже,
                      чем не предлагать вовсе. Плюс (Karis, 13.08.2026) — Main
                      Admin мог не включить Telegram-интеграцию партнёру вообще. */}
                  {tg?.configured !== false && user?.orgFeatures?.telegramIntegration && (
                    <>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setShowProfile(false);
                          if (tg?.linked) setTgModal(true);
                          else onBindTelegram();
                        }}
                        disabled={tgBusy}
                        className="k-press-sm w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-bold disabled:opacity-40"
                        style={{ color: tg?.linked ? C.text : '#1668B8' }}
                      >
                        <Send size={16} strokeWidth={2.6} className="shrink-0" />
                        <span className="truncate">
                          {tg?.linked
                            ? tg.username
                              ? `@${tg.username}`
                              : t.header.tgLinked
                            : t.header.tgBind}
                        </span>
                        {tg?.linked && (
                          <span
                            className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                            style={{ background: '#E8F6EC', color: '#1F7A3D' }}
                          >
                            {t.header.tgBadge}
                          </span>
                        )}
                      </button>

                      {tgError && (
                        <div
                          className="px-3 pb-1.5 text-[11px] font-semibold leading-snug"
                          style={{ color: '#C0392B' }}
                        >
                          {tgError}
                        </div>
                      )}

                      <div className="my-1.5 mx-3" style={{ borderTop: `1px solid ${C.line}` }} />
                    </>
                  )}

                  {/* Язык — как select: текущий язык и раскрывающийся выбор.
                      Переключатель внутри профиля, чтобы не занимать шапку. */}
                  <div className="px-3 pt-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] mb-1" style={{ color: C.muted }}>
                      {t.langSwitch.label}
                    </div>
                    <div className="flex gap-1.5">
                      {LANGS.map((l) => {
                        const on = l.code === lang;
                        return (
                          <button
                            key={l.code}
                            role="menuitemradio"
                            aria-checked={on}
                            onClick={() => setLanguage(l.code)}
                            className="k-press-sm flex-1 px-3 py-2 rounded-lg text-[13px] font-extrabold transition-colors"
                            style={on
                              ? { background: C.limeSoft, color: C.limeDk, border: `1px solid ${C.limeLine}` }
                              : { background: 'transparent', color: C.muted, border: `1px solid transparent` }}
                          >
                            {l.short} · {l.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="my-1.5 mx-3" style={{ borderTop: `1px solid ${C.line}` }} />

                  <button
                    role="menuitem"
                    onClick={logout}
                    className="k-press-sm w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-bold"
                    style={{ color: '#C0392B' }}
                  >
                    <LogOut size={16} strokeWidth={2.6} /> {t.header.logout}
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
        <nav className="shrink-0 px-1.5 py-5 space-y-1">
          {nav.main.map(({ to, label, icon: Icon, end }) => (
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

          {/* «Мои уроки» — ведёт на отдельную страницу-меню (/study) */}
          <NavLink to={nav.lessons.to} className="block">
            {({ isActive }) => (
              <span
                className="k-press-sm flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[15.5px] font-bold transition-colors"
                style={{
                  color: inLessons ? C.learn : C.muted,
                  background: inLessons ? `${C.learn}1c` : 'transparent',
                }}
                onMouseEnter={(e) => { if (!inLessons) { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.text; } }}
                onMouseLeave={(e) => { if (!inLessons) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; } }}
              >
                <BookOpen size={20} strokeWidth={inLessons ? 2.4 : 2} className="shrink-0" />
                {nav.lessons.label}
              </span>
            )}
          </NavLink>

          {nav.rest.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="block">
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

        {/* Виджет прогресса у низа сайдбара (настоящие данные: те же coins,
            что и в шапке). */}
        <div className="px-2.5 pb-3">
          <div
            className="rounded-xl p-4"
            style={{ background: C.limeSoft, border: `1px solid ${C.limeLine}` }}
          >
            <div className="text-[11px] font-semibold mb-2.5" style={{ color: C.limeDk }}>{t.header.progress}</div>
            <LevelBar {...levelFromCoins(stats?.coins)} hue="lime" />
          </div>
        </div>

        {/* Подвала здесь больше нет. Telegram и выход переехали в меню аккаунта
            в шапке: и то и другое — про аккаунт, а сайдбар отвечает за разделы
            кабинета. Дублировать выход в двух местах значило бы держать красную
            кнопку прямо под навигацией, куда целятся мышью чаще всего. */}
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
                  {tg.username ? `@${tg.username}` : tg.firstName || t.header.tgLinked}
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
                {t.header.tgLinkedAt}{' '}
                {new Date(tg.linkedAt).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </div>
            )}
          </div>

          <div className="text-[13px] leading-relaxed mb-4" style={{ color: C.muted }}>
            {/* Команды в тексте выделяем жирным: строка словаря — обычный текст,
                разбиваем по /home /coins /rating и оборачиваем их в <b>. */}
            {t.header.tgCommands.split(/(\/home|\/coins|\/rating)/).map((part, i) =>
              part.startsWith('/') ? (
                <b key={i} style={{ color: C.text }}>{part}</b>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
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
                {t.header.tgConfirmTitle}
              </div>
              <div className="text-[12px] leading-snug mb-3" style={{ color: '#8E2C1B' }}>
                {t.header.tgConfirmText}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onUnlinkTelegram}
                  disabled={tgBusy}
                  className="k-press-sm flex-1 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40"
                  style={{ background: '#C0392B', color: '#fff' }}
                >
                  {tgBusy ? t.header.tgBusy : t.header.tgYes}
                </button>
                <button
                  onClick={() => setTgConfirmUnlink(false)}
                  disabled={tgBusy}
                  className="k-press-sm flex-1 py-2.5 rounded-xl text-[13px] font-extrabold disabled:opacity-40"
                  style={{ background: C.card, color: C.text, border: `1px solid ${C.line}` }}
                >
                  {t.header.tgCancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setTgConfirmUnlink(true)}
              className="k-press-sm w-full py-2.5 rounded-xl text-[13px] font-extrabold"
              style={{ background: '#FFE6E2', color: '#C0392B' }}
            >
              {t.header.tgUnlink}
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

      {/* ══ Нижняя навигация (мобильные) — 4 слота, без раскрытия ══ */}
      <nav
        /* iPhone home-indicator: панель РАСТЁТ на safe-area (calc), а не сжимает
           контент внутри фиксированной высоты — иначе иконки+подписи (≈50px)
           не помещались бы в ужатой до ~34px зоне и торчали над панелью. */
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch px-2"
        style={{
          height: 'calc(68px + env(safe-area-inset-bottom))',
          background: C.card,
          borderTop: `1px solid ${C.line}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <NavLink to="/student" end className="flex-1 grid place-items-center">
          {({ isActive }) => (
            <span className="k-press-sm flex flex-col items-center gap-1">
              <span
                className="w-11 h-8 rounded-xl grid place-items-center"
                style={isActive ? { background: C.action, color: '#fff' } : { background: 'transparent', color: C.muted }}
              >
                <Home size={19} strokeWidth={2.6} />
              </span>
              <span className="text-[10px] font-extrabold" style={{ color: isActive ? C.text : C.muted }}>{t.nav.mobileHome}</span>
            </span>
          )}
        </NavLink>

        <NavLink to={nav.lessons.to} className="flex-1 grid place-items-center">
          {({ isActive }) => (
            <span className="k-press-sm flex flex-col items-center gap-1">
              <span
                className="w-11 h-8 rounded-xl grid place-items-center"
                style={isActive || inLessons ? { background: C.learn, color: '#fff' } : { background: 'transparent', color: C.muted }}
              >
                <BookOpen size={19} strokeWidth={2.6} />
              </span>
              <span className="text-[10px] font-extrabold" style={{ color: isActive || inLessons ? C.text : C.muted }}>{t.nav.mobileLessons}</span>
            </span>
          )}
        </NavLink>

        {nav.rest.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="flex-1 grid place-items-center">
            {({ isActive }) => (
              <span className="k-press-sm flex flex-col items-center gap-1">
                <span
                  className="w-11 h-8 rounded-xl grid place-items-center"
                  style={isActive ? { background: C.action, color: '#fff' } : { background: 'transparent', color: C.muted }}
                >
                  <Icon size={19} strokeWidth={2.6} />
                </span>
                <span className="text-[10px] font-extrabold" style={{ color: isActive ? C.text : C.muted }}>{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
