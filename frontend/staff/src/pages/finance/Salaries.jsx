import { useMemo, useState } from 'react';
import { BadgeDollarSign, Users } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, BranchSelect, MonthSelect } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { BRANCHES, MONTHS, CURRENT_MONTH, SALARIES, monthRow, MONTH_LABEL } from './_data.js';

const scopeTotal = (branchId, monthKey) =>
  branchId === 'all'
    ? BRANCHES.reduce((a, b) => a + (monthRow(b.id, monthKey)?.salaries ?? 0), 0)
    : (monthRow(branchId, monthKey)?.salaries ?? 0);

export default function FinanceSalaries() {
  const { t } = useT();
  const [branchId, setBranchId] = useState('all');
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH);

  const total = scopeTotal(branchId, monthKey);
  const label = branchId === 'all' ? t('common.allBranches') : BRANCHES.find((b) => b.id === branchId).name;

  const detail = SALARIES[branchId];

  const rows = useMemo(() => {
    if (branchId === 'all') {
      return BRANCHES.map((b) => ({ key: b.id, label: b.name, value: monthRow(b.id, monthKey)?.salaries ?? 0 }));
    }
    return MONTHS.map((m) => ({ key: m.key, label: m.label, value: monthRow(branchId, m.key)?.salaries ?? 0 }));
  }, [branchId, monthKey]);

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('salaries.title')} subtitle={t('salaries.subtitle')}>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <Metric
          Icon={BadgeDollarSign}
          label={t('salaries.payroll')}
          value={money(total)}
          sub={`${label} · ${MONTH_LABEL[monthKey]}`}
          tone="info"
        />
        <Metric
          Icon={Users}
          label={t('common.staff')}
          value={`${BRANCHES.reduce((a, b) => a + b.staff, 0)}`}
          sub={t('common.allBranches')}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <Card
          title={t('common.period')}
          action={
            <div className="flex items-center gap-2">
              <BranchSelect value={branchId} onChange={setBranchId} allLabel={t('common.allBranches')} branches={BRANCHES} />
              <MonthSelect value={monthKey} onChange={setMonthKey} months={MONTHS} />
            </div>
          }
          className="xl:col-span-2"
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                  <th>{branchId === 'all' ? t('common.branch') : t('common.month')}</th>
                  <th className="text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="text-sm">
                    <td className="font-medium">{r.label}</td>
                    <td className="text-right tabular-nums text-info font-semibold">{money(r.value)}</td>
                  </tr>
                ))}
                <tr className="border-t border-base-300 bg-base-200/50 font-bold text-sm">
                  <td>{t('common.total')}</td>
                  <td className="text-right tabular-nums">{money(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t('common.share')} bodyClass="p-4">
          {rows.map((r) => {
            const pct = total ? Math.round((r.value / total) * 100) : 0;
            return (
              <div key={r.key} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium truncate">{r.label}</span>
                  <span className="tabular-nums text-base-content/60">{pct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-base-200 overflow-hidden">
                  <div className="h-full rounded-full bg-info/70" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {detail && (
        <Card
          title={`${t('salaries.sheetTitle')} · ${label} · ${MONTH_LABEL[monthKey]}`}
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                  <th>{t('common.employee')}</th>
                  <th>{t('common.position')}</th>
                  <th className="text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((s) => (
                  <tr key={s.id} className="text-sm">
                    <td className="font-medium">{s.name}</td>
                    <td className="text-base-content/70">{s.position}</td>
                    <td className="text-right tabular-nums font-semibold text-info">{money(s.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t border-base-300 bg-base-200/50 font-bold text-sm">
                  <td>{t('common.total')}</td>
                  <td />
                  <td className="text-right tabular-nums">{money(detail.reduce((a, s) => a + s.amount, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
