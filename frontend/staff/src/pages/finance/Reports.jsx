import { useState } from 'react';
import { Wallet, Receipt, BadgeDollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, MonthSelect, compactMoney } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { BRANCHES, MONTHS, CURRENT_MONTH, monthRow, MONTH_LABEL } from './_data.js';

const prevMonthKey = (monthKey) => {
  const i = MONTHS.findIndex((m) => m.key === monthKey);
  return i > 0 ? MONTHS[i - 1].key : null;
};

export default function FinanceReports() {
  const { t } = useT();
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH);
  const prev = prevMonthKey(monthKey);

  const rowFor = (b, mk) => {
    const r = monthRow(b.id, mk);
    if (!r) return null;
    const op = r.income - r.expenses;
    return { ...r, op, net: op - r.salaries };
  };

  const rows = BRANCHES.map((b) => {
    const r = rowFor(b, monthKey);
    const p = prev ? rowFor(b, prev) : null;
    return { branch: b, r, p };
  });

  const totals = rows.reduce(
    (acc, { r }) => r ? {
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
      salaries: acc.salaries + r.salaries,
      net: acc.net + (r.income - r.expenses - r.salaries),
    } : acc,
    { income: 0, expenses: 0, salaries: 0, net: 0 },
  );

  const chartData = rows.map(({ branch, r }) => ({
    name: branch.name.replace(' Campus', '').replace(' Academy', ''),
    income: r?.income ?? 0,
    expenses: r?.expenses ?? 0,
    profit: r ? r.income - r.expenses - r.salaries : 0,
  }));

  const trendFor = (b) => {
    if (!prev) return null;
    const cur = monthRow(b.id, monthKey)?.income ?? 0;
    const prv = monthRow(b.id, prev)?.income ?? 0;
    return prv ? Math.round(((cur - prv) / prv) * 100) : null;
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')}>
        <div className="flex items-center gap-2">
          <MonthSelect value={monthKey} onChange={setMonthKey} months={MONTHS} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric Icon={Wallet} label={t('kpi.orgIncome')} value={money(totals.income)} sub={MONTH_LABEL[monthKey]} tone="success" />
        <Metric Icon={Receipt} label={t('kpi.orgExpenses')} value={money(totals.expenses)} tone="warning" />
        <Metric Icon={BadgeDollarSign} label={t('kpi.salaries')} value={money(totals.salaries)} tone="info" />
        <Metric Icon={TrendingUp} label={t('kpi.orgProfit')} value={money(totals.net)} sub="income − expenses − salaries" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title={t('reports.cashFlow')} subtitle={MONTH_LABEL[monthKey]} bodyClass="p-4 h-[320px] xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => compactMoney(v).replace(' mln', 'M').replace(' ming', 'K')}
              />
              <Tooltip formatter={(v) => money(v)} labelStyle={{ fontWeight: 600 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name={t('nav.income')} fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name={t('nav.expenses')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name={t('reports.net')} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('reports.branchTable')} bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                  <th>{t('common.branch')}</th>
                  <th className="text-right">{t('reports.net')}</th>
                  <th className="text-right">{t('reports.vsPrevMonth')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ branch, r }) => {
                  const tr = trendFor(branch);
                  return (
                    <tr key={branch.id} className="text-sm">
                      <td className="font-medium">{branch.name}</td>
                      <td className={`text-right tabular-nums font-bold ${r && r.net >= 0 ? 'text-success' : 'text-error'}`}>
                        {r ? money(r.net) : '—'}
                      </td>
                      <td className="text-right tabular-nums">
                        {tr === null ? <span className="text-base-content/30">—</span> : (
                          <span className={`font-semibold ${tr >= 0 ? 'text-success' : 'text-error'}`}>
                            {tr >= 0 ? '▲' : '▼'} {Math.abs(tr)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-base-300 bg-base-200/50 font-bold text-sm">
                  <td>{t('common.total')}</td>
                  <td className={`text-right tabular-nums ${totals.net >= 0 ? 'text-success' : 'text-error'}`}>{money(totals.net)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title={`${t('reports.branchTable')} · ${MONTH_LABEL[monthKey]}`} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                <th>{t('common.branch')}</th>
                <th>{t('common.students')}</th>
                <th className="text-right">{t('nav.income')}</th>
                <th className="text-right">{t('nav.expenses')}</th>
                <th className="text-right">{t('nav.salaries')}</th>
                <th className="text-right">{t('reports.opProfit')}</th>
                <th className="text-right">{t('reports.net')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ branch, r }) => (
                <tr key={branch.id} className="text-sm">
                  <td className="font-medium">{branch.name}</td>
                  <td className="text-base-content/70">{branch.students}</td>
                  <td className="text-right tabular-nums text-success">{r ? money(r.income) : '—'}</td>
                  <td className="text-right tabular-nums text-warning">{r ? money(r.expenses) : '—'}</td>
                  <td className="text-right tabular-nums text-info">{r ? money(r.salaries) : '—'}</td>
                  <td className="text-right tabular-nums">{r ? money(r.op) : '—'}</td>
                  <td className={`text-right tabular-nums font-bold ${r && r.net >= 0 ? 'text-success' : 'text-error'}`}>{r ? money(r.net) : '—'}</td>
                </tr>
              ))}
              <tr className="border-t border-base-300 bg-base-200/50 font-bold text-sm">
                <td>{t('reports.org')}</td>
                <td className="tabular-nums">{BRANCHES.reduce((a, b) => a + b.students, 0)}</td>
                <td className="text-right tabular-nums text-success">{money(totals.income)}</td>
                <td className="text-right tabular-nums text-warning">{money(totals.expenses)}</td>
                <td className="text-right tabular-nums text-info">{money(totals.salaries)}</td>
                <td className="text-right tabular-nums">{money(totals.income - totals.expenses)}</td>
                <td className={`text-right tabular-nums font-bold ${totals.net >= 0 ? 'text-success' : 'text-error'}`}>{money(totals.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
