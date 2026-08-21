import { Link, useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Users, Presentation, Wallet, TriangleAlert, RefreshCw } from 'lucide-react';
import { fmt } from '../../format.js';
import { useSuperDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpisStrict } from '../../components/Skeleton.jsx';
import {
  DashboardPanel,
  KpiCard,
  BranchesTable,
  AnalyticsCTA,
} from '../../components/ui.jsx';

export default function SuperDashboard() {
  const { data, isLoading, error, refetch } = useSuperDashboard();
  const navigate = useNavigate();

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
    <div className="animate-fade-in">
      <PageHeader title="Дашборд организации" subtitle="Обзор филиалов, студентов и дохода" />

      {isLoading || !data ? (
        <SkeletonKpisStrict count={6} />
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
      {/* KPI Grid — 6 карточек с stagger */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <KpiCard Icon={Building2} tone="info" label="Филиалы" value={fmt(t.branches)} unit="всего" to="/branches" />
        <KpiCard Icon={GraduationCap} tone="primary" label="Ученики" value={fmt(t.activeStudents)} unit="активных" to="/students" />
        <KpiCard Icon={Users} tone="success" label="Админы" value={fmt(t.admins)} unit="сотрудников" to="/admins" />
        <KpiCard Icon={Presentation} tone="neutral" label="Менторы" value={fmt(t.mentors)} unit="преподавателей" to="/admins" />
        <KpiCard Icon={Wallet} tone="warning" label="Доход за всё время" value={fmt(t.revenue)} unit={cur} to="/stats" />
        <KpiCard Icon={TriangleAlert} tone="danger" label="Долги" value={fmt(t.outstandingDebt)} unit={cur} to="/stats" />
      </div>

      {/* Филиалы — строгая таблица в панели */}
      <DashboardPanel title="Филиалы" icon={Building2} bodyClass="p-0 mt-6" action={
        <Link to="/branches" className="text-sm font-medium text-[var(--primary)] hover:underline">Все филиалы →</Link>
      }>
        <BranchesTable branches={branches} fmt={fmt} />
      </DashboardPanel>

      {/* CTA → Статистика */}
      <AnalyticsCTA onClick={() => navigate('/stats')} className="mt-6" />
    </>
  );
}
