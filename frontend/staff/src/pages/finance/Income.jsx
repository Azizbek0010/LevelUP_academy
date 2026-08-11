import { useMemo, useState } from 'react';
import { Wallet, TrendingUp, Search, CreditCard } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, StatusBadge, MethodBadge, BranchSelect, MonthSelect } from './_ui.jsx';
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
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('all');

  const total = scopeTotal(branchId, monthKey);
  const prevTotal = scopeTotal(branchId, prevMonthKey(monthKey));
  const trend = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;

  // Детальные платежи видны только по конкретному филиалу за текущий месяц
  const detail = branchId !== 'all' && monthKey === CURRENT_MONTH ? INCOME[branchId] : null;

  // Разбивка по методам оплаты (текущий месяц)
  const methodBreakdown = useMemo(() => {
    if (!detail) return [];
    const map = new Map();
    detail.forEach((p) => map.set(p.method, (map.get(p.method) ?? 0) + p.amount));
    return ['Karta', 'Naqd', 'Hybrid']
      .map((m) => ({ method: m, value: map.get(m) ?? 0, count: detail.filter((p) => p.method === m).length }))
      .filter((r) => r.count > 0);
  }, [detail]);

  // Фильтрация: поиск по ученику/группе + фильтр метода оплаты
  const filteredDetail = useMemo(() => {
    if (!detail) return [];
    const q = search.trim().toLowerCase();
    return detail.filter((p) => {
      if (method !== 'all' && p.method !== method) return false;
      if (!q) return true;
      return `${p.student} ${p.group}`.toLowerCase().includes(q);
    });
  }, [detail, search, method]);

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

      {detail && methodBreakdown.length > 0 && (
        <Card
          title={t('income.byMethod')}
          subtitle={`${label} · ${MONTH_LABEL[monthKey]}`}
          bodyClass="p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {methodBreakdown.map((r) => (
              <div key={r.method} className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/40 px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-base-content/5">
                  <CreditCard size={18} className="text-base-content/60" />
                </span>
                <div className="min-w-0">
                  <MethodBadge method={r.method} t={t} />
                  <p className="mt-1 text-[16px] font-extrabold tabular-nums">{money(r.value)}</p>
                </div>
                <span className="ml-auto text-[12px] text-base-content/40">{r.count} {t('common.total').toLowerCase()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
              <select className="select select-bordered select-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="all">{t('common.method')} · {t('common.all')}</option>
                {['Karta', 'Naqd', 'Hybrid'].map((m) => (
                  <option key={m} value={m}>{t(m === 'Karta' ? 'method.karta' : m === 'Naqd' ? 'method.naqd' : 'method.hybrid')}</option>
                ))}
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
                  <th>{t('income.student')}</th>
                  <th>{t('income.group')}</th>
                  <th>{t('common.method')}</th>
                  <th>{t('common.status')}</th>
                  <th className="text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetail.map((p) => (
                  <tr key={p.id} className="text-sm">
                    <td className="tabular-nums whitespace-nowrap">{p.date}</td>
                    <td className="font-medium">{p.student}</td>
                    <td className="text-base-content/70">{p.group}</td>
                    <td><MethodBadge method={p.method} t={t} /></td>
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
