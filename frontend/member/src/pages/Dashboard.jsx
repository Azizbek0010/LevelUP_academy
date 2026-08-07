import { useState } from 'react';
import { useParentOverview, useGroupRating } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { fmt, money, dateShort, timeAgo, ATTENDANCE_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressRing, StatCard } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32'];
const RANK_ICONS = ['trophy', 'star', 'star'];

export default function Dashboard() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const { data: ratingData, isLoading: ratingLoading } = useGroupRating(selectedChild?.id);
  const [showRating, setShowRating] = useState(false);

  if (!selectedChild) {
    return <EmptyState icon="user-circle" title="Выберите ребёнка" message="Добавьте ребёнка в профиль для просмотра данных" />;
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Обзор" />
        <SkeletonKpis />
      </>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const d = data?.data;
  if (!d) return null;

  const att = d.attendance?.summary || {};
  const attTotal = att.total || 1;
  const attPct = Math.round(((att.present || 0) / attTotal) * 100);

  const allGrades = [
    ...(d.grades?.homework || []).map((g) => ({ ...g, type: 'hw' })),
    ...(d.grades?.tests || []).map((g) => ({ ...g, type: 'test' })),
  ]
    .sort((a, b) => new Date(b.gradedAt || b.finishedAt) - new Date(a.gradedAt || a.finishedAt))
    .slice(0, 5);

  const avgScore =
    allGrades.length > 0
      ? Math.round(allGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / allGrades.length)
      : 0;

  const group = d.groups?.[0];
  const students = ratingData?.data?.students || [];

  // Guruh reytingi ko'rinishi
  if (showRating && group) {
    return (
      <>
        <PageHeader title={`Группа ${group.name}`} subtitle={group.mentorName} />
        <button
          onClick={() => setShowRating(false)}
          className="flex items-center gap-2 text-sm text-primary mb-4 hover:underline"
        >
          <Icon name="arrow-left" className="w-4 h-4" />
          Назад к обзору
        </button>

        {/* Guruh ma'lumotlari */}
        <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 mb-6">
          <div className="card-body py-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-extrabold text-primary">{group.name}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{group.name}</h2>
                <p className="text-sm opacity-50">{group.subject} · {group.mentorName}</p>
                <p className="text-xs opacity-30 mt-0.5">{students.length} учеников</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reyting jadvali */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm gap-2 mb-3">
              <Icon name="trophy" className="w-4 h-4 text-primary" />
              Рейтинг группы
            </h3>

            {ratingLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <EmptyState icon="trophy" title="Нет данных" message="Рейтинг пока пуст" />
            ) : (
              <div className="space-y-2">
                {students.map((s, i) => {
                  const isMe = s.childId === selectedChild?.id;
                  const rankColor = i < 3 ? RANK_COLORS[i] : null;
                  return (
                    <div
                      key={s.childId}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        isMe
                          ? 'bg-primary/10 ring-2 ring-primary/30 shadow-sm'
                          : 'bg-base-200/30 hover:bg-base-200/60'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                        {i < 3 ? (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${rankColor}15` }}
                          >
                            <Icon name={RANK_ICONS[i]} className="w-4 h-4" style={{ color: rankColor }} />
                          </div>
                        ) : (
                          <span className="text-sm font-bold opacity-30">{s.rank}</span>
                        )}
                      </div>

                      {/* Avatar + Name */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Avatar name={`${s.firstName} ${s.lastName}`} size={36} />
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : ''}`}>
                            {s.firstName} {s.lastName}
                            {isMe && <span className="text-[10px] ml-1 opacity-50">(вы)</span>}
                          </p>
                          <p className="text-[11px] opacity-40">{fmt(s.coins)} коинов</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: s.avgScore >= 80 ? '#22c55e' : s.avgScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                          {s.avgScore}%
                        </p>
                        <p className="text-[10px] opacity-30">ср. балл</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Обзор" subtitle={`${d.child.firstName} ${d.child.lastName}`} />

      {/* Hero Card */}
      <div className="card bg-gradient-to-br from-sidebar via-[#1a2e12] to-[#0f1a0a] text-white mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />
        <div className="absolute top-4 right-16 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
        <div className="card-body relative z-10 py-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <ProgressRing value={attPct} size={80} stroke={5} color="#C6FF34" bg="rgba(255,255,255,.12)" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold">{attPct}%</span>
                <span className="text-[9px] opacity-40">посещ.</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold tracking-tight">{d.child.firstName} {d.child.lastName}</h2>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {group && (
                  <span className="text-xs opacity-50 flex items-center gap-1">
                    <Icon name="academic" className="w-3.5 h-3.5" />
                    {group.name}
                  </span>
                )}
                <span className="opacity-20">·</span>
                <span className="text-xs opacity-50 flex items-center gap-1">
                  <Icon name="trophy" className="w-3.5 h-3.5" />
                  Рейтинг {d.rank?.rank ? `#${d.rank.rank}` : '—'}
                </span>
                <span className="opacity-20">·</span>
                <span className="text-xs opacity-50 flex items-center gap-1">
                  <Icon name="star" className="w-3.5 h-3.5" />
                  {fmt(d.coins)} коинов
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon="star" label="Коины" value={fmt(d.coins)} color="#C6FF34" sub="Заработанные баллы" />
        <StatCard
          icon="wallet"
          label="Долг"
          value={money(d.totalDebt)}
          color={Number(d.totalDebt) > 0 ? '#ef4444' : '#22c55e'}
          sub={Number(d.totalDebt) > 0 ? 'Требуется оплата' : 'Нет задолженности'}
        />
        <StatCard icon="trophy" label="Рейтинг" value={d.rank?.rank ? `#${d.rank.rank}` : '—'} color="#f59e0b" sub="Среди одногруппников" />
        <StatCard icon="chart-bar" label="Посещаемость" value={`${attPct}%`} color="#3b82f6" sub={`${att.present || 0} из ${attTotal}`} />
      </div>

      {/* Attendance + Group */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Attendance Widget */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm gap-2">
              <Icon name="calendar-check" className="w-4 h-4 text-primary" />
              Посещаемость (30 дней)
            </h3>
            <div className="flex items-center gap-6 mt-3">
              <div className="relative">
                <ProgressRing value={attPct} size={100} stroke={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold">{attPct}%</span>
                  <span className="text-[10px] opacity-40">присутствие</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {['present', 'absent', 'late', 'excused'].map((s) => {
                  const count = att[s] || 0;
                  const pct = Math.round((count / attTotal) * 100);
                  const st = ATTENDANCE_STATUS()[s];
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color }} />
                      <span className="text-xs w-20 shrink-0">{st?.label}</span>
                      <div className="flex-1 h-1.5 bg-base-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: st?.color }} />
                      </div>
                      <span className="text-[11px] font-mono w-6 text-right opacity-50">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Group Card — clickable → rating */}
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm gap-2">
              <Icon name="academic" className="w-4 h-4 text-primary" />
              Группа
            </h3>
            {!group ? (
              <EmptyState icon="folder" title="Нет группы" message="Ещё не записан" />
            ) : (
              <button
                onClick={() => setShowRating(true)}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/15 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer w-full text-left mt-2"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-extrabold text-primary shrink-0 group-hover:scale-110 transition-transform">
                  {group.name}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{group.name}</p>
                  <p className="text-xs opacity-40 flex items-center gap-1 mt-0.5">
                    <Icon name="user" className="w-3 h-3" />
                    {group.mentorName}
                  </p>
                  <p className="text-[11px] opacity-30 mt-0.5">{group.studentCount || '—'} учеников</p>
                </div>
                <div className="flex items-center gap-1.5 text-primary shrink-0">
                  <span className="text-xs font-medium opacity-70 group-hover:opacity-100 transition-opacity">Рейтинг</span>
                  <Icon name="chevron-right" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Lessons (Timeline) */}
      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Icon name="clock" className="w-4 h-4 text-primary" />
            Последние занятия
          </h3>
          {d.attendance?.recent?.length === 0 ? (
            <EmptyState icon="calendar" title="Нет записей" />
          ) : (
            <div className="mt-3 relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-base-300" />
              <div className="space-y-1">
                {d.attendance?.recent?.slice(0, 5).map((r, i) => {
                  const st = ATTENDANCE_STATUS()[r.status];
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-base-200/50 transition-colors relative">
                      <div className="relative z-10">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-base-100" style={{ background: st?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{r.groupName}</span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: st?.bg, color: st?.color }}
                          >
                            {st?.label}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-xs opacity-40 mt-0.5 truncate">{r.comment}</p>
                        )}
                      </div>
                      <span className="text-[11px] opacity-30 whitespace-nowrap">{dateShort(r.lessonDate)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Grades */}
      <div className="card bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-between mb-1">
            <h3 className="card-title text-sm gap-2">
              <Icon name="document-text" className="w-4 h-4 text-primary" />
              Последние оценки
            </h3>
            {allGrades.length > 0 && (
              <span className="text-xs opacity-40">Средний: <span className="font-bold opacity-100">{avgScore}%</span></span>
            )}
          </div>
          {allGrades.length === 0 ? (
            <EmptyState icon="document-text" title="Нет оценок" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Балл</th>
                    <th className="text-right">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {allGrades.map((g, i) => {
                    const pct = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0;
                    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={i} className="hover:bg-base-200/50 transition-colors">
                        <td className="text-sm font-medium">{g.title}</td>
                        <td>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: g.type === 'hw' ? 'rgba(59,130,246,.1)' : 'rgba(168,85,247,.1)',
                              color: g.type === 'hw' ? '#3b82f6' : '#a855f7',
                            }}
                          >
                            {g.type === 'hw' ? 'ДЗ' : 'Тест'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-base-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className="text-xs font-mono" style={{ color }}>{g.score}/{g.maxScore}</span>
                          </div>
                        </td>
                        <td className="text-xs opacity-40 text-right whitespace-nowrap">
                          {timeAgo(g.gradedAt || g.finishedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
