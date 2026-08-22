import { useState } from 'react';
import { BadgeDollarSign, Users2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, BranchSelect, MonthSelect, monthOptions } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { useFinanceBranches, useFinanceSalaries } from '../../queries.js';

export default function FinanceSalaries() {
  const { t, lang } = useT();
  const [branchId, setBranchId] = useState('all');
  const months = monthOptions(lang);
  const [monthKey, setMonthKey] = useState(months[0].key);

  const { data: branches } = useFinanceBranches();
  const { data, isLoading } = useFinanceSalaries({
    branchId: branchId === 'all' ? '' : branchId,
    periodMonth: monthKey,
  });
  const rows = data?.salaries ?? [];
  const total = data?.total ?? 0;
  const label = branchId === 'all' ? t('common.allBranches') : (branches ?? []).find((b) => b.id === branchId)?.name ?? '';

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('salaries.title')} subtitle={t('salaries.subtitle')} />

      {/* mentor_salaries — сейчас только для менторов (нет общей ведомости
          по всем должностям филиала), и по факту пока пустая таблица в БД:
          показываем это честно, без выдуманных цифр за branch manager'ов
          и прочий персонал, которых тут раньше рисовал статичный мок. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <Metric
          Icon={BadgeDollarSign}
          label={t('salaries.payroll')}
          value={money(total)}
          sub={`${label} · ${months.find((m) => m.key === monthKey)?.label}`}
          tone="info"
        />
        <Metric Icon={Users2} label={t('common.staff')} value={`${rows.length}`} sub={t('salaries.sheetTitle')} tone="neutral" />
      </div>

      <Card
        title={t('salaries.sheetTitle')}
        action={
          <div className="flex items-center gap-2">
            <BranchSelect value={branchId} onChange={setBranchId} allLabel={t('common.allBranches')} branches={branches ?? []} />
            <MonthSelect value={monthKey} onChange={setMonthKey} months={months} />
          </div>
        }
        bodyClass="p-0"
      >
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                <th>{t('common.employee')}</th>
                {branchId === 'all' && <th>{t('common.branch')}</th>}
                <th>{t('common.status')}</th>
                <th className="text-right">{t('common.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-6 text-base-content/50">{t('common.loading')}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-base-content/50">{t('common.noData')}</td></tr>
              ) : rows.map((s) => (
                <tr key={s.id} className="text-sm">
                  <td className="font-medium">{s.mentorName}</td>
                  {branchId === 'all' && <td className="text-base-content/70">{s.branchName}</td>}
                  <td className="text-base-content/70">{s.status}</td>
                  <td className="text-right tabular-nums font-semibold text-info">{money(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t border-base-300 bg-base-200/50 font-bold text-sm">
                  <td colSpan={branchId === 'all' ? 3 : 2}>{t('common.total')}</td>
                  <td className="text-right tabular-nums">{money(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
