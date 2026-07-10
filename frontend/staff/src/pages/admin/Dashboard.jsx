import { Wallet, GraduationCap, Users, TrendingUp } from 'lucide-react';
import { fmt } from '../../format.js';
import { useAdminDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';

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

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  if (error && error.status !== 401) return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

  return (
    <div>
      <PageHeader title="Дашборд филиала" subtitle="Обзор дохода, расходов и студентов" />

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
  const m = data.thisMonth || {};
  const cur = t.currency;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi Icon={Wallet} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Доход" value={fmt(t.revenue)} unit={cur} />
        <Kpi Icon={TrendingUp} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Расходы" value={fmt(t.expenses)} unit={cur} />
        <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Прибыль" value={fmt(t.profit)} unit={cur} />
        <Kpi Icon={Users} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Студенты" value={fmt(t.activeStudents)} unit="активных" />
      </div>

      {/* За месяц */}
      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <h2 className="card-title text-base">За текущий месяц</h2>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-base-200 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-base-content/40 font-semibold">Доход</div>
              <div className="text-xl font-bold mt-1 text-success">{fmt(m.revenue)}</div>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-base-content/40 font-semibold">Расход</div>
              <div className="text-xl font-bold mt-1 text-warning">{fmt(m.expenses)}</div>
            </div>
            <div className="text-center p-4 bg-base-200 rounded-xl">
              <div className="text-xs uppercase tracking-wider text-base-content/40 font-semibold">Прибыль</div>
              <div className="text-xl font-bold mt-1 text-primary">{fmt(m.profit)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Доп инфо */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card bg-base-100">
          <div className="card-body p-5">
            <div className="text-xs uppercase tracking-wider font-semibold text-base-content/40">Группы</div>
            <div className="text-2xl font-extrabold mt-2">{fmt(t.groups)}</div>
          </div>
        </div>
        <div className="card bg-base-100">
          <div className="card-body p-5">
            <div className="text-xs uppercase tracking-wider font-semibold text-base-content/40">Долги</div>
            <div className="text-2xl font-extrabold mt-2">{fmt(t.outstandingDebt)}</div>
          </div>
        </div>
        <div className="card bg-base-100">
          <div className="card-body p-5">
            <div className="text-xs uppercase tracking-wider font-semibold text-base-content/40">Просрочки</div>
            <div className="text-2xl font-extrabold mt-2 text-error">{fmt(t.overdueInvoices)}</div>
          </div>
        </div>
        <div className="card bg-base-100">
          <div className="card-body p-5">
            <div className="text-xs uppercase tracking-wider font-semibold text-base-content/40">Валюта</div>
            <div className="text-2xl font-extrabold mt-2">{cur}</div>
          </div>
        </div>
      </div>
    </>
  );
}
