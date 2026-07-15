import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort, ATTENDANCE_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui.jsx';

export default function Attendance() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) {
    return <EmptyState icon="👶" title="Выберите ребёнка" />;
  }

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

  return (
    <>
      <PageHeader
        title="Посещаемость"
        subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {['present', 'absent', 'late', 'excused'].map((s) => {
          const st = ATTENDANCE_STATUS[s];
          const count = summary[s] || 0;
          return (
            <div
              key={s}
              className="card bg-base-100 border-l-4"
              style={{ borderLeftColor: st?.color }}
            >
              <div className="card-body p-3">
                <p className="text-xs opacity-60">{st?.label}</p>
                <p className="text-2xl font-extrabold">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <h3 className="card-title text-sm">История посещений</h3>
          {records.length === 0 ? (
            <EmptyState icon="📅" title="Нет записей" message="Посещаемость ещё не отмечена" />
          ) : (
            <div className="overflow-x-auto">
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
                  {records.map((r, i) => {
                    const st = ATTENDANCE_STATUS[r.status];
                    return (
                      <tr key={i}>
                        <td className="text-sm whitespace-nowrap">{dateShort(r.lessonDate)}</td>
                        <td className="text-sm">{r.groupName}</td>
                        <td>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: st?.bg, color: st?.color }}
                          >
                            {st?.label}
                          </span>
                        </td>
                        <td className="text-sm opacity-60 max-w-[200px] truncate">
                          {r.comment || '—'}
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
