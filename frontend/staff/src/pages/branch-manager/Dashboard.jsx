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
    return <div className="p-8 text-center text-base-content/45">Yuklanmoqda...</div>;
  }
  if (dashQ.error || incomeQ.error || reportsQ.error) {
    return <div className="p-8 text-center text-error">Xatolik yuz berdi</div>;
  }

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Boshqaruv paneli"
        subtitle={`${dash?.branch?.name || 'Filial'} · filialning umumiy holati`}
      />

      {/* ── Moliyaviy KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          Icon={TrendingUp}
          title="Bu oy daromad"
          value={money(cur?.income)}
          unit={`${cur?.label || 'Avgust'} oyi`}
          tone="success"
          trend={trend('income')}
          trendLabel="o'tgan oyga nisbatan"
          to="/income"
        />
        <Kpi
          Icon={Receipt}
          title="Bu oy xarajat"
          value={money(cur?.expenses)}
          unit={`${cur?.label || 'Avgust'} oyi`}
          tone="warning"
          trend={trend('expenses')}
          trendLabel="o'tgan oyga nisbatan"
          to="/expenses"
        />
        <Kpi
          Icon={Sparkles}
          title="Foyda"
          value={money(cur?.profit)}
          unit="daromad − xarajat"
          tone="neutral"
          trend={trend('profit')}
          trendLabel="o'tgan oyga nisbatan"
          to="/reports"
        />
        <Kpi
          Icon={Wallet}
          title="Qarzdorlik"
          value={money(dash?.outstandingDebt)}
          unit="muddati o'tgan to'lovlar"
          tone="danger"
          to="/income"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Filial joylashuvi kartasi ── */}
        <Panel title="Filial" icon={Building2} bodyClass="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-base-content truncate">{dash?.branch?.name}</h3>
              <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                Asosiy filial
              </span>
            </div>
            <Link to="/branch" className="btn btn-ghost btn-xs gap-1 text-primary">
              Batafsil <ChevronRight size={13} />
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
              <dt className="text-[11px] text-base-content/45">Talabalar</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalStudents)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-base-content/45">Guruhlar</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalGroups)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-base-content/45">Xodimlar</dt>
              <dd className="font-bold tabular-nums">{fmt(dash?.totalMentors)}</dd>
            </div>
          </dl>
        </Panel>

        {/* ── So'nggi to'lovlar ── */}
        <Panel title="So'nggi to'lovlar" icon={CreditCard} bodyClass="p-4">
          {recent.length === 0 ? (
            <p className="text-[13px] text-base-content/45 text-center py-4">Hozircha to'lovlar yo'q</p>
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
        title="Oxirgi 6 oy: daromad vs xarajat"
        icon={CalendarDays}
        bodyClass="p-5"
        action={
          <Link to="/reports" className="btn btn-ghost btn-xs gap-1 text-primary">
            Hisobotlar <ChevronRight size={13} />
          </Link>
        }
      >
        <FinanceBars months={reports?.monthlySeries || []} />
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-base-200 text-[11px] text-base-content/45">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-success/70" /> Daromad
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-error/60" /> Xarajat
          </span>
        </div>
      </Panel>
    </div>
  );
}
