import { useMemo, useState } from 'react';
import { Receipt, PieChart as PieIcon, AlertTriangle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, BranchSelect, MonthSelect, PlannedBadge } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { BRANCHES, MONTHS, CURRENT_MONTH, EXPENSES, monthRow, MONTH_LABEL } from './_data.js';

const scopeTotal = (branchId, monthKey) =>
  branchId === 'all'
    ? BRANCHES.reduce((a, b) => a + (monthRow(b.id, monthKey)?.expenses ?? 0), 0)
    : (monthRow(branchId, monthKey)?.expenses ?? 0);

const prevMonthKey = (monthKey) => {
  const i = MONTHS.findIndex((m) => m.key === monthKey);
  return i > 0 ? MONTHS[i - 1].key : monthKey;
};

const CAT_COLORS = ['#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#22c55e', '#64748b'];

export default function FinanceExpenses() {
  const { t } = useT();
  const [branchId, setBranchId] = useState('all');
  const [monthKey, setMonthKey] = useState(CURRENT_MONTH);
  const [search, setSearch] = useState('');
  const [planned, setPlanned] = useState('all');

  const total = scopeTotal(branchId, monthKey);
  const prevTotal = scopeTotal(branchId, prevMonthKey(monthKey));
  const trend = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  const detail = branchId !== 'all' && monthKey === CURRENT_MONTH ? EXPENSES[branchId] : null;

  // Неплановые расходы текущего месяца по выбранному филиалу
  const unplannedTotal = detail ? detail.filter((e) => e.planned === false).reduce((a, e) => a + e.amount, 0) : null;

  // Фильтрация: поиск по примечанию/категории + фильтр плановости
  const filteredDetail = useMemo(() => {
    if (!detail) return [];
    const q = search.trim().toLowerCase();
    return detail.filter((e) => {
      if (planned === 'planned' && e.planned !== true) return false;
      if (planned === 'unplanned' && e.planned !== false) return false;
      if (!q) return true;
      return `${e.category} ${e.note}`.toLowerCase().includes(q);
    });
  }, [detail, search, planned]);

  // Разбивка по категориям из детальных транзакций текущего месяца
  const catBreakdown = useMemo(() => {
    if (!detail) return [];
    const map = new Map();
    detail.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [detail]);

  const rows = useMemo(() => {
    if (branchId === 'all') {
      return BRANCHES.map((b) => ({ key: b.id, label: b.name, value: monthRow(b.id, monthKey)?.expenses ?? 0 }));
    }
    return MONTHS.map((m) => ({ key: m.key, label: m.label, value: monthRow(branchId, m.key)?.expenses ?? 0 }));
  }, [branchId, monthKey]);

  const label = branchId === 'all' ? t('common.allBranches') : BRANCHES.find((b) => b.id === branchId).name;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('expenses.title')} subtitle={t('expenses.subtitle')}>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          Icon={Receipt}
          label={t('kpi.expenses')}
          value={money(total)}
          sub={`${label} · ${MONTH_LABEL[monthKey]}`}
          tone="warning"
          trend={trend}
          trendLabel={t('common.vsPrev')}
        />
        {unplannedTotal !== null && (
          <Metric
            Icon={AlertTriangle}
            label={t('expenses.unplannedKpi')}
            value={money(unplannedTotal)}
            sub={t('expenses.unplannedSub')}
            tone="info"
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card
          title={t('expenses.title')}
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
                    <td className="text-right tabular-nums text-warning font-semibold">{money(r.value)}</td>
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

        <Card title={t('expenses.catBreakdown')} bodyClass="p-4 h-[340px]">
          {catBreakdown.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {catBreakdown.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="flex flex-col items-center gap-2 text-base-content/40">
                <PieIcon size={28} />
                <p className="text-sm">{t('common.noData')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {detail && (
        <Card
          title={`${t('expenses.title')} · ${label} · ${MONTH_LABEL[monthKey]}`}
          action={
            <div className="flex items-center gap-2">
              <label className="input input-bordered input-sm flex items-center gap-2">
                <Search size={14} className="text-base-content/40" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-40"
                />
              </label>
              <select className="select select-bordered select-sm" value={planned} onChange={(e) => setPlanned(e.target.value)}>
                <option value="all">{t('expenses.allExpenses')}</option>
                <option value="planned">{t('expenses.planned')}</option>
                <option value="unplanned">{t('expenses.unplanned')}</option>
              </select>
            </div>
          }
          bodyClass="p-0"
        >
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wider text-base-content/50">
                  <th>{t('common.date')}</th>
                  <th>{t('common.category')}</th>
                  <th>{t('common.note')}</th>
                  <th>{t('common.filter')}</th>
                  <th className="text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetail.map((e) => (
                  <tr key={e.id} className="text-sm">
                    <td className="tabular-nums whitespace-nowrap">{e.date}</td>
                    <td><span className="badge badge-sm badge-outline">{e.category}</span></td>
                    <td className="text-base-content/70">{e.note}</td>
                    <td><PlannedBadge planned={e.planned} t={t} /></td>
                    <td className="text-right tabular-nums font-semibold text-warning">{money(e.amount)}</td>
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
