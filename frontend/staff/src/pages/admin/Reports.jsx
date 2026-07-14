import { money, fmt } from '../../format.js';
import { useAdminReports } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

export default function AdminReports() {
  const { data, isLoading, error } = useAdminReports();

  const raw = data?.data || data || {};
  const byGroup = raw.byGroup || raw.groups || [];
  const totalRevenue = byGroup.reduce((s, g) => s + Number(g.revenue || 0), 0);
  const totalDebt = byGroup.reduce((s, g) => s + Number(g.debt || g.outstandingDebt || 0), 0);

  return (
    <div>
      <PageHeader title="Отчёты" subtitle="Выручка и долги по группам" />

      {isLoading ? (
        <div className="mt-6"><SkeletonTable cols={4} /></div>
      ) : error ? (
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="card bg-base-100"><div className="card-body p-5">
              <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">Общая выручка</div>
              <div className="text-2xl font-extrabold mt-1 tabular-nums">{money(totalRevenue)}</div>
            </div></div>
            <div className="card bg-base-100"><div className="card-body p-5">
              <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">Общий долг</div>
              <div className="text-2xl font-extrabold mt-1 tabular-nums text-error">{money(totalDebt)}</div>
            </div></div>
          </div>

          <div className="card bg-base-100 mt-4">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Группа</th><th className="text-right">Студентов</th><th className="text-right">Выручка</th><th className="text-right">Долг</th></tr></thead>
                  <tbody>
                    {byGroup.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/40 py-8">Нет данных</td></tr>}
                    {byGroup.map((g, i) => (
                      <tr key={g.id || g.groupId || i}>
                        <td className="font-medium">{g.name || g.groupName || '—'}</td>
                        <td className="text-right tabular-nums">{fmt(g.students ?? g.studentsCount ?? 0)}</td>
                        <td className="text-right tabular-nums">{money(g.revenue)}</td>
                        <td className="text-right tabular-nums text-error">{money(g.debt || g.outstandingDebt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
