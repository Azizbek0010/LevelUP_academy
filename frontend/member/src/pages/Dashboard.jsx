import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { fmt, money, dateShort, ATTENDANCE_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui.jsx';

export default function Dashboard() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) {
    return <EmptyState icon="👶" title="Выберите ребёнка" message="Добавьте ребёнка в профиль для просмотра данных" />;
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Обзор" subtitle="Загрузка..." />
        <SkeletonKpis />
      </>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

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

  return (
    <>
      <PageHeader
        title={`${d.child.firstName} ${d.child.lastName}`}
        subtitle="Обзор ученика"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon="🪙" label="Коины" value={fmt(d.coins)} />
        <KpiCard
          icon="💰"
          label="Долг"
          value={money(d.totalDebt)}
          danger={Number(d.totalDebt) > 0}
        />
        <KpiCard icon="🏆" label="Рейтинг" value={d.rank?.rank ? `#${d.rank.rank}` : '—'} />
        <KpiCard icon="📊" label="Посещаемость" value={`${attPct}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm">Посещаемость (30 дней)</h3>
            <div className="space-y-3 mt-3">
              {['present', 'absent', 'late', 'excused'].map((s) => {
                const count = att[s] || 0;
                const pct = Math.round((count / attTotal) * 100);
                const st = ATTENDANCE_STATUS[s];
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-xs w-28 shrink-0">{st?.label}</span>
                    <div className="flex-1 h-2.5 bg-base-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: st?.color }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right opacity-60">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <h3 className="card-title text-sm">Группы</h3>
            {d.groups?.length === 0 ? (
              <p className="text-sm opacity-50 mt-3">Нет групп</p>
            ) : (
              <div className="space-y-2 mt-3">
                {d.groups?.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-base-200/50">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(198,255,52,.15)', color: '#16210f' }}
                    >
                      {g.subject?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{g.name}</p>
                      <p className="text-xs opacity-50">{g.subject} · {g.mentorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm">Последние занятия</h3>
          {d.attendance?.recent?.length === 0 ? (
            <p className="text-sm opacity-50 mt-3">Нет данных</p>
          ) : (
            <div className="space-y-2 mt-3">
              {d.attendance?.recent?.map((r, i) => {
                const st = ATTENDANCE_STATUS[r.status];
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-base-200/30">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: st?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{r.groupName}</p>
                      <p className="text-xs opacity-50">{dateShort(r.lessonDate)}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
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
          <h3 className="card-title text-sm">Последние оценки</h3>
          {allGrades.length === 0 ? (
            <p className="text-sm opacity-50 mt-3">Нет оценок</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Тип</th>
                    <th>Балл</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {allGrades.map((g, i) => (
                    <tr key={i}>
                      <td className="text-sm">{g.title}</td>
                      <td className="text-sm">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: g.type === 'hw' ? 'rgba(59,130,246,.1)' : 'rgba(168,85,247,.1)',
                            color: g.type === 'hw' ? '#3b82f6' : '#a855f7',
                          }}
                        >
                          {g.type === 'hw' ? 'ДЗ' : 'Тест'}
                        </span>
                      </td>
                      <td className="text-sm font-mono">
                        {g.score}/{g.maxScore}
                      </td>
                      <td className="text-sm opacity-60">
                        {dateShort(g.gradedAt || g.finishedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function KpiCard({ icon, label, value, danger }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icon}</span>
          <span className="text-xs opacity-50">{label}</span>
        </div>
        <p className={`text-xl font-extrabold tracking-tight ${danger ? 'text-error' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
