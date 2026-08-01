import { Link } from 'react-router-dom';
import { Building2, GraduationCap, Users, Presentation, Wallet, TriangleAlert, RefreshCw, ArrowRight } from 'lucide-react';
import { fmt } from '../../format.js';
import { useSuperDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import { Kpi } from '../mentor/_ui.jsx';

export default function SuperDashboard() {
  const { data, isLoading, error, refetch } = useSuperDashboard();

  if (error) {
    if (error.status === 401) {
      return <div className="alert alert-warning text-sm"><span>Сессия истекла. Пожалуйста, войдите снова.</span></div>;
    }
    return (
      <div className="alert alert-error text-sm flex items-center justify-between">
        <span>{error.message}</span>
        <button className="btn btn-sm btn-ghost gap-1" onClick={() => refetch()}>
          <RefreshCw size={14} /> Повторить
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Дашборд организации" subtitle="Обзор филиалов, студентов и дохода" />

      {isLoading || !data ? (
        <SkeletonKpis count={6} className="grid-cols-2 md:grid-cols-3 lg:grid-cols-3" />
      ) : (
        <Loaded data={data} />
      )}
    </div>
  );
}

function Loaded({ data }) {
  const t = data.totals;
  const cur = t.currency;
  const branches = data.branches || [];

  return (
    <>
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <Kpi Icon={Building2} title="Филиалы" value={fmt(t.branches)} unit="всего" to="/branches" />
        <Kpi Icon={GraduationCap} title="Ученики" value={fmt(t.activeStudents)} unit="активных" to="/students" />
        <Kpi Icon={Users} title="Админы" value={fmt(t.admins)} unit="сотрудников" to="/admins" tone="success" />
        <Kpi Icon={Presentation} title="Менторы" value={fmt(t.mentors)} unit="преподавателей" to="/admins" />
        <Kpi Icon={Wallet} title="Доход" value={fmt(t.revenue)} unit={cur} to="/stats" />
        <Kpi Icon={TriangleAlert} title="Долги" value={fmt(t.outstandingDebt)} unit={cur} to="/stats" tone="danger" />
      </div>

      {/* Филиалы — таблица */}
      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title text-base">Филиалы</h2>
            <Link to="/branches" className="text-sm text-primary font-medium hover:underline">Все филиалы →</Link>
          </div>
          {branches.length === 0 ? (
            <p className="text-base-content/40 text-sm py-6 text-center">Филиалов пока нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm tabular-nums">
                <thead>
                  <tr>
                    <th>Филиал</th>
                    <th className="text-right">Ученики</th>
                    <th className="text-right">Админы</th>
                    <th className="text-right">Доход</th>
                    <th className="text-right">Долг</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id} className="hover">
                      <td>
                        <Link to={`/branches/${b.id}`} className="font-medium hover:text-primary">
                          {b.name}
                        </Link>
                        <span className={`badge badge-xs ml-2 ${b.isMain ? 'badge-primary' : ''}`}>
                          {b.isMain ? 'Главный' : b.isArchived ? 'Архив' : 'Филиал'}
                        </span>
                      </td>
                      <td className="text-right">{fmt(b.students)}</td>
                      <td className="text-right">{fmt(b.admins)}</td>
                      <td className="text-right font-medium">{fmt(b.revenue)}</td>
                      <td className="text-right text-error">{fmt(b.debt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Графики доходов/долгов по филиалам и разбивка по методам оплаты —
          на «Статистике» (там же период 7/30/90 дней и экспорт CSV), здесь
          дублировать их больше не нужно. */}
      <Link
        to="/stats"
        className="card bg-base-100 mt-6 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/30"
      >
        <div className="card-body flex-row items-center justify-between p-5">
          <span className="text-sm font-semibold">Подробная аналитика — графики, период, способы оплаты</span>
          <ArrowRight size={16} className="text-primary shrink-0" />
        </div>
      </Link>
    </>
  );
}
