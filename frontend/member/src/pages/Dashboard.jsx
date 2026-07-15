import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { fmt, money, dateShort, timeAgo, ATTENDANCE_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressRing, StatCard } from '../components/ui.jsx';

export default function Dashboard() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) {
    return <EmptyState icon="👶" title="Выберите ребёнка" message="Добавьте ребёнка в профиль для просмотра данных" />;
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
  const absentPct = Math.round(((att.absent || 0) / attTotal) * 100);
  const latePct = Math.round(((att.late || 0) / attTotal) * 100);

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

  return (
    <>
      <PageHeader title={`Обзор — ${d.child.firstName}`} subtitle="Информация об ученике" />

      <div className="card bg-gradient-to-br from-sidebar to-[#1a2e12] text-white mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="card-body relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProgressRing value={attPct} size={72} stroke={5} color="#C6FF34" bg="rgba(255,255,255,.15)" />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{attPct}%</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{d.child.firstName} {d.child.lastName}</h2>
              <p className="text-sm opacity-60 mt-0.5">
                {d.groups?.length || 0} групп · Рейтинг {d.rank?.rank ? `#${d.rank.rank}` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon="🪙" label="Коины" value={fmt(d.coins)} color="#C6FF34" sub="Заработанные баллы" />
        <StatCard
          icon="💰"
          label="Долг"
          value={money(d.totalDebt)}
          color={Number(d.totalDebt) > 0 ? '#ef4444' : '#22c55e'}
          sub={Number(d.totalDebt) > 0 ? 'Требуется оплата' : 'Нет задолженности'}
        />
        <StatCard icon="🏆" label="Рейтинг" value={d.rank?.rank ? `#${d.rank.rank}` : '—'} color="#f59e0b" sub="Среди одногруппников" />
        <StatCard icon="📊" label="Посещаемость" value={`${attPct}%`} color="#3b82f6" sub={`${att.present || 0} из ${attTotal}`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm">Посещаемость (30 дней)</h3>
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
                  const st = ATTENDANCE_STATUS[s];
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color }} />
                      <span className="text-xs w-20 shrink-0">{st?.label}</span>
                      <div className="flex-1 h-1.5 bg-base-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: st?.color }} />
                      </div>
                      <span className="text-[11px] font-mono w-6 text-right opacity-50">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm">Группы</h3>
            {d.groups?.length === 0 ? (
              <EmptyState icon="📚" title="Нет групп" message="Ещё не записан" />
            ) : (
              <div className="space-y-2 mt-2">
                {d.groups?.map((g, i) => {
                  const colors = ['#C6FF34', '#3b82f6', '#a855f7', '#f59e0b'];
                  const c = colors[i % colors.length];
                  return (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/40 hover:bg-base-200 transition-colors">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: `${c}18`, color: c }}
                      >
                        {g.subject?.slice(0, 2) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <p className="text-xs opacity-40">{g.mentorName}</p>
                      </div>
                      <span className="text-[11px] opacity-30 font-mono">{g.subject}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm">Последние занятия</h3>
          {d.attendance?.recent?.length === 0 ? (
            <EmptyState icon="📅" title="Нет записей" />
          ) : (
            <div className="mt-3 space-y-1">
              {d.attendance?.recent?.map((r, i) => {
                const st = ATTENDANCE_STATUS[r.status];
                return (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-base-200/50 transition-colors">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{r.groupName}</span>
                    </div>
                    <span className="text-xs opacity-40">{dateShort(r.lessonDate)}</span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st?.bg, color: st?.color }}
                    >
                      {st?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-between mb-1">
            <h3 className="card-title text-sm">Последние оценки</h3>
            {allGrades.length > 0 && (
              <span className="text-xs opacity-40">Средний: <span className="font-bold opacity-100">{avgScore}%</span></span>
            )}
          </div>
          {allGrades.length === 0 ? (
            <EmptyState icon="📝" title="Нет оценок" />
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
                      <tr key={i} className="hover:bg-base-200/50">
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
                            <div className="w-12 h-1.5 bg-base-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
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
