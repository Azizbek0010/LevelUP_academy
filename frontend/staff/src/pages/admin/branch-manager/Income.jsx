import { useState } from 'react';
import { TrendingUp, Wallet, CheckCircle2, CalendarDays, CreditCard } from 'lucide-react';
import { money } from '../../../format.js';
import PageHeader from '../../../components/PageHeader.jsx';
import { Panel, Kpi } from '../../mentor/_ui.jsx';
import { PaymentStatusBadge } from './_ui.jsx';
import { PAYMENTS, MONTHS, CURRENT_MONTH, BRANCH } from './_data.js';

export default function BranchManagerIncome() {
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH);

  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[MONTHS.length - 1];
  const rows = PAYMENTS.filter((p) => p.monthKey === monthKey);

  const total = rows.reduce((s, p) => s + p.amount, 0);
  const paid = rows.filter((p) => p.status === 'paid').length;
  const overdue = rows.filter((p) => p.status === 'overdue').length;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Daromad"
        subtitle={`${BRANCH.name} · to'lovlar va qarzdorlik`}
      />

      {/* ── Oy tanlash ── */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMonthKey(m.key)}
            className={`btn btn-sm rounded-lg transition-all ${
              m.key === monthKey
                ? 'btn-primary'
                : 'btn-ghost border border-base-200 text-base-content/60 hover:border-primary/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi Icon={TrendingUp} title="Oy daromadi" value={money(total)} unit={`${month.label} oyi`} tone="success" />
        <Kpi Icon={CheckCircle2} title="To'langan" value={paid} unit={`${rows.length} ta to'lovdan`} tone="neutral" />
        <Kpi Icon={Wallet} title="Muddati o'tgan" value={overdue} unit="qarzdor to'lovlar" tone="danger" />
        <Kpi Icon={CalendarDays} title="Umumiy qarzdorlik" value={money(BRANCH.stats.debt)} unit="filial bo'yicha" tone="warning" />
      </div>

      {/* ── To'lovlar jadvali ── */}
      <Panel title={`To'lovlar — ${month.label}`} icon={CreditCard} bodyClass="p-0">
        {rows.length === 0 ? (
          <p className="text-[13px] text-base-content/45 text-center py-10">Bu oyda to'lovlar yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                  <th className="pl-5">Sana</th>
                  <th>Talaba</th>
                  <th>Guruh</th>
                  <th className="hidden md:table-cell">Usul</th>
                  <th className="text-right">Summa</th>
                  <th className="pr-5 text-right">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="pl-5 text-[13px] text-base-content/60 tabular-nums whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="text-[13px] font-semibold">{p.student}</td>
                    <td className="text-[13px] text-base-content/70">{p.group}</td>
                    <td className="hidden md:table-cell text-[13px] text-base-content/60">{p.method}</td>
                    <td className="text-right text-[14px] font-extrabold tabular-nums">{money(p.amount)}</td>
                    <td className="pr-5 text-right"><PaymentStatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-base-200">
                  <td colSpan={4} className="pl-5 text-[12px] font-semibold text-base-content/60">Jami</td>
                  <td className="text-right text-[15px] font-extrabold tabular-nums text-success">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
