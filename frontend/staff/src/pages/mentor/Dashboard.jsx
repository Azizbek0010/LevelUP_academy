import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, CalendarDays, Bell, ArrowRight,
} from 'lucide-react';
import { useMentorGroups, useMentorAttendance } from '../../queries.js';
import { Panel, EmptyState, RowSkeleton } from './_ui.jsx';

const LESSON_MINUTES = 60;

function getLessonTime(g) {
  if (g.lesson_time) return g.lesson_time;
  return g.schedule?.[0]?.start || null;
}

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/* KPI — одна форма для всех, без пастельных «конфетти» разных оттенков.
   Раньше каждая плитка красилась в свой случайный цвет (голубой/фиолетовый/
   зелёный/жёлтый), из-за чего цвет ничего не означал. Теперь акцент один —
   брендовый, а различает плитки иконка и подпись.

   С `to` плитка становится ссылкой: та, что ведёт куда-то, обязана это
   показывать — стрелкой и подсветкой на наведении. */
function Kpi({ Icon, title, value, unit, to }) {
  const body = (
    <div className="p-4">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 bg-primary/10 text-primary">
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {title}
        </span>
        {to && <ArrowRight size={14} className="ml-auto text-base-content/25 shrink-0" />}
      </div>
      <div className="text-3xl font-extrabold mt-3 leading-none tabular-nums">{value}</div>
      {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="card bg-base-100 card-hover-premium hover:border-primary/40 block">
        {body}
      </Link>
    );
  }
  return <div className="card bg-base-100 card-hover-premium">{body}</div>;
}

export default function MentorDashboard() {
  const { data: groupsData, isLoading } = useMentorGroups();
  const groups = useMemo(() => groupsData?.data || [], [groupsData]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const totalStudents = groups.reduce((sum, g) => sum + (g.students || 0), 0);

  // Уроки с известным временем, отсортированные по расписанию — основа и для
  // счётчика «сегодня», и для ленты ниже.
  const lessons = useMemo(
    () =>
      groups
        .map((g) => ({ g, time: getLessonTime(g), min: toMinutes(getLessonTime(g)) }))
        .filter((l) => l.min !== null)
        .sort((a, b) => a.min - b.min),
    [groups],
  );

  const activeLesson = lessons.find(
    (l) => currentMinutes >= l.min && currentMinutes < l.min + LESSON_MINUTES,
  );
  const activeGroup = activeLesson?.g;

  // Отмечен ли журнал активной группы за сегодня — от этого зависит баннер.
  const todayStr = now.toISOString().split('T')[0];
  const dateParam = useMemo(() => ({ date: todayStr }), [todayStr]);
  const { data: attData } = useMentorAttendance(activeGroup?.id, dateParam);
  const attendanceTaken = attData?.data && attData.data.length > 0;
  const showBanner = activeGroup && !attendanceTaken;

  return (
    /* Заголовка «Mentor paneli» нет намеренно: он повторял пункт меню, под
       которым пользователь только что кликнул, и занимал первый экран. */
    <div>
      {/* Идёт урок, а журнал не отмечен — единственное место, где ментору
          действительно нужно действие прямо сейчас. Раньше баннер ещё и
          пульсировал целиком (animate-pulse на всём блоке), включая текст:
          мигающий текст читать невозможно — пульсирует только точка. */}
      {showBanner && (
        <div className="mb-5 rounded-xl border border-error/30 bg-error/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-70" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-error truncate">
                {activeGroup.name} — dars ketmoqda
              </p>
              <p className="text-xs text-base-content/55 truncate">
                {activeGroup.subject || 'Fan'} · {getLessonTime(activeGroup)} · davomat belgilanmagan
              </p>
            </div>
          </div>
          <Link
            to={`/groups/${activeGroup.id}?tab=davomat`}
            className="btn btn-sm btn-error text-white gap-1.5 shrink-0"
          >
            Davomatni belgilash <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 p-4"><div className="skeleton h-20 w-full" /></div>
          ))}
        </div>
      ) : (
        /* Плитку «O'tgan darslar» убрали: сколько занятий уже прошло, видно
           в ленте ниже по метке «Tugagan» — цифра дублировала её и ничего
           не решала. */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi Icon={BookOpen} title="Guruhlar" value={groups.length} unit="faol" to="/groups" />
          <Kpi Icon={Users} title="O'quvchilar" value={totalStudents} unit="jami" to="/students" />
          {/* Было жёстко «—»: плитка занимала место и ничего не сообщала.
              Считаем реальное число занятий с расписанием на сегодня. */}
          <Kpi Icon={CalendarDays} title="Bugungi darslar" value={lessons.length} unit="jadval bo'yicha" />
        </div>
      )}

      {/* ─── Лента занятий на сегодня ───
          Раньше под ней была ещё и сетка «Mening guruhlarim» — тот же список
          групп второй раз, просто в другой вёрстке. Дубль убран: список групп
          живёт на своей странице, сюда ведёт ссылка в шапке. */}
      <div className="mt-6">
        <Panel
          title="Bugungi jadval"
          icon={CalendarDays}
          bodyClass="p-4"
          action={
            <Link to="/groups" className="btn btn-ghost btn-xs gap-1 text-primary">
              Guruhlarim <ArrowRight size={13} />
            </Link>
          }
        >
          {isLoading ? (
            <RowSkeleton count={3} />
          ) : lessons.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Bugun jadvalda dars yo'q"
              hint="Guruhga dars vaqti qo'yilmagan bo'lsa ham, davomatni qo'lda belgilashingiz mumkin."
              action={<Link to="/groups?tab=davomat" className="btn btn-sm btn-primary">Davomatga o'tish</Link>}
            />
          ) : (
            <ol className="relative space-y-2">
              {/* Вертикальная нить таймлайна */}
              <span
                className="absolute left-[7px] top-3 bottom-3 w-px bg-base-300"
                aria-hidden="true"
              />
              {lessons.map(({ g, time, min }) => {
                const isNow = min <= currentMinutes && min + LESSON_MINUTES > currentMinutes;
                const isPast = min + LESSON_MINUTES <= currentMinutes;
                return (
                  <li key={g.id} className="relative flex items-start gap-4">
                    <span
                      className={`relative z-10 mt-3.5 w-[15px] h-[15px] rounded-full border-2 shrink-0 ${
                        isNow
                          ? 'bg-primary border-primary'
                          : isPast
                          ? 'bg-base-100 border-base-300'
                          : 'bg-base-100 border-primary/40'
                      }`}
                      aria-hidden="true"
                    />
                    <div
                      className={`flex-1 min-w-0 rounded-xl border px-4 py-3 transition-colors ${
                        isNow
                          ? 'border-primary/40 bg-primary/5'
                          : isPast
                          ? 'border-base-200 opacity-60'
                          : 'border-base-200 hover:bg-base-200/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`shrink-0 w-14 text-center text-sm font-bold py-1 rounded-lg tabular-nums ${
                              isNow ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'
                            }`}
                          >
                            {time}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold truncate">{g.name}</div>
                            <div className="text-xs text-base-content/45 truncate">
                              {g.subject || 'Fan'} · {g.students || 0} o'quvchi
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isNow && (
                            <span className="badge badge-sm badge-primary">Ketmoqda</span>
                          )}
                          {isPast && (
                            <span className="badge badge-sm badge-ghost text-base-content/45">Tugagan</span>
                          )}
                          <Link
                            to={`/groups/${g.id}?tab=davomat`}
                            className="btn btn-ghost btn-xs text-primary"
                          >
                            Davomat
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      {/* Плитки «быстрых переходов» здесь были, но повторяли пункт в пункт
          левое меню — второй набор тех же ссылок на том же экране. Убраны:
          дашборд отвечает на «что сейчас», навигация живёт в сайдбаре. */}
    </div>
  );
}
