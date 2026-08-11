import { useState } from 'react';
import { TrendingUp, Wallet, CheckCircle2, CalendarDays, CreditCard } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { PaymentStatusBadge } from './_ui.jsx';
import { useBranchManagerIncome } from '../../queries.js';

export default function BranchManagerIncome() {
  const [monthKey, setMonthKey] = useState('2026-08');
  const { data, isLoading, error } = useBranchManagerIncome(monthKey);

  if (isLoading) return <div className="p-8 text-center text-base-content/45">Загрузка...</div>;
  if (error) return <div className="p-8 text-center text-error">Произошла ошибка</div>;

  const rows = data?.payments || [];
  const total = data?.total || 0;
  const paid = data?.paidCount || 0;
  const overdue = data?.overdueCount || 0;
  const debt = data?.debt || 0;

  const MONTHS = [
    { key: '2026-03', label: 'Март' },
    { key: '2026-04', label: 'Апрель' },
    { key: '2026-05', label: 'Май' },
    { key: '2026-06', label: 'Июнь' },
    { key: '2026-07', label: 'Июль' },
    { key: '2026-08', label: 'Август' },
  ];
  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[MONTHS.length - 1];

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Доход"
        subtitle={`Филиал · платежи и задолженность`}
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
        <Kpi Icon={TrendingUp} title="Доход за месяц" value={money(total)} unit={`месяц ${month.label}`} tone="success" />
        <Kpi Icon={CheckCircle2} title="Оплачено" value={paid} unit={`из ${rows.length} платежей`} tone="neutral" />
        <Kpi Icon={Wallet} title="Просрочено" value={overdue} unit="просроченные платежи" tone="danger" />
        <Kpi Icon={CalendarDays} title="Общая задолженность" value={money(debt)} unit="по филиалу" tone="warning" />
      </div>

      {/* ── To'lovlar jadvali ── */}
      <Panel title={`Платежи — ${month.label}`} icon={CreditCard} bodyClass="p-0">
        {rows.length === 0 ? (
          <p className="text-[13px] text-base-content/45 text-center py-10">В этом месяце нет платежей</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                  <th className="pl-5">Дата</th>
                  <th>Студент</th>
                  <th>Группа</th>
                  <th className="hidden md:table-cell">Метод</th>
                  <th className="text-right">Сумма</th>
                  <th className="pr-5 text-right">Статус</th>
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
                  <td colSpan={4} className="pl-5 text-[12px] font-semibold text-base-content/60">Итого</td>
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
