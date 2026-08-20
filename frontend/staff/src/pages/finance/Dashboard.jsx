import {
  Wallet, TriangleAlert, Users, Building2, TrendingUp,
} from 'lucide-react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { Metric, Card, compactMoney } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { useSuperStats } from '../../queries.js';

const BRANCH_COLORS = ['#16a34a', '#f59e0b', '#0ea5e9'];

export default function FinanceDashboard() {
  const { t, lang } = useT();
  const { data, isLoading, error, refetch } = useSuperStats('30d');

  if (error) return <button className="btn btn-error" onClick={() => refetch()}>{error.message}</button>;
  if (isLoading || !data) return <div className="loading loading-spinner loading-lg" />;

  const totals = data.totals;
  const chartData = (data.revenueSeries || []).map((row) => ({
    name: new Date(row.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: '2-digit' }),
    income: Number(row.revenue || 0),
  }));

  const branchIncome = (data.branches || []).map((b) => ({
    name: b.name,
    value: Number(b.revenue || 0),
  })).filter((b) => b.value > 0);

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <PageHeader title={t('dash.title')} subtitle={t('dash.subtitle')} />

      {/* ── KPI организации за текущий месяц ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <Metric
          Icon={Wallet}
          label={t('kpi.income')}
          value={money(totals.periodRevenue)}
          sub={lang === 'ru' ? 'Последние 30 дней · вся организация' : lang === 'uz' ? "So‘nggi 30 kun · butun tashkilot" : 'Last 30 days · whole org'}
          tone="success"
        />
        <Metric
          Icon={TriangleAlert}
          label={lang === 'ru' ? 'Долг' : 'Qarzdorlik'}
          value={money(totals.outstandingDebt)}
          tone="warning"
        />
        <Metric
          Icon={Users}
          label={lang === 'ru' ? 'Ученики' : "O‘quvchilar"}
          value={totals.activeStudents}
          tone="info"
        />
        <Metric
          Icon={Building2}
          label={lang === 'ru' ? 'Филиалы' : 'Filiallar'}
          value={totals.branches}
          tone="neutral"
        />
      </div>

      {/* ── Тренд по месяцам + доля филиалов ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <Card title={t('dash.trendChart')} subtitle={lang === 'ru' ? 'Фактические поступления за 30 дней' : '30 kunlik haqiqiy tushum'} className="xl:col-span-2" bodyClass="p-4 h-[340px]">
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
        <Link to="/finance/reports" className="btn btn-primary gap-2">
          <TrendingUp size={16} /> {t('dash.viewReports')}
        </Link>
      </div>
    </div>
  );
}
