import { useState } from 'react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort, ATTENDANCE_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressRing } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';

export default function Attendance() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const [filter, setFilter] = useState('all');

  if (!selectedChild) return <EmptyState icon="user-circle" title="Выберите ребёнка" />;

  if (isLoading) {
    return (
      <>
        <PageHeader title="Посещаемость" />
        <SkeletonTable rows={6} cols={4} />
      </>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const d = data?.data;
  if (!d) return null;

  const records = d.attendance?.recent || [];
  const summary = d.attendance?.summary || {};
  const total = summary.total || 1;
  const pct = Math.round(((summary.present || 0) / total) * 100);

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  return (
    <>
      <PageHeader
        title="Посещаемость"
        subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`}
      />

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <ProgressRing value={pct} size={90} stroke={7} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold">{pct}%</span>
                <span className="text-[9px] opacity-40">присутствие</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-4 gap-2">
                {['present', 'absent', 'late', 'excused'].map((s) => {
                  const st = ATTENDANCE_STATUS[s];
                  const count = summary[s] || 0;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(filter === s ? 'all' : s)}
                      className={`p-3 rounded-xl text-center transition-all duration-200 ${
                        filter === s
                          ? 'ring-2 ring-offset-2 shadow-sm'
                          : 'hover:bg-base-200'
                      }`}
                      style={filter === s ? { borderColor: st?.color, background: st?.bg, ringColor: st?.color } : {}}
                    >
                      <p className="text-xl font-extrabold" style={{ color: st?.color }}>{count}</p>
                      <p className="text-[10px] opacity-50 mt-0.5">{st?.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Icon name="clock" className="w-4 h-4 text-primary" />
            История посещений
          </h3>
          {filtered.length === 0 ? (
            <EmptyState icon="calendar" title="Нет записей" message="Посещаемость ещё не отмечена" />
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Группа</th>
                    <th>Статус</th>
                    <th>Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const st = ATTENDANCE_STATUS[r.status];
                    return (
                      <tr key={i} className="hover:bg-base-200/50 transition-colors">
                        <td className="text-sm whitespace-nowrap font-medium">{dateShort(r.lessonDate)}</td>
                        <td className="text-sm">{r.groupName}</td>
                        <td>
                          <span
                            className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                            style={{ background: st?.bg, color: st?.color }}
                          >
                            {st?.label}
                          </span>
                        </td>
                        <td className="text-sm opacity-50 max-w-[200px] truncate">{r.comment || '—'}</td>
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
