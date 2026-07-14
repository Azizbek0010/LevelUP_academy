import { Link } from 'react-router-dom';
import { Building2, GraduationCap, Users, Wallet } from 'lucide-react';
import { fmt, dateShort, ORG_STATUS } from '../../format.js';
import { useSuperDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonList } from '../../components/Skeleton.jsx';

function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">
            {title}
          </div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      </div>
    </div>
  );
}

export default function SuperDashboard() {
  const { data, isLoading, error } = useSuperDashboard();

  if (error && error.status !== 401) return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

  return (
    <div>
      <PageHeader title="Дашборд организации" subtitle="Обзор филиалов, студентов и дохода" />

      {isLoading || !data ? (
        <SkeletonKpis count={4} />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Филиалы" value={fmt(t.branches)} unit="всего" />
        <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Ученики" value={fmt(t.activeStudents)} unit="активных" />
        <Kpi Icon={Users} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Админы" value={fmt(t.admins)} unit="сотрудников" />
        <Kpi Icon={Wallet} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Доход" value={fmt(t.revenue)} unit={cur} />
      </div>

      {/* Филиалы */}
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
              <table className="table table-sm">
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
    </>
  );
}
