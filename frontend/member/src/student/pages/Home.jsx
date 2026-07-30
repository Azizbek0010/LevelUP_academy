import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Trophy, Wallet, ChevronRight, Play, ClipboardCheck, BookOpen,
  Video, Clock, Users, Building2,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { IconTile, Ring, Pill, Tabs, Skeleton, RowSkeleton, EmptyState, ErrorState, Avatar, C } from '../components/ui.jsx';
import { fmtNum, fmtMoney, deadlineLabel } from '../format.js';
import { MOCK_TOPICS } from './Lessons.jsx';

/**
 * Главная кабинета ученика — собрана по референсу от Karis (скриншот
 * 044228): карточка курса с кольцом процента, плитки заданий с крупными
 * цветными значками, яркий баннер соревнования с таймером и призами,
 * ниже лидерборд с переключением группа / филиал.
 *
 * Учебные данные (уроки, прогресс) — мок, как и на «Моих уроках»:
 * расписания по дням на бэкенде пока нет. Монеты, долг и рейтинг —
 * настоящие, из /student/home.
 */

/* Обратный отсчёт до конца недели — «сезон» соревнования. Считается от
   реального времени, а не выдуманное число: иначе таймер соврёт. */
function useWeekCountdown() {
  const [left, setLeft] = useState(() => msToWeekEnd());
  useEffect(() => {
    const id = setInterval(() => setLeft(msToWeekEnd()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor(left / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}
function msToWeekEnd() {
  const now = new Date();
  const end = new Date(now);
  const daysToSunday = (7 - now.getDay()) % 7;
  end.setDate(now.getDate() + daysToSunday);
  end.setHours(23, 59, 59, 999);
  return end - now;
}

function TimeBox({ value, label }) {
  return (
    <div className="text-center">
      <div
        className="k-num text-[19px] px-2.5 py-1.5 rounded-xl min-w-[46px]"
        style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] font-bold mt-1 text-white/70">{label}</div>
    </div>
  );
}

/* Плитка задания: крупный цветной значок + название + статус.
   Форма взята из референса (карточки Unity / Typing у Mars). */
function TaskTile({ icon, hue, title, meta, cta, to, done }) {
  const inner = (
    <div className="k-card k-hover p-4 flex items-center gap-3.5 h-full">
      <IconTile icon={icon} hue={hue} size={52} />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-extrabold truncate" style={{ color: done ? C.muted : C.text }}>{title}</div>
        <div className="text-[12.5px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>{meta}</div>
        <div className="text-[12.5px] font-extrabold mt-1.5 inline-flex items-center gap-1" style={{ color: C.blue }}>
          {cta} <ChevronRight size={13} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [board, setBoard] = useState('branch');
  const [rows, setRows] = useState(null);
  const t = useWeekCountdown();

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

  /* Лидерборд: ответ — { period, top: [...], me }, массив лежит в .top
     (а не в корне: на этом я и сломался первым прогоном).
     Разреза «по группе» в API пока нет — вкладка «Филиал» показывает то,
     что реально отдаёт бэкенд, «Моя группа» помечена как скоро будет,
     чтобы не выдавать филиальный топ за групповой. */
  useEffect(() => {
    let cancelled = false;
    api.leaderboard('week')
      .then((d) => { if (!cancelled) setRows(Array.isArray(d.data?.top) ? d.data.top : []); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, []);

  const debt = Number(data?.totalDebt) || 0;
  const next = MOCK_TOPICS.find((x) => !x.locked && !x.done) ?? null;
  const doneCount = MOCK_TOPICS.filter((x) => x.done).length;
  const percent = Math.round((doneCount / MOCK_TOPICS.length) * 100);
  const hw = data?.upcomingHomework?.[0] ?? null;

  return (
    <>
      {/* ══ Курс: кольцо процента + продолжить ══ */}
      {next && (
        <div className="k-card p-5 sm:p-6 mb-4">
          <div className="flex items-center gap-5">
            <Ring percent={percent} size={92} thickness={8}>
              <div className="text-center leading-none">
                <div className="k-num text-[22px]" style={{ color: C.text }}>{percent}%</div>
              </div>
            </Ring>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: C.muted }}>
                Привет, {user?.firstName || 'ученик'}! Твой курс
              </div>
              <h1 className="text-[22px] sm:text-[27px] font-extrabold leading-[1.12] tracking-[-0.02em] mt-1" style={{ color: C.text }}>
                {next.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Pill hue="lime">Урок {next.day} из {MOCK_TOPICS.length}</Pill>
                <Pill hue="amber"><Star size={11} strokeWidth={3} fill="currentColor" /> +5 монет за тест</Pill>
              </div>
            </div>
            <Link to={`/lessons/${next.id}`} className="hidden sm:block shrink-0">
              <span
                className="k-hover k-pulse inline-flex items-center gap-2 font-extrabold text-[15px] px-6 py-3.5 rounded-2xl"
                style={{ background: C.lime, color: C.ink, boxShadow: `0 6px 18px ${C.lime}77` }}
              >
                <Play size={17} strokeWidth={3} fill={C.ink} /> Продолжить
              </span>
            </Link>
          </div>
          <Link to={`/lessons/${next.id}`} className="sm:hidden block mt-4">
            <span
              className="flex items-center justify-center gap-2 font-extrabold text-[15px] py-3.5 rounded-2xl"
              style={{ background: C.lime, color: C.ink }}
            >
              <Play size={17} strokeWidth={3} fill={C.ink} /> Продолжить урок
            </span>
          </Link>
        </div>
      )}

      {loading ? (
        <Skeleton h={108} count={3} />
      ) : error ? (
        <div className="k-card"><ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>
      ) : (
        <>
          {/* ══ Что сделать сегодня — плитки с цветными значками ══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaskTile
              icon={ClipboardCheck}
              hue="blue"
              title={next ? `Тест: ${next.title}` : 'Тесты'}
              meta="10 вопросов · 5 минут"
              cta="Пройти"
              to={next ? `/lessons/${next.id}` : '/tests'}
            />
            <TaskTile
              icon={BookOpen}
              hue="coral"
              title={hw ? hw.title : 'Домашних заданий нет'}
              meta={hw ? `сдать ${deadlineLabel(hw.deadline)}` : 'всё сдано'}
              cta={hw ? 'Сдать' : 'Открыть'}
              to="/homework"
              done={!hw}
            />
            <TaskTile
              icon={Video}
              hue="violet"
              title="Видеоурок"
              meta={next ? next.subtitle : 'разбор темы'}
              cta="Смотреть"
              to={next ? `/lessons/${next.id}` : '/videos'}
            />
            <TaskTile
              icon={Wallet}
              hue={debt > 0 ? 'coral' : 'teal'}
              title={debt > 0 ? `Долг ${fmtMoney(debt)}` : 'Оплата в порядке'}
              meta={debt > 0 ? 'скажи родителям' : 'задолженности нет'}
              cta="Подробнее"
              to="/shop"
              done={debt === 0}
            />
          </div>

          {/* ══ Сезон: яркий баннер с таймером и призами ══ */}
          <div
            className="relative overflow-hidden rounded-[22px] mt-4 p-5 sm:p-7"
            style={{ background: `linear-gradient(120deg, ${C.violet} 0%, #9B6BFF 45%, ${C.pink} 100%)` }}
          >
            {/* декор — крупные полупрозрачные монеты, без картинок и стикеров */}
            <span className="absolute -right-6 -top-8 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.10)' }} aria-hidden="true" />
            <span className="absolute right-24 -bottom-10 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
                  Соревнование недели
                </div>
                <div className="text-[30px] sm:text-[40px] font-extrabold leading-none tracking-[-0.03em] text-white mt-1.5">
                  СЕЗОН #12
                </div>
                <p className="text-[13.5px] font-semibold text-white/85 mt-2 max-w-sm">
                  Копи монеты и поднимайся в рейтинге — призы получат первые три места
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <TimeBox value={t.d} label="дн" />
                  <span className="text-white/50 font-extrabold">:</span>
                  <TimeBox value={t.h} label="час" />
                  <span className="text-white/50 font-extrabold">:</span>
                  <TimeBox value={t.m} label="мин" />
                  <span className="text-white/50 font-extrabold">:</span>
                  <TimeBox value={t.s} label="сек" />
                </div>
              </div>

              <div className="shrink-0 space-y-2">
                {[
                  { place: 1, coins: 300 },
                  { place: 2, coins: 200 },
                  { place: 3, coins: 70 },
                ].map(({ place, coins }) => (
                  <div
                    key={place}
                    className="flex items-center gap-3 pl-2.5 pr-3.5 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.16)' }}
                  >
                    <span
                      className="w-7 h-7 rounded-lg grid place-items-center k-num text-[13px]"
                      style={{ background: '#fff', color: C.violet }}
                    >
                      {place}
                    </span>
                    <span className="text-[13px] font-bold text-white/80">место</span>
                    <span className="k-num text-[17px] text-white ml-auto flex items-center gap-1.5">
                      {coins}
                      <Star size={14} strokeWidth={2.6} fill={C.amber} style={{ color: C.amber }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ Рейтинг: группа / филиал ══ */}
          <div className="k-card mt-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-3 flex-wrap">
              <h2 className="text-[16.5px] font-extrabold flex items-center gap-2.5" style={{ color: C.text }}>
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
                  const medal = [C.amber, '#B8C4B0', '#CD8B4E'][i];
                  return (
                    <div
                      key={r.studentId ?? i}
                      className="flex items-center gap-3 px-4 sm:px-5 py-2.5"
                      style={me ? { background: '#F7FFE8' } : undefined}
                    >
                      <span
                        className="w-8 h-8 rounded-xl grid place-items-center k-num text-[13.5px] shrink-0"
                        style={medal
                          ? { background: medal, color: '#fff' }
                          : { background: C.bg, color: C.muted }}
                      >
                        {r.rank ?? i + 1}
                      </span>
                      <Avatar name={`${r.firstName ?? ''} ${r.lastName ?? ''}`} size={34} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-extrabold truncate" style={{ color: C.text }}>
                          {r.firstName} {r.lastName}
                          {me && <span className="ml-1.5" style={{ color: C.limeDk }}>· ты</span>}
                        </div>
                      </div>
                      <span className="k-num text-[15px] flex items-center gap-1.5 shrink-0" style={{ color: C.text }}>
                        {fmtNum(r.coins)}
                        <Star size={13} strokeWidth={2.6} fill={C.amber} style={{ color: C.amber }} />
                      </span>
                    </div>
                  );
                })}
                <Link
                  to="/leaderboard"
                  className="flex items-center justify-center gap-1.5 py-3 text-[13.5px] font-extrabold"
                  style={{ color: C.blue }}
                >
                  Весь рейтинг <ChevronRight size={14} strokeWidth={3} />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
