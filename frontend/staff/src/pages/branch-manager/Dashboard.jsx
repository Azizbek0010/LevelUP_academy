import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, Receipt, Sparkles, MapPin, Phone, Clock,
  ChevronRight, CreditCard, Coins, CalendarDays, Building2,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { FinanceBars, PaymentStatusBadge } from './_ui.jsx';
import { useBranchManagerDashboard, useBranchManagerIncome, useBranchManagerReports } from '../../queries.js';

export default function BranchManagerDashboard() {
  const dashQ = useBranchManagerDashboard();
  const incomeQ = useBranchManagerIncome('2026-08');
  const reportsQ = useBranchManagerReports(6);

  const dash = dashQ.data;
  const income = incomeQ.data;
  const reports = reportsQ.data;

  const cur = reports?.monthlySeries?.[reports.monthlySeries.length - 1];
  const prev = reports?.monthlySeries?.[reports.monthlySeries.length - 2] || cur;

  const trend = (key) => {
    if (!prev?.[key]) return 0;
    return Math.round(((cur?.[key] - prev[key]) / prev[key]) * 100);
  };

  const recent = income?.payments?.slice(0, 5) || [];

  if (dashQ.isLoading || incomeQ.isLoading || reportsQ.isLoading) {
    return <div className="p-8 text-center text-base-content/45">Загрузка...</div>;
  }
  if (dashQ.error || incomeQ.error || reportsQ.error) {
    return <div className="p-8 text-center text-error">Произошла ошибка</div>;
  }

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Панель управления"
        subtitle={`${dash?.branch?.name || 'Филиал'} · общее состояние филиала`}
      />

      {/* ── Moliyaviy KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          Icon={TrendingUp}
          title="Доход за этот месяц"
          value={money(cur?.income)}
          unit={`месяц ${cur?.label || 'Август'}`}
          tone="success"
          trend={trend('income')}
          trendLabel="по сравнению с прошлым месяцем"
          to="/income"
        />
        <Kpi
          Icon={Receipt}
          title="Расход за этот месяц"
          value={money(cur?.expenses)}
          unit={`месяц ${cur?.label || 'Август'}`}
          tone="warning"
          trend={trend('expenses')}
          trendLabel="по сравнению с прошлым месяцем"
          to="/expenses"
        />
        <Kpi
          Icon={Sparkles}
          title="Прибыль"
          value={money(cur?.profit)}
          unit="доход − расход"
          tone="neutral"
          trend={trend('profit')}
          trendLabel="по сравнению с прошлым месяцем"
          to="/reports"
        />
        <Kpi
          Icon={Wallet}
          title="Задолженность"
          value={money(dash?.outstandingDebt)}
          unit="просроченные платежи"
          tone="danger"
          to="/income"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Filial joylashuvi kartasi ── */}
        <Panel title="Филиал" icon={Building2} bodyClass="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-base-content truncate">{dash?.branch?.name}</h3>
              <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                Главный филиал
              </span>
            </div>
            <Link to="/branch" className="btn btn-ghost btn-xs gap-1 text-primary">
              Подробнее <ChevronRight size={13} />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5 text-[13px] text-base-content/70">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                <MapPin size={14} />
              </span>
              <span className="truncate">{dash?.branch?.address}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                <Phone size={14} />
              </span>
              <span>{dash?.branch?.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                <Clock size={14} />
              </span>
              <span>{dash?.branch?.workHours}</span>
            </div>
          </div>

          {/* Qisqa statistika */}
          <dl className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-base-200">
            <div>
              <dt className="text-[11px] text-base-content/45">Студенты</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalStudents)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-base-content/45">Группы</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalGroups)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-base-content/45">Сотрудники</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalMentors)}</dd>
            </div>
          </dl>
        </Panel>

        {/* ── So'nggi to'lovlar ── */}
        <Panel title="Последние платежи" icon={CreditCard} bodyClass="p-4">
          {recent.length === 0 ? (
            <p className="text-[13px] text-base-content/45 text-center py-4">Пока нет платежей</p>
          ) : (
            <div className="space-y-2">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  to="/income"
                  className="flex items-center justify-between rounded-xl px-3.5 py-3 border border-base-200 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg grid place-items-center bg-success/10 text-success shrink-0">
                      <Coins size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-base-content truncate">{p.student}</span>
                      <span className="block text-[11px] text-base-content/45 truncate">{p.group}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <PaymentStatusBadge status={p.status} />
                    <span className="text-[14px] font-extrabold tabular-nums text-success">{money(p.amount)}</span>
                    <ChevronRight size={15} className="text-base-content/30" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── 6 oylik moliya charti ── */}
      <Panel
        title="Последние 6 месяцев: доход vs расход"
        icon={CalendarDays}
        bodyClass="p-5"
        action={
          <Link to="/reports" className="btn btn-ghost btn-xs gap-1 text-primary">
            Отчеты <ChevronRight size={13} />
          </Link>
        }
      >
        <FinanceBars months={reports?.monthlySeries || []} />
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-base-200 text-[11px] text-base-content/45">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-success/70" /> Доход
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-error/60" /> Расход
          </span>
        </div>
      </Panel>
    </div>
  );
}
