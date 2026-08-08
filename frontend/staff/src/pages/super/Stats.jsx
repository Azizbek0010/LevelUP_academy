import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Download,
  Landmark, CreditCard, Users, Percent,
  TrendingUp, Wallet,
} from 'lucide-react';
import { useSuperStats } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { fmt, money } from '../../format.js';
import { getOrgName, orgSlug } from '../../utils/exportUtils.js';
import { Card, Metric, FilterPills, CHART_PRIMARY, CHART_SERIES } from './_ui.jsx';

/**
 * Статистика организации.
 *
 * Страница жила на `/super/dashboard` — том же эндпоинте, что и Дашборд с
 * Аналитикой. Оттуда приходят только итоги и филиалы, поэтому «выручка по
 * дням» рисовалась по филиалам, способов оплаты не было вовсе (на их месте
 * когда-то стояли зашитые 65/30/5 %), а переключатель периода 7/30/90 менял
 * только подсветку кнопки — запрос он не трогал.
 *
 * Теперь свой эндпоинт `GET /api/super/stats?period=` — он и был написан для
 * этой страницы: ряд выручки по дням, разбивка по способам оплаты и итоги,
 * посчитанные за выбранный период.
 */

const METHOD_LABEL = { cash: 'Наличные', card: 'Карта', transfer: 'Перевод' };

const PERIODS = [
  { key: '7d', label: '7 дней' },
  { key: '30d', label: '30 дней' },
  { key: '90d', label: '90 дней' },
];

// ---- Custom Tooltip ----
function NeonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-4 py-3 shadow-lg text-sm">
      {label && <p className="font-semibold mb-2 text-base-content/60">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-base-content/70">{p.name}:</span>
          <span className="font-bold">{typeof p.value === 'number' ? money(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Main ----
export default function SuperStats() {
  const [period, setPeriod] = useState('30d');
  const { data, isLoading, error } = useSuperStats(period);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Статистика" />
        <SkeletonKpis count={4} />
        <SkeletonTable />
      </div>
    );
  }

  if (error && error.status !== 401) {
    return (
      <div className="alert alert-error text-sm"><span>{error.message}</span></div>
    );
  }

  const t = data.totals ?? {};
  const cur = t.currency ?? 'UZS';
  const branches = data.branches ?? [];

  // средняя выручка и доля долга приходят с сервера — считать их второй раз незачем
  const avgRevenue = t.periodAvgRevenue ?? 0;
  const debtRatio = (t.debtRatio ?? 0).toFixed(1);
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? period;

  /* Выручка по дням за выбранный период — то, ради чего график и нужен.
     Раньше по оси X стояли филиалы, то есть «динамика» была не динамикой. */
  const areaData = (data.revenueSeries ?? []).map((p) => ({
    name: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    Выручка: Number(p.revenue ?? 0),
  }));

  const methodData = (data.paymentMethods ?? [])
    .map((m, i) => ({
      name: METHOD_LABEL[m.method] ?? m.method,
      value: Number(m.amount ?? 0),
      color: CHART_SERIES[i % CHART_SERIES.length],
    }))
    .filter((m) => m.value > 0);
  const methodTotal = methodData.reduce((s, m) => s + m.value, 0);

  // Horizontal bar chart: same as area
  const barData = branches.map((b) => ({
    name: b.name?.split(' ')[0] ?? b.name,
    revenue: Number(b.revenue ?? 0),
  }));

  // Pie chart: branch revenue distribution
  const pieData = branches.map((b, i) => ({
    name: b.name,
    value: Number(b.revenue ?? 0),
    color: CHART_SERIES[i % CHART_SERIES.length],
  }));

  const handleExportCSV = () => {
    let csv = '﻿';
    csv += `"Статистика ${getOrgName()}","${new Date().toLocaleDateString('ru-RU')}","Период: ${periodLabel}"\n\n`;
    csv += `"Выручка за период","Выручка за всё время","Долг","Ученики","Доля долга"\n`;
    csv += `${t.periodRevenue ?? 0},${t.revenue},${t.outstandingDebt ?? 0},${t.activeStudents},${debtRatio}%\n\n`;
    csv += `"Филиал","Выручка","Долг","Доля"\n`;
    branches.forEach((b) => {
      csv += `"${b.name}",${b.revenue ?? 0},${b.debt ?? 0},${(b.share ?? 0).toFixed(1)}%\n`;
    });
    if (methodData.length) {
      csv += `\n"Способ оплаты","Сумма"\n`;
      methodData.forEach((m) => { csv += `"${m.name}",${m.value}\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${orgSlug()}_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Статистика" subtitle="Финансовые показатели организации">
        <div className="flex items-center gap-3">
          <FilterPills options={PERIODS.map((p) => ({ key: p.key, label: p.label }))} value={period} onChange={setPeriod} />
          <button className="btn btn-primary btn-sm gap-1.5" onClick={handleExportCSV}>
            <Download size={16} /> Экспорт CSV
          </button>
        </div>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Первая карточка — за период, остальные про «сейчас». Пока выручка
            была за всё время, а графики под ней за 7 дней, на одном экране
            стояли два разных числа про одно и то же. */}
        <Metric
          Icon={Landmark}
          tone="primary"
          label={`Выручка за ${periodLabel.toLowerCase()}`}
          value={money(t.periodRevenue ?? 0, cur)}
          unit={`Средняя: ${money(avgRevenue)} / филиал`}
        />
        <Metric
          Icon={CreditCard}
          tone="danger"
          label="Долг"
          value={money(t.outstandingDebt ?? 0, cur)}
          unit="Задолженность на сегодня"
        />
        <Metric
          Icon={Users}
          tone="info"
          label="Ученики"
          value={fmt(t.activeStudents ?? 0)}
          unit={`В ${t.branches ?? 0} филиалах`}
        />
        <Metric
          Icon={Percent}
          tone="warning"
          label="Доля долга"
          value={`${debtRatio}%`}
          unit="От общей суммы счетов"
        />
      </div>

      {/* Hero area chart */}
      <Card className="p-5 md:p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Выручка по дням
        </h2>
        {areaData.length === 0 ? (
          <p className="text-center py-12 opacity-50 text-sm">За выбранный период оплат не было</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_PRIMARY} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0 0 / 0.5)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip content={<NeonTooltip />} />
              <Area type="monotone" dataKey="Выручка" stroke={CHART_PRIMARY} fill="url(#gradRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Bar + Pie row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Bar chart: revenue per branch */}
        <Card className="p-5 md:p-6">
          <h2 className="text-base font-bold mb-4">Выручка по филиалам</h2>
          {barData.length === 0 ? (
            <p className="text-center py-10 opacity-50 text-sm">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(90% 0 0 / 0.5)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<NeonTooltip />} />
                <Bar dataKey="revenue" name="Выручка" fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie chart: branch revenue distribution */}
        <Card className="p-5 md:p-6">
          <h2 className="text-base font-bold mb-4">Доля выручки по филиалам</h2>
          {pieData.length === 0 ? (
            <p className="text-center py-10 opacity-50 text-sm">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Сводная таблица по филиалам — перенесена со страницы «Отчёты» (слита
          сюда 2026-07-28): та же выборка, что и в графиках выше, но с точной
          долей филиала в общей выручке, посчитанной на сервере. */}
      <Card className="p-5 md:p-6">
        <h2 className="text-base font-bold mb-4">Сводка по филиалам</h2>
        {branches.length === 0 ? (
          <p className="text-center py-10 opacity-50 text-sm">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm tabular-nums">
              <thead>
                <tr>
                  <th>Филиал</th>
                  <th className="text-right">Ученики</th>
                  <th className="text-right">Админы</th>
                  <th className="text-right">Выручка</th>
                  <th className="text-right">Долг</th>
                  <th className="text-right">Доля</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id} className="hover">
                    <td className="font-semibold">
                      <Link to={`/branches/${b.id}`} className="hover:underline">{b.name}</Link>
                    </td>
                    <td className="text-right">{fmt(b.students ?? 0)}</td>
                    <td className="text-right">{fmt(b.admins ?? 0)}</td>
                    <td className="text-right font-medium">{money(b.revenue ?? 0)}</td>
                    <td className="text-right text-error">{money(b.debt ?? 0)}</td>
                    <td className="text-right">{(b.share ?? 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Способы оплаты — теперь по реальным транзакциям за период.
          Раньше здесь стояли зашитые 65 / 30 / 5 %, и партнёр принимал их
          за свои цифры; блок убрали, а вернуть его можно было только вместе
          с настоящей агрегацией — она приходит с /super/stats. */}
      <Card className="p-5 md:p-6">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
          <Wallet size={18} /> Способы оплаты
        </h2>
        {methodData.length === 0 ? (
          <p className="text-center py-10 opacity-50 text-sm">За выбранный период оплат не было</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-full sm:w-56 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {methodData.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-2">
              {methodData.map((m) => (
                <div key={m.name} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                  <span className="flex-1">{m.name}</span>
                  <span className="font-bold tabular-nums">{money(m.value, cur)}</span>
                  <span className="text-xs text-base-content/45 w-12 text-right tabular-nums">
                    {methodTotal > 0 ? `${Math.round((m.value / methodTotal) * 100)}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
