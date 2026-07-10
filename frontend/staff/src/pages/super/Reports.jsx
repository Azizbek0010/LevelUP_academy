import { Download, TrendingUp, CreditCard, Landmark, Users, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmt, money } from '../../format.js';
import { useSuperDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';

export default function SuperReports() {
  const { data, isLoading, error } = useSuperDashboard();

  if (isLoading || !data) return <div className="space-y-6"><PageHeader title="Аналитика" /><SkeletonKpis count={4} /><SkeletonTable /></div>;
  if (error && error.status !== 401) return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

  const t = data.totals || {};
  const cur = t.currency || 'UZS';
  const branches = data.branches || [];
  const avgRevenue = t.branches > 0 ? t.revenue / t.branches : 0;
  const avgDebt = t.branches > 0 ? (t.outstandingDebt || 0) / t.branches : 0;
  const maxRevenue = Math.max(...branches.map((b) => Number(b.revenue || 0)), 1);
  const maxDebt = Math.max(...branches.map((b) => Number(b.debt || 0)), 1);
  const debtRatio = t.revenue > 0 ? (((t.outstandingDebt || 0) / (t.revenue + (t.outstandingDebt || 0))) * 100).toFixed(1) : 0;

  const handleExportCSV = () => {
    let csv = '\uFEFF';
    csv += `"Сводный отчет","LevelUp Academy"\n`;
    csv += `"Дата","${new Date().toLocaleDateString('ru-RU')}"\n\n`;
    csv += `"Филиалы","Ученики","Админы","Выручка","Долг","Средняя выручка"\n`;
    csv += `${t.branches},${t.activeStudents},${t.admins},${t.revenue},${t.outstandingDebt || 0},${Math.round(avgRevenue)}\n\n`;
    csv += `"Филиал","Ученики","Админы","Выручка","Долг","Доля %"\n`;
    branches.forEach((b) => {
      const share = t.revenue > 0 ? ((b.revenue / t.revenue) * 100).toFixed(1) : '0.0';
      csv += `"${b.name}",${b.students},${b.admins},${b.revenue},${b.debt || 0},${share}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levelup_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Аналитика" subtitle="Финансовые и учебные показатели организации">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={handleExportCSV}>
          <Download size={16} /> Экспорт CSV
        </button>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Landmark size={20} className="text-primary" /></div>
              <span className="text-sm text-base-content/60 font-medium">Выручка</span>
            </div>
            <div className="text-2xl font-extrabold mt-2 tabular-nums">{money(t.revenue, cur)}</div>
            <div className="text-xs text-base-content/50 mt-1">Средняя: {money(avgRevenue)} / филиал</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-xl"><CreditCard size={20} className="text-error" /></div>
              <span className="text-sm text-base-content/60 font-medium">Долг</span>
            </div>
            <div className="text-2xl font-extrabold mt-2 text-error tabular-nums">{money(t.outstandingDebt || 0, cur)}</div>
            <div className="text-xs text-base-content/50 mt-1">Средний: {money(avgDebt)} / филиал</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Users size={20} className="text-primary" /></div>
              <span className="text-sm text-base-content/60 font-medium">Ученики</span>
            </div>
            <div className="text-2xl font-extrabold mt-2 tabular-nums">{fmt(t.activeStudents)}</div>
            <div className="text-xs text-base-content/50 mt-1">В {t.branches} филиалах</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><Percent size={20} className="text-primary" /></div>
              <span className="text-sm text-base-content/60 font-medium">Доля долга</span>
            </div>
            <div className="text-2xl font-extrabold mt-2 tabular-nums">{debtRatio}%</div>
            <div className="text-xs text-base-content/50 mt-1">От общей суммы счетов</div>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Выручка по филиалам</h2>
            {branches.length === 0 ? (
              <p className="text-center py-12 opacity-50 text-sm">Нет данных</p>
            ) : (
              <div className="space-y-4">
                {branches.map((b) => {
                  const pct = Math.max(8, Math.min(100, (Number(b.revenue || 0) / maxRevenue) * 100));
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <Link to={`/branches/${b.id}`} className="font-semibold hover:underline">{b.name}</Link>
                        <span className="font-medium tabular-nums">{money(b.revenue || 0)}</span>
                      </div>
                      <div className="w-full bg-base-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-error" /> Задолженности</h2>
            {branches.length === 0 ? (
              <p className="text-center py-12 opacity-50 text-sm">Нет данных</p>
            ) : (
              <div className="space-y-4">
                {branches.map((b) => {
                  const pct = Math.max(8, Math.min(100, (Number(b.debt || 0) / maxDebt) * 100));
                  return (
                    <div key={b.id} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <Link to={`/branches/${b.id}`} className="font-semibold hover:underline">{b.name}</Link>
                        <span className="font-medium text-error tabular-nums">{money(b.debt || 0)}</span>
                      </div>
                      <div className="w-full bg-base-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-error/80 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Сводная таблица */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4">Сводка по филиалам</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr><th>Филиал</th><th className="text-right">Ученики</th><th className="text-right">Админы</th><th className="text-right">Выручка</th><th className="text-right">Долг</th><th className="text-right">Доля</th></tr>
              </thead>
              <tbody>
                {branches.map((b) => {
                  const share = t.revenue > 0 ? ((b.revenue / t.revenue) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={b.id} className="hover">
                      <td className="font-semibold"><Link to={`/branches/${b.id}`} className="hover:underline">{b.name}</Link></td>
                      <td className="text-right tabular-nums">{b.students}</td>
                      <td className="text-right tabular-nums">{b.admins}</td>
                      <td className="text-right font-semibold tabular-nums">{money(b.revenue)}</td>
                      <td className="text-right text-error tabular-nums">{money(b.debt || 0)}</td>
                      <td className="text-right tabular-nums">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
