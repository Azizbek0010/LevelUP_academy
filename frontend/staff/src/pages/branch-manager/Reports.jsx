import { useState } from 'react';
import { TrendingUp, Receipt, Sparkles, CalendarDays, Wallet } from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { FinanceBars } from './_ui.jsx';
import { useState } from 'react';
import { TrendingUp, Receipt, Sparkles, CalendarDays, Wallet } from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { FinanceBars } from './_ui.jsx';
import { useBranchManagerReports } from '../../queries.js';

export default function BranchManagerReports() {
  const [monthsCount, setMonthsCount] = useState(6);
  const { data, isLoading, error } = useBranchManagerReports(monthsCount);

  if (isLoading) return <div className="p-8 text-center text-base-content/45">Yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-error">Xatolik yuz berdi</div>;

  const summary = data?.monthlySeries || [];
  const totals = data?.totals || {};

  const totalIncome = totals.totalIncome || 0;
  const totalExpenses = totals.totalExpenses || 0;
  const totalProfit = totals.totalProfit || 0;
  const totalPayments = totals.totalPayments || 0;

  const maxMonth = [...summary].sort((a, b) => b.income - a.income)[0];
  const avgProfit = summary.length ? Math.round(totalProfit / summary.length) : 0;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Hisobotlar"
        subtitle={`Filial · moliyaviy hisobot`}
      >
        <div className="join">
          {[3, 6].map((n) => (
            <button
              key={n}
              onClick={() => setMonthsCount(n)}
              className={`btn btn-sm join-item ${monthsCount === n ? 'btn-primary' : 'btn-ghost border border-base-200'}`}
            >
              {n} oy
            </button>
          ))}
        </div>
      </PageHeader>

      {/* ── KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi Icon={TrendingUp} title="Jami daromad" value={money(totalIncome)} unit={`${monthsCount} oy ichida`} tone="success" />
        <Kpi Icon={Receipt} title="Jami xarajat" value={money(totalExpenses)} unit={`${monthsCount} oy ichida`} tone="warning" />
        <Kpi Icon={Sparkles} title="Jami foyda" value={money(totalProfit)} unit={`o'rtacha ${money(avgProfit)}/oy`} tone="neutral" />
        <Kpi Icon={Wallet} title="Qarzdorlik" value={money(totalIncome - totalExpenses)} unit="filial bo'yicha" tone="danger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Chart ── */}
        <Panel title="Daromad vs xarajat" icon={CalendarDays} bodyClass="p-5">
          <FinanceBars months={summary} />
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-base-200 text-[11px] text-base-content/45">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-success/70" /> Daromad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-error/60" /> Xarajat
            </span>
          </div>
        </Panel>

        {/* ── Eng yaxshi oy ── */}
        <Panel title="Eng samarali oy" icon={TrendingUp} bodyClass="p-5">
          {maxMonth && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{maxMonth.label} oyi</span>
                <span className="badge badge-success badge-sm">eng yuqori daromad</span>
              </div>
              <dl className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-base-200 p-3">
                  <dt className="text-[11px] text-base-content/45">Daromad</dt>
                  <dd className="font-extrabold tabular-nums text-success">{money(maxMonth.income)}</dd>
                </div>
                <div className="rounded-xl border border-base-200 p-3">
                  <dt className="text-[11px] text-base-content/45">Xarajat</dt>
                  <dd className="font-extrabold tabular-nums">{money(maxMonth.expenses)}</dd>
                </div>
                <div className="rounded-xl border border-base-200 p-3">
                  <dt className="text-[11px] text-base-content/45">Foyda</dt>
                  <dd className="font-extrabold tabular-nums text-primary">{money(maxMonth.profit)}</dd>
                </div>
              </dl>
              <div className="text-[12px] text-base-content/45">
                {maxMonth.payments} ta to'lov qabul qilingan
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Oylar jadvali ── */}
      <Panel title="Oylik hisobot" icon={CalendarDays} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                <th className="pl-5">Oy</th>
                <th className="text-right">Daromad</th>
                <th className="text-right">Xarajat</th>
                <th className="text-right">Foyda</th>
                <th className="text-right">To'lovlar</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((m) => (
                <tr key={m.key} className="hover:bg-base-200/50 transition-colors">
                  <td className="pl-5 text-[13px] font-semibold">{m.label}</td>
                  <td className="text-right text-[13px] font-semibold tabular-nums text-success">{money(m.income)}</td>
                  <td className="text-right text-[13px] tabular-nums">{money(m.expenses)}</td>
                  <td className={`text-right text-[13px] font-bold tabular-nums ${m.profit >= 0 ? 'text-primary' : 'text-error'}`}>
                    {money(m.profit)}
                  </td>
                  <td className="pr-5 text-right text-[13px] tabular-nums text-base-content/70">{fmt(m.payments)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
