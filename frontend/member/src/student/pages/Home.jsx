import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Trophy, Wallet, ChevronRight, ClipboardCheck, BookOpen,
  Video, Users, Award, GraduationCap, TrendingUp, ArrowRight,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import {
  IconTile, Ring, Button, Pill, Tabs, Skeleton, RowSkeleton, EmptyState, ErrorState, Avatar, C,
  CountUp, ConfettiBurst, SurpriseCard, levelFromCoins,
} from '../components/ui.jsx';
import { useDailyStreak } from '../useDailyStreak.js';
import { fmtMoney, deadlineLabel } from '../format.js';

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
        <div className="text-[12px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>{meta}</div>
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
          <div className="text-[13px] font-semibold mt-1" style={{ color: C.muted }}>{meta}</div>
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
   и лидерборда, ничего не выдумывается: просто другая подача тех же чисел. */
function badgesFrom(data, streak) {
  const list = [];
  if (streak >= 3) list.push({ icon: Award, hue: 'coral', label: `${streak} дня подряд` });
  if ((data?.coins ?? 0) >= 100) list.push({ icon: Star, hue: 'lime', label: 'Собрал 100+ монет' });
  if (Number(data?.totalDebt) === 0) list.push({ icon: Wallet, hue: 'teal', label: 'Оплата в порядке' });
  return list;
}

export default function Home() {
  const { user } = useAuth();
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

  const debt = Number(data?.totalDebt) || 0;
  const hw = data?.upcomingHomework?.[0] ?? null;
  const { level, progress, toNext } = levelFromCoins(data?.coins);
  const badges = badgesFrom(data, streak);
  const rank = data?.rank?.rank ?? null;
  const groups = data?.groups ?? [];

  /* Рекомендованная задача — единственный крупный акцент секции, вместо
     четырёх одинаковых плиток. Приоритет: долг → ближайшее ДЗ → тесты. */
  const featured = debt > 0
    ? { icon: Wallet, hue: 'coral', eyebrow: 'Оплата', title: `Долг ${fmtMoney(debt)}`, meta: 'скажи родителям', cta: 'Подробнее', to: '/shop' }
    : hw
      ? { icon: BookOpen, hue: 'coral', eyebrow: 'Домашнее задание', title: hw.title, meta: `сдать ${deadlineLabel(hw.deadline)}`, cta: 'Сдать', to: '/homework' }
      : { icon: ClipboardCheck, hue: 'blue', eyebrow: 'Задача дня', title: 'Пройди тест по теме', meta: 'проверь себя, получи монеты', cta: 'Пройти', to: '/tests' };

  return (
    <>
      {/* ══ Герой: цветной баннер — уровень, место в рейтинге, стрик ══ */}
      <div
        className="p-5 sm:p-6 mb-4 relative overflow-hidden rounded-2xl"
        style={{ background: `linear-gradient(135deg, ${C.lime}, ${C.limeDk})` }}
      >
        <ConfettiBurst fireKey={celebrate} />
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
        <span className="absolute right-16 -bottom-12 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
        <div className="relative flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <Ring percent={Math.round(progress * 100)} size={82} thickness={6} color="#fff" track="rgba(255,255,255,0.28)">
            <div className="text-center leading-none">
              <div className="k-num text-[21px]" style={{ color: C.limeDk }}>{level}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Привет, {user?.firstName || 'ученик'}
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-extrabold leading-[1.15] tracking-[-0.01em] mt-1 text-white">
              Уровень {level}
            </h1>
            <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              ещё {toNext} монет до уровня {level + 1}
            </p>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            {rank && (
              <StatChip icon={TrendingUp} label="место (неделя)">
                #{rank}
              </StatChip>
            )}
            <StatChip icon={Award} label="серия визитов">
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

          {/* ══ Остальное сегодня — компактный ряд ══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {featured.to !== '/tests' && (
              <TaskTile icon={ClipboardCheck} hue="blue" title="Тесты" meta="проверь себя" to="/tests" delay={0} />
            )}
            {featured.to !== '/homework' && (
              <TaskTile
                icon={BookOpen}
                hue="coral"
                title={hw ? hw.title : 'Домашних заданий нет'}
                meta={hw ? `сдать ${deadlineLabel(hw.deadline)}` : 'всё сдано'}
                to="/homework"
                done={!hw}
                delay={40}
              />
            )}
            <TaskTile icon={Video} hue="violet" title="Видеоуроки" meta="разбор темы в записи" to="/videos" delay={80} />
            {featured.to !== '/shop' && (
              <TaskTile
                icon={Wallet}
                hue={debt > 0 ? 'coral' : 'teal'}
                title={debt > 0 ? `Долг ${fmtMoney(debt)}` : 'Оплата в порядке'}
                meta={debt > 0 ? 'скажи родителям' : 'задолженности нет'}
                to="/shop"
                done={debt === 0}
                delay={120}
              />
            )}
          </div>

          {/* ══ Мои группы — реальные данные, раньше нигде не показывались ══ */}
          {groups.length > 0 && (
            <div className="k-card mt-4 overflow-hidden">
              <div className="flex items-center gap-2.5 p-4 sm:p-5 pb-3">
                <IconTile icon={GraduationCap} hue="violet" size={34} />
                <h2 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>Мои группы</h2>
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
            <IconTile icon={Trophy} hue="amber" size={34} /> Рейтинг
          </h2>
          <Tabs
            value={board}
            onChange={setBoard}
            items={[{ value: 'branch', label: 'Филиал' }, { value: 'group', label: 'Моя группа' }]}
          />
        </div>

        {board === 'group' ? (
          /* Групповой разрез бэкенд пока не отдаёт — говорим прямо,
             а не показываем филиальный топ под видом группового */
          <EmptyState
            icon={Users}
            hue="blue"
            title="Рейтинг по группе скоро"
            text="Сейчас доступен рейтинг по филиалу — переключи вкладку."
          />
        ) : rows === null ? (
          <div className="px-4 sm:px-5 pb-5"><RowSkeleton count={3} height={52} /></div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            hue="amber"
            title="Рейтинг пока пуст"
            text="Никто ещё не заработал монеты за эту неделю. Будь первым!"
          />
        ) : (
          <div className="pb-2">
            {rows.slice(0, 5).map((r, i) => {
              const me = r.studentId === user?.id;
              const medal = [C.amber, '#9BA39A', '#B08655'][i];
              return (
                <div
                  key={r.studentId ?? i}
                  className="flex items-center gap-3 px-4 sm:px-5 py-2.5"
                  style={me ? { background: `${C.lime}0d` } : undefined}
                >
                  <span
                    className="w-7 h-7 rounded-lg grid place-items-center k-num text-[13px] shrink-0"
                    style={medal
                      ? { background: medal, color: '#fff' }
                      : { background: C.bg, color: C.muted }}
                  >
                    {r.rank ?? i + 1}
                  </span>
                  <Avatar name={`${r.firstName ?? ''} ${r.lastName ?? ''}`} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold truncate" style={{ color: C.text }}>
                      {r.firstName} {r.lastName}
                      {me && <span className="ml-1.5" style={{ color: C.limeDk }}>· ты</span>}
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
              Весь рейтинг <ChevronRight size={14} strokeWidth={2.6} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
