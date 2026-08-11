import { useMemo, useState } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, StatusBadge, BranchSelect, MonthSelect } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { BRANCHES, MONTHS, CURRENT_MONTH, INCOME, monthRow, MONTH_LABEL } from './_data.js';

const scopeTotal = (branchId, monthKey) =>
  branchId === 'all'
    ? BRANCHES.reduce((a, b) => a + (monthRow(b.id, monthKey)?.income ?? 0), 0)
    : (monthRow(branchId, monthKey)?.income ?? 0);

const prevMonthKey = (monthKey) => {
  const i = MONTHS.findIndex((m) => m.key === monthKey);
  return i > 0 ? MONTHS[i - 1].key : monthKey;
};

export default function FinanceIncome() {
  const { t } = useT();
  const [branchId, setBranchId] = useState('all');
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH);

  const total = scopeTotal(branchId, monthKey);
  const prevTotal = scopeTotal(branchId, prevMonthKey(monthKey));
  const trend = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  // Детальные платежи видны только по конкретному филиалу за текущий месяц
  const detail = branchId !== 'all' && monthKey === CURRENT_MONTH ? INCOME[branchId] : null;

  const rows = useMemo(() => {
    if (branchId === 'all') {
      return BRANCHES.map((b) => ({ key: b.id, label: b.name, value: monthRow(b.id, monthKey)?.income ?? 0 }));
    }
    return MONTHS.map((m) => ({ key: m.key, label: m.label, value: monthRow(branchId, m.key)?.income ?? 0 }));
  }, [branchId, monthKey]);

  const label = branchId === 'all' ? t('common.allBranches') : BRANCHES.find((b) => b.id === branchId).name;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('income.title')} subtitle={t('income.subtitle')}>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          Icon={Wallet}
          label={t('kpi.income')}
          value={money(total)}
          sub={`${label} · ${MONTH_LABEL[monthKey]}`}
          tone="success"
          trend={trend}
          trendLabel={t('common.vsPrev')}
        />
        <Metric
          Icon={TrendingUp}
          label={t('common.total')}
          value={`${rows.length}`}
          sub={branchId === 'all' ? t('common.branch') : t('common.month')}
          tone="info"
        />
      </div>

      <Card
        title={t('income.tableTitle')}
        action={
          <div className="flex items-center gap-2">
            <BranchSelect value={branchId} onChange={setBranchId} allLabel={t('common.allBranches')} branches={BRANCHES} />
            <MonthSelect value={monthKey} onChange={setMonthKey} months={MONTHS} />
          </div>
        }
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
                  <td className="text-right tabular-nums text-success font-semibold">{money(r.value)}</td>
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

      {detail && (
        <Card
          title={`${t('income.tableTitle')} · ${label} · ${MONTH_LABEL[monthKey]}`}
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                  <th>{t('common.date')}</th>
                  <th>{t('income.student')}</th>
                  <th>{t('income.group')}</th>
                  <th>{t('common.method')}</th>
                  <th>{t('common.status')}</th>
                  <th className="text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((p) => (
                  <tr key={p.id} className="text-sm">
                    <td className="tabular-nums whitespace-nowrap">{p.date}</td>
                    <td className="font-medium">{p.student}</td>
                    <td className="text-base-content/70">{p.group}</td>
                    <td>{p.method}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-right tabular-nums font-semibold">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
