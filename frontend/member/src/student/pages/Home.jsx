import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trophy, Wallet, Users, BookOpen, Play, ArrowRight, Clock } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { StatTile, Panel, Pill, Skeleton, EmptyState, ErrorState, Button, INK, HUE, textOn } from '../components/ui.jsx';
import { fmtNum, fmtMoney, fmtDateTime, deadlineLabel } from '../format.js';
import { MOCK_TOPICS } from './Lessons.jsx';

/**
 * Главная кабинета ученика.
 *
 * 2026-07-30, переписана. Была тремя равными плитками-показателями и двумя
 * равными панелями — это композиция корпоративного дашборда: всё одного
 * веса, ребёнку непонятно, что делать. У детских обучающих приложений
 * ровно один доминирующий элемент — «продолжить с того места, где
 * остановился», и всё остальное подчинено ему по размеру.
 *
 * Здесь так же: огромная карточка следующего урока занимает верх экрана,
 * показатели ушли ниже и стали второстепенными.
 */
export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .home()
      .then((d) => { if (!cancelled) setData(d.data); })
      .catch((err) => {
        if (cancelled) return;
        // без данных нельзя рисовать нули — они читаются как настоящий баланс/долг
        setError(err.message);
        toast(err.message, 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast, reloadKey]);

  const debt = Number(data?.totalDebt) || 0;

  /* Следующий урок — из того же мока, что и страница «Мои уроки»
     (реального расписания на бэкенде пока нет, см. Lessons.jsx).
     Когда появится эндпоинт — меняется только этот вызов. */
  const nextTopic = MOCK_TOPICS.find((t) => !t.locked && !t.done) ?? null;
  const doneCount = MOCK_TOPICS.filter((t) => t.done).length;
  const progress = Math.round((doneCount / MOCK_TOPICS.length) * 100);

  return (
    <>
      {/* ── Доминанта: следующий урок ── */}
      {nextTopic && (
        <div
          className="relative overflow-hidden mb-5 p-6 sm:p-8"
          style={{ background: HUE.sky, border: `3px solid ${INK}`, borderRadius: 26, boxShadow: `6px 6px 0 0 ${INK}` }}
        >
          <nextTopic.icon
            size={230}
            strokeWidth={2}
            className="absolute -right-10 -bottom-16 pointer-events-none text-white"
            style={{ opacity: 0.14 }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-white/75">
              Привет, {user?.firstName || 'ученик'}! Твой следующий урок
            </div>
            <h1 className="text-white font-extrabold leading-[1.05] tracking-[-0.02em] text-[32px] sm:text-[44px] mt-2">
              {nextTopic.title}
            </h1>
            <p className="text-white/85 font-bold text-[15px] mt-2">{nextTopic.subtitle}</p>

            {/* Прогресс курса — полоса с обводкой, а не тонкая линия */}
            <div className="mt-6 max-w-sm">
              <div className="flex items-center justify-between text-[12px] font-extrabold text-white/80 mb-1.5">
                <span>Пройдено {doneCount} из {MOCK_TOPICS.length}</span>
                <span className="kid-num">{progress}%</span>
              </div>
              <div
                className="h-5 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.3)', border: `3px solid ${INK}`, borderRadius: 999 }}
              >
                <div className="h-full" style={{ width: `${progress}%`, background: HUE.lime, borderRight: progress > 0 && progress < 100 ? `3px solid ${INK}` : 'none' }} />
              </div>
            </div>

            <Link to={`/lessons/${nextTopic.id}`} className="inline-block mt-6">
              <span
                className="kid-press inline-flex items-center gap-2.5 font-extrabold text-[17px] px-7 py-3.5"
                style={{ background: HUE.lime, color: INK, border: `3px solid ${INK}`, borderRadius: 18, boxShadow: `5px 5px 0 0 ${INK}` }}
              >
                <Play size={19} strokeWidth={3} fill={INK} /> Продолжить урок
              </span>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton h={132} count={3} />
      ) : error ? (
        <div className="kid-card"><ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>
      ) : (
        <>
          {/* ── Показатели: подчинены доминанте, поэтому мельче ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatTile
              Icon={Star}
              hue="sun"
              label="Мои монеты"
              value={fmtNum(data?.coins)}
              hint="трать в магазине"
            />
            <StatTile
              Icon={Trophy}
              hue="grape"
              label="Место в рейтинге"
              value={data?.rank?.rank ? `#${data.rank.rank}` : '—'}
              hint={data?.rank?.rank ? `${fmtNum(data.rank.coins)} за неделю` : 'заработай монеты'}
            />
            <StatTile
              Icon={Wallet}
              hue={debt > 0 ? 'coral' : 'grass'}
              label="Оплата"
              value={debt > 0 ? fmtMoney(debt) : 'Всё ок'}
              hint={debt > 0 ? 'скажи родителям' : 'долгов нет'}
              className="col-span-2 lg:col-span-1"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5 items-start">
            <Panel
              title="Сдать до срока"
              icon={Clock}
              hue="coral"
              action={
                <Link to="/homework" className="inline-flex items-center gap-1 text-[13px] font-extrabold text-white">
                  все <ArrowRight size={14} strokeWidth={3} />
                </Link>
              }
            >
              {data?.upcomingHomework?.length ? (
                <div className="space-y-3">
                  {data.upcomingHomework.map((hw) => {
                    const label = deadlineLabel(hw.deadline);
                    const urgent = label === 'сегодня' || label === 'просрочено';
                    return (
                      <div
                        key={hw.id}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ background: '#F2F7EA', border: `3px solid ${INK}`, borderRadius: 18 }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-extrabold truncate" style={{ color: INK }}>{hw.title}</div>
                          <div className="text-[12px] font-bold mt-0.5" style={{ color: 'rgba(27,42,27,0.5)' }}>
                            до {fmtDateTime(hw.deadline)}
                          </div>
                        </div>
                        <Pill hue={urgent ? 'coral' : 'sky'}>{label}</Pill>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={BookOpen} hue="grass" title="Всё сдано!" text="Новых заданий пока нет." />
              )}
            </Panel>

            <Panel title="Моя группа" icon={Users} hue="lime">
              {data?.groups?.length ? (
                <div className="space-y-3">
                  {data.groups.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ background: '#F2F7EA', border: `3px solid ${INK}`, borderRadius: 18 }}
                    >
                      <span
                        className="w-10 h-10 grid place-items-center shrink-0"
                        style={{ background: HUE.lime, border: `2.5px solid ${INK}`, borderRadius: 13, color: INK }}
                      >
                        <Users size={18} strokeWidth={2.7} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-extrabold truncate" style={{ color: INK }}>{g.name}</div>
                        <div className="text-[12px] font-bold mt-0.5 truncate" style={{ color: 'rgba(27,42,27,0.5)' }}>
                          {g.subject} · {g.mentorName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} hue="sky" title="Пока нет группы" text="Администратор добавит тебя в группу." />
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
