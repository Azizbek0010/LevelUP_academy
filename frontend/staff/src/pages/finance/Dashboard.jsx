import {
  Wallet, Receipt, BadgeDollarSign, TrendingUp, Building2,
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, compactMoney } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { BRANCHES, MONTHS, CURRENT_MONTH, monthRow, orgSeries, MONTH_LABEL } from './_data.js';

const BRANCH_COLORS = ['#16a34a', '#f59e0b', '#0ea5e9'];

export default function FinanceDashboard() {
  const { t, lang } = useT();
  const series = orgSeries();
  const cur = series[series.length - 1];
  const prev = series[series.length - 2] || cur;

  const trend = (key) => {
    if (!prev[key]) return 0;
    return Math.round(((cur[key] - prev[key]) / prev[key]) * 100);
  };
  const netProfit = cur.income - cur.expenses - cur.salaries;

  const chartData = series.map((m) => ({
    name: m.label,
    income: m.income,
    expenses: m.expenses,
    profit: m.income - m.expenses - m.salaries,
  }));

  const branchIncome = BRANCHES.map((b) => ({
    name: b.name,
    value: monthRow(b.id, CURRENT_MONTH)?.income ?? 0,
  })).filter((b) => b.value > 0);

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <PageHeader title={t('dash.title')} subtitle={t('dash.subtitle')} />

      {/* ── KPI организации за текущий месяц ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <Metric
          Icon={Wallet}
          label={t('kpi.income')}
          value={money(cur.income)}
          sub={`${MONTH_LABEL[CURRENT_MONTH]} · ${lang === 'ru' ? 'весь офис' : lang === 'uz' ? 'butun tashkilot' : 'whole org'}`}
          tone="success"
          trend={trend('income')}
          trendLabel={t('common.vsPrev')}
        />
        <Metric
          Icon={Receipt}
          label={t('kpi.expenses')}
          value={money(cur.expenses)}
          tone="warning"
          trend={trend('expenses')}
          trendLabel={t('common.vsPrev')}
        />
        <Metric
          Icon={BadgeDollarSign}
          label={t('kpi.salaries')}
          value={money(cur.salaries)}
          tone="info"
          trend={trend('salaries')}
          trendLabel={t('common.vsPrev')}
        />
        <Metric
          Icon={TrendingUp}
          label={t('kpi.netProfit')}
          value={money(netProfit)}
          sub="income − expenses − salaries"
          tone="neutral"
        />
      </div>

      {/* ── Тренд по месяцам + доля филиалов ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <Card title={t('dash.trendChart')} subtitle={t('dash.monthlyProfit')} className="xl:col-span-2" bodyClass="p-4 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
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
              <Line type="monotone" dataKey="profit" name={t('dash.profitLine')} stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card title={t('dash.branchShare')} bodyClass="p-4 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={branchIncome} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {branchIncome.map((_, i) => (
                  <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => money(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Быстрые действия ── */}
      <div className="flex gap-3">
        <a href="/finance/reports" className="btn btn-primary gap-2">
          <TrendingUp size={16} /> {t('dash.viewReports')}
        </a>
      </div>
    </div>
  );
}
