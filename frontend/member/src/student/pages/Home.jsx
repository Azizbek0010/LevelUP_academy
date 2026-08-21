import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Trophy, Wallet, ChevronRight, ClipboardCheck, BookOpen,
  Video, Users, Award, GraduationCap, TrendingUp, ArrowRight, ShoppingBag,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { fmt, useI18n } from '../../i18n/index.jsx';
import {
  IconTile, Ring, Button, Pill, Tabs, Skeleton, RowSkeleton, EmptyState, ErrorState, Avatar, C,
  CountUp, ConfettiBurst, SurpriseCard, LevelBar, levelFromCoins,
} from '../components/ui.jsx';
import { useDailyStreak } from '../useDailyStreak.js';
import { deadlineLabel } from '../format.js';
import SmartReview from '../components/SmartReview.jsx';

/**
 * Главная кабинета ученика (2026-08-01, v3).
 *
 * v2 (кольцо + белые карточки-плитки) читалась как "скучный дженерик-
 * дашборд" — по фидбеку добавлен реальный визуальный фокус: цветной
 * герой-баннер (не белая карточка) и одна КРУПНАЯ рекомендованная задача
 * вместо однородной сетки одинаковых плиток. Иерархия и цвет решают
 * "интересность", не мультяшные элементы — они уже отклонены раньше.
 *
 * Всё по-прежнему из настоящих данных: coins → уровень (levelFromCoins),
 * визит-стрик (локально, useDailyStreak, подписан "на этом устройстве"),
 * место в рейтинге и группы — из /student/home, раньше не показывались.
 */

function TaskTile({ icon, hue, title, meta, to, done, delay = 0 }) {
  const inner = (
    <div className="k-card k-hover k-pop-in p-3.5 flex items-center gap-3 h-full" style={{ animationDelay: `${delay}ms` }}>
      <IconTile icon={icon} hue={hue} size={38} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold truncate" style={{ color: done ? C.muted : C.text }}>{title}</div>
        {/* Подпись плитки — зелёная (фирменный цвет), когда дело живое */}
        <div className="text-[12px] font-semibold mt-0.5 truncate" style={{ color: done ? C.muted : C.limeDk }}>{meta}</div>
      </div>
      <ChevronRight size={16} strokeWidth={2.4} style={{ color: C.muted }} className="shrink-0" />
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

/* Крупная рекомендованная задача — единственный визуальный фокус секции
   "что делать сегодня", вместо сетки одинаковых плиток. */
function FeaturedTask({ icon, hue, eyebrow, title, meta, cta, to }) {
  return (
    <Link to={to} className="k-card k-hover k-pop-in block p-5 sm:p-6 relative overflow-hidden">
      <div className="flex items-center gap-4">
        <IconTile icon={icon} hue={hue} size={58} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: HUES_TEXT[hue] }}>
            {eyebrow}
          </div>
          <div className="text-[18px] sm:text-[20px] font-extrabold leading-tight mt-1 truncate" style={{ color: C.text }}>
            {title}
          </div>
          <div className="text-[13px] font-semibold mt-1" style={{ color: C.limeDk }}>{meta}</div>
        </div>
        <Button hue={hue} className="hidden sm:inline-flex shrink-0">
          {cta} <ArrowRight size={15} strokeWidth={2.6} />
        </Button>
      </div>
      <Button hue={hue} className="sm:hidden w-full mt-4">
        {cta} <ArrowRight size={15} strokeWidth={2.6} />
      </Button>
    </Link>
  );
}
const HUES_TEXT = { lime: C.limeDk, violet: C.violet, blue: C.blue, coral: C.coral, amber: C.amber, teal: C.teal, pink: C.pink };

/* Компактная статистика в герое — три числа рядом, все настоящие. */
function StatChip({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.16)' }}>
        <Icon size={17} strokeWidth={2.2} color="#fff" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>{label}</div>
        <div className="text-[15px] leading-tight font-bold text-white">{children}</div>
      </div>
    </div>
  );
}

/* Значки-достижения — все посчитаны из настоящих данных ответа /student/home
   и лидерборда, ничего не выдумывается: просто другая подача тех же чисел.
   Подписи — из словаря (t.home.badge*). */
function badgesFrom(data, streak, t) {
  const list = [];
  if (streak >= 3) list.push({ icon: Award, hue: 'coral', label: fmt(t.home.badgeStreak, { n: streak }) });
  if ((data?.coins ?? 0) >= 100) list.push({ icon: Star, hue: 'lime', label: t.home.badgeCoins });
  if (Number(data?.totalDebt) === 0) list.push({ icon: Wallet, hue: 'teal', label: t.home.badgeNoDebt });
  return list;
}

export default function Home() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const toast = useToast();
  const streak = useDailyStreak();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [board, setBoard] = useState('branch');
  const [rows, setRows] = useState(null);
  const [celebrate, setCelebrate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .home()
      .then((d) => { if (!cancelled) setData(d.data); })
      .catch((err) => {
        if (cancelled) return;
        // без данных нельзя рисовать нули — читаются как настоящий баланс
        setError(err.message);
        toast(err.message, 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast, reloadKey]);

  /* Лидерборд: ответ — { period, top: [...], me }, массив лежит в .top.
     Разреза «по группе» в API пока нет — вкладка «Филиал» показывает то,
     что реально отдаёт бэкенд, «Моя группа» помечена как скоро будет. */
  useEffect(() => {
    let cancelled = false;
    api.leaderboard('week')
      .then((d) => { if (!cancelled) setRows(Array.isArray(d.data?.top) ? d.data.top : []); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  // Стрик — новый личный рекорд этого устройства → короткий залп конфетти,
  // не назойливо (только на 3/7/14/30, не каждый день подряд).
  useEffect(() => {
    if ([3, 7, 14, 30].includes(streak)) setCelebrate((k) => k + 1);
  }, [streak]);

  const hw = data?.upcomingHomework?.[0] ?? null;
  const { level, progress, toNext } = levelFromCoins(data?.coins);
  const badges = badgesFrom(data, streak, t);
  const rank = data?.rank?.rank ?? null;
  const groups = data?.groups ?? [];

  /* Рекомендованная задача — единственный крупный акцент секции.
     Долг НЕ показываем ребёнку крупно: он живёт тихим чипом в шапке.
     Приоритет: ближайшее ДЗ → тест. */
  const featured = hw
    ? { icon: BookOpen, hue: 'violet', eyebrow: t.home.homework, title: hw.title, meta: fmt(t.home.dueLabel, { date: deadlineLabel(hw.deadline, lang) }), cta: t.home.submit, to: '/homework' }
    : { icon: ClipboardCheck, hue: 'violet', eyebrow: t.home.taskOfDay, title: t.home.passTest, meta: t.home.passTestMeta, cta: t.home.go, to: '/tests' };

  return (
    <>
      {data?.payment?.currentInvoice && (
        <div className="k-card p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderLeft: '4px solid #f59e0b' }}>
          <Wallet size={22} style={{ color: '#d97706' }} />
          <div className="flex-1">
            <div className="font-extrabold" style={{ color: C.text }}>
              {lang === 'uz' ? "O‘qish uchun to‘lov" : 'Оплата за обучение'}
            </div>
            <div className="text-sm" style={{ color: C.muted }}>
              {lang === 'uz'
                ? `${data.payment.currentInvoice.billableLessons ?? '—'} ta dars uchun ${Math.round(data.payment.currentInvoice.remainingAmount).toLocaleString('uz-UZ')} so‘m. 5-sanagacha to‘lang.`
                : `${data.payment.currentInvoice.billableLessons ?? '—'} занятий: ${Math.round(data.payment.currentInvoice.remainingAmount).toLocaleString('ru-RU')} сум. Оплатите до 5-го числа.`}
            </div>
          </div>
        </div>
      )}
      {/* ══ Герой: цветной баннер — уровень, место в рейтинге, стрик ══ */}
      <div
        className="p-5 sm:p-6 mb-4 relative overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${C.lime}, ${C.limeDk})` }}
      >
        <ConfettiBurst fireKey={celebrate} />
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
        <span className="absolute right-16 -bottom-12 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
        <div className="relative flex items-center gap-4 sm:gap-5 flex-wrap sm:flex-nowrap">
          <Ring percent={Math.round(progress * 100)} size={82} thickness={6} color="#fff" track="rgba(255,255,255,0.28)">
            <div className="text-center leading-none">
              <div className="k-num text-[21px]" style={{ color: C.limeDk }}>{level}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {fmt(t.home.hello, { name: user?.firstName || (lang === 'uz' ? "o'quvchi" : lang === 'en' ? 'student' : 'ученик') })}
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-extrabold leading-[1.15] tracking-[-0.01em] mt-1 text-white">
              {fmt(t.home.levelTitle, { level })}
            </h1>
            <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {fmt(t.home.coinsToNext, { n: toNext, level: level + 1 })}
            </p>
          </div>
          {/* Mobil'da statistika o'z qatoriga tushadi (basis-full), aks holda
              min-w-0 o'rta ustun siqilib yozuvlar ring yonida ezilardi —
              flex-wrap bu yerda ish bermaydi, chunki sig'adigan element bor. */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0 basis-full sm:basis-auto">
            {rank && (
              <StatChip icon={TrendingUp} label={t.home.placeWeek}>
                #{rank}
              </StatChip>
            )}
            <StatChip icon={Award} label={t.home.visitStreak}>
              {streak}
            </StatChip>
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton h={108} count={3} />
      ) : error ? (
        <div className="k-card"><ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>
      ) : (
        <>
          {/* ══ Рекомендовано — крупный акцент вместо сетки одинаковых плиток ══ */}
          <FeaturedTask {...featured} />

          {/* ══ Остальное сегодня — компактный ряд, всегда 3 плитки ══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {featured.to !== '/tests' && (
              <TaskTile icon={ClipboardCheck} hue="violet" title={t.home.tests} meta={t.home.testsMeta} to="/tests" delay={0} />
            )}
            {featured.to !== '/homework' && (
              <TaskTile
                icon={BookOpen}
                hue="violet"
                title={hw ? hw.title : t.home.noHomework}
                meta={hw ? fmt(t.home.dueLabel, { date: deadlineLabel(hw.deadline, lang) }) : t.home.allDone}
                to="/homework"
                done={!hw}
                delay={40}
              />
            )}
            <TaskTile icon={Video} hue="violet" title={t.home.videos} meta={t.home.videosMeta} to="/videos" delay={80} />
            <TaskTile icon={ShoppingBag} hue="lime" title={t.home.shop} meta={t.home.shopMeta} to="/shop" delay={120} />
          </div>

          {/* ══ Мои группы — реальные данные, раньше нигде не показывались ══ */}
          {groups.length > 0 && (
            <div className="k-card mt-4 overflow-hidden" style={{ borderColor: C.limeLine }}>
              <div className="flex items-center gap-2.5 p-4 sm:p-5 pb-3" style={{ background: C.limeSoft }}>
                <IconTile icon={GraduationCap} hue="violet" size={34} />
                <h2 className="text-[15.5px] font-extrabold" style={{ color: C.limeDk }}>{t.home.myGroups}</h2>
              </div>
              <div className="pb-2">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold truncate" style={{ color: C.text }}>{g.name}</div>
                      <div className="text-[12.5px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>
                        {g.subject} · {g.mentorName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ Достижения — если есть что показать ══ */}
          {badges.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {badges.map((b, i) => (
                <Pill key={i} hue={b.hue}>
                  <b.icon size={11} strokeWidth={2.6} /> {b.label}
                </Pill>
              ))}
            </div>
          )}

          {/* Шкала уровня — всегда видна на дашборде, с подписью в фирменном цвете */}
          <div
            className="k-card mt-4 p-4 sm:p-5"
            style={{ borderColor: C.limeLine, background: C.limeSoft }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13.5px] font-extrabold" style={{ color: C.limeDk }}>
                {fmt(t.home.levelCard, { level })}
              </span>
              <span className="text-[12.5px] font-bold" style={{ color: C.limeDk }}>
                {fmt(t.home.levelCardMore, { n: toNext })}
              </span>
            </div>
            <LevelBar level={level} progress={progress} hue="lime" size="lg" />
          </div>

          {/* ══ Aqlli tahlil — REAL: /student/home → data.review (backend AI-review,
               Groq). review yo'q bo'lsa — komponent o'zi hech narsa chiqarmaydi. ══ */}
          {data?.review ? <SmartReview review={data.review} /> : null}
        </>
      )}

      {/* ══ Факт дня — не зависит от /student/home, поэтому показываем
           сразу, не дожидаясь его загрузки (иначе внизу пустая яма,
           пока герой выше уже отрисован). ══ */}
      <div className="mt-4">
        <SurpriseCard />
      </div>

      {/* ══ Рейтинг: группа / филиал — тоже своя, независимая загрузка ══ */}
      <div className="k-card mt-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-3 flex-wrap">
          <h2 className="text-[15.5px] font-extrabold flex items-center gap-2.5" style={{ color: C.text }}>
            <IconTile icon={Trophy} hue="amber" size={34} /> {t.home.rating}
          </h2>
          <Tabs
            value={board}
            onChange={setBoard}
            items={[{ value: 'branch', label: t.home.branch }, { value: 'group', label: t.home.myGroup }]}
          />
        </div>

        {board === 'group' ? (
          /* Групповой разрез бэкенд пока не отдаёт — говорим прямо,
             а не показываем филиальный топ под видом группового */
          <EmptyState
            icon={Users}
            hue="blue"
            title={t.home.groupRatingSoon}
            text={t.home.groupRatingSoonText}
          />
        ) : rows === null ? (
          <div className="px-4 sm:px-5 pb-5"><RowSkeleton count={3} height={52} /></div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            hue="amber"
            title={t.home.ratingEmpty}
            text={t.home.ratingEmptyText}
          />
        ) : (
          <div className="pb-2">
            {rows.slice(0, 5).map((r, i) => {
              const me = r.studentId === user?.id;
              const medal = [C.lime, '#FFB300', C.blue][i];
              return (
                <div
                  key={r.studentId ?? i}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5"
                  style={me ? { background: C.limeSoft } : undefined}
                >
                  <span
                    className="w-7 h-7 rounded-lg grid place-items-center k-num text-[13px] shrink-0"
                    style={medal
                      ? { background: medal, color: medal === '#FFB300' ? '#4A3400' : '#fff' }
                      : { background: C.bg, color: C.muted }}
                  >
                    {r.rank ?? i + 1}
                  </span>
                  <Avatar name={`${r.firstName ?? ''} ${r.lastName ?? ''}`} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold truncate" style={{ color: C.text }}>
                      {r.firstName} {r.lastName}
                      {me && <span className="ml-1.5" style={{ color: C.limeDk }}>{t.home.you}</span>}
                    </div>
                  </div>
                  <span className="k-num text-[14.5px] flex items-center gap-1.5 shrink-0" style={{ color: C.text }}>
                    <CountUp value={Number(r.coins) || 0} />
                    <Star size={13} strokeWidth={2.2} color={C.lime} />
                  </span>
                </div>
              );
            })}
            <Link
              to="/leaderboard"
              className="flex items-center justify-center gap-1.5 py-3 text-[13.5px] font-bold"
              style={{ color: C.blue }}
            >
              {t.home.fullRating} <ChevronRight size={14} strokeWidth={2.6} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
