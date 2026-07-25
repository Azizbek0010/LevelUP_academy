import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowUpRight, ArrowDownRight, Download,
  Landmark, CreditCard, Users, Percent,
  TrendingUp,
} from 'lucide-react';
import { useSuperDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { fmt, money } from '../../format.js';

// ---- Colors ----
const PRIMARY = '#3b82f6';
const TEAL    = 'oklch(75% 0.16 175)';
const ERR     = 'oklch(62% 0.24 25)';
const NEON    = ['#3b82f6', '#34D1FF', '#FF6B6B', '#A78BFA', '#34FFB0', '#FFB534'];

// ---- Payment mock ----
const PAYMENT_METHODS = [
  { name: 'Наличные', value: 65 },
  { name: 'Карта',    value: 30 },
  { name: 'Online',   value: 5  },
];

// ---- Delta chip ----
function DeltaChip({ delta }) {
  if (delta == null) return null;
  const pos = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${pos ? 'text-success' : 'text-error'}`}>
      {pos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

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

// ---- KPI Card ----
function KpiCard({ icon: Icon, iconColor, bgColor, label, value, sub, delta }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${bgColor}`}>
            <Icon size={20} className={iconColor} />
          </div>
          <span className="text-sm text-base-content/60 font-medium">{label}</span>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <div className="text-2xl font-extrabold tabular-nums">{value}</div>
          <DeltaChip delta={delta} />
        </div>
        {sub && <div className="text-xs text-base-content/50 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// ---- Date filter pill ----
function DatePills({ value, onChange }) {
  return (
    <div className="join">
      {['7д', '30д', '90д'].map((d) => (
        <button
          key={d}
          className={`join-item btn btn-xs ${value === d ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onChange(d)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

// ---- Main ----
export default function SuperStats() {
  const { data, isLoading, error } = useSuperDashboard();
  const [dateRange, setDateRange] = useState('30д');

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

  const avgRevenue = t.branches > 0 ? t.revenue / t.branches : 0;
  const debtRatio  = t.revenue > 0
    ? (((t.outstandingDebt ?? 0) / ((t.revenue) + (t.outstandingDebt ?? 0))) * 100).toFixed(1)
    : '0.0';

  // Area chart data: revenue per branch (use branch names as X axis)
  const areaData = branches.map((b) => ({
    name: b.name?.split(' ')[0] ?? b.name,
    Выручка: Number(b.revenue ?? 0),
    Долг:    Number(b.debt ?? 0),
  }));

  // Horizontal bar chart: same as area
  const barData = branches.map((b) => ({
    name: b.name?.split(' ')[0] ?? b.name,
    revenue: Number(b.revenue ?? 0),
  }));

  // Pie chart: branch revenue distribution
  const pieData = branches.map((b, i) => ({
    name: b.name,
    value: Number(b.revenue ?? 0),
    color: NEON[i % NEON.length],
  }));

  const handleExportCSV = () => {
    let csv = '﻿';
    csv += `"Статистика LevelUp Academy","${new Date().toLocaleDateString('ru-RU')}"\n\n`;
    csv += `"Выручка","Долг","Ученики","Доля долга"\n`;
    csv += `${t.revenue},${t.outstandingDebt ?? 0},${t.activeStudents},${debtRatio}%\n\n`;
    csv += `"Филиал","Выручка","Долг"\n`;
    branches.forEach((b) => {
      csv += `"${b.name}",${b.revenue ?? 0},${b.debt ?? 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `levelup_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Статистика" subtitle="Финансовые показатели организации">
        <div className="flex items-center gap-3">
          <DatePills value={dateRange} onChange={setDateRange} />
          <button className="btn btn-primary btn-sm gap-1.5" onClick={handleExportCSV}>
            <Download size={16} /> Экспорт CSV
          </button>
        </div>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Landmark}
          iconColor="text-primary"
          bgColor="bg-primary/10"
          label="Выручка"
          value={money(t.revenue ?? 0, cur)}
          sub={`Средняя: ${money(avgRevenue)} / филиал`}
        />
        <KpiCard
          icon={CreditCard}
          iconColor="text-error"
          bgColor="bg-error/10"
          label="Долг"
          value={money(t.outstandingDebt ?? 0, cur)}
          sub="Суммарная задолженность"
        />
        <KpiCard
          icon={Users}
          iconColor="text-primary"
          bgColor="bg-primary/10"
          label="Ученики"
          value={fmt(t.activeStudents ?? 0)}
          sub={`В ${t.branches ?? 0} филиалах`}
        />
        <KpiCard
          icon={Percent}
          iconColor="text-warning"
          bgColor="bg-warning/10"
          label="Доля долга"
          value={`${debtRatio}%`}
          sub="От общей суммы счетов"
        />
      </div>

      {/* Hero area chart */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Выручка и долг по филиалам
          </h2>
          {areaData.length === 0 ? (
            <p className="text-center py-12 opacity-50 text-sm">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={ERR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ERR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0 0 / 0.5)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip content={<NeonTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="Выручка" stroke={PRIMARY}  fill="url(#gradRev)"  strokeWidth={2} />
                <Area type="monotone" dataKey="Долг"    stroke={ERR}      fill="url(#gradDebt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar + Pie row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart: revenue per branch */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
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
                  <Bar dataKey="revenue" name="Выручка" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie chart: branch revenue distribution */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
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
          </div>
        </div>
      </div>

      {/* Payment methods pie */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4">Способы оплаты</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={PAYMENT_METHODS}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill={PRIMARY} />
                  <Cell fill={TEAL} />
                  <Cell fill={ERR} />
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((pm, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: [PRIMARY, TEAL, ERR][i] }}
                  />
                  <span className="text-sm font-medium">{pm.name}</span>
                  <span className="text-sm font-bold tabular-nums">{pm.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
