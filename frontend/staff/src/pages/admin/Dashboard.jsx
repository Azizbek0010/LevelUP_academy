import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  UserPlus, FolderPlus, CreditCard, FileText,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useAdminDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';

function Kpi({ Icon, tint, title, value }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            style={{ background: tint.bg, color: tint.fg }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">
            {title}
          </div>
        </div>
        <div className="text-2xl font-extrabold mt-3 leading-none tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Row({ Icon, label, value, danger }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-base-300">
      <span className="flex items-center gap-2 text-sm text-base-content/70">
        {Icon && <Icon size={16} />}
        {label}
      </span>
      <span className={`font-bold tabular-nums ${danger ? 'text-error' : ''}`}>{value}</span>
    </div>
  );
}

const QUICK = [
  { to: '/students', label: 'Студенты', Icon: UserPlus },
  { to: '/groups', label: 'Группы', Icon: FolderPlus },
  { to: '/payments', label: 'Платежи', Icon: CreditCard },
  { to: '/expenses', label: 'Расходы', Icon: Receipt },
  { to: '/reports', label: 'Отчёты', Icon: FileText },
  { to: '/mentors', label: 'Менторы', Icon: Users },
];

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />
        <div className="mt-6">
          <SkeletonKpis />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  const raw = data?.data || data || {};
  const t = raw.totals || {};
  const m = raw.thisMonth || {};

  return (
    <div>
      <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Kpi Icon={TrendingUp} tint={{ bg: '#dcfce7', fg: '#16a34a' }} title="Общий доход" value={money(t.revenue)} />
        <Kpi Icon={TriangleAlert} tint={{ bg: '#fef3c7', fg: '#d97706' }} title="Долги" value={money(t.outstandingDebt)} />
        <Kpi Icon={Receipt} tint={{ bg: '#fee2e2', fg: '#dc2626' }} title="Расходы" value={money(t.expenses)} />
        <Kpi Icon={Wallet} tint={{ bg: '#dbeafe', fg: '#2563eb' }} title="Чистая прибыль" value={money(t.profit)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="card bg-base-100">
          <div className="card-body p-5">
            <h2 className="font-bold">Показатели филиала</h2>
            <div className="mt-3 space-y-2">
              <Row Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} />
              <Row Icon={Users} label="Группы" value={fmt(t.groups)} />
              <Row Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-5">
            <h2 className="font-bold">За этот месяц</h2>
            <div className="mt-3 space-y-2">
              <Row label="Доход" value={money(m.revenue)} />
              <Row label="Расход" value={money(m.expenses)} />
              <Row label="Прибыль" value={money(m.profit)} />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mt-4">
        <div className="card-body p-5">
          <h2 className="font-bold mb-3">Быстрые действия</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {QUICK.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className="btn btn-outline h-auto py-4 flex-col gap-2 normal-case">
                <Icon size={20} />
                <span className="text-xs font-semibold text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
