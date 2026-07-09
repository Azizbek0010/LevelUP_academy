import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { HiOutlineBanknotes, HiOutlineArrowTrendingUp, HiOutlineUserGroup, HiOutlineCheckCircle } from 'react-icons/hi2';
import StatCard from '../components/StatCard.jsx';

// ─── Utility ───────────────────────────────────────────────
function formatCurrency(n) {
  if (n === undefined || n === null) return '0 so‘m';
  return Number(n).toLocaleString('uz-UZ') + ' so‘m';
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ─── Dummy data ────────────────────────────────────────────
const MONTHS = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
  'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek',
];

const periodData = {
  'This Week': {
    revenue: [4200000, 5600000, 3800000, 7100000, 4900000, 6200000, 3500000],
    expenses: [1800000, 2100000, 1600000, 2500000, 1900000, 2200000, 1400000],
    enrolled: [12, 18, 8, 22, 15, 20, 10],
    dropped: [2, 3, 1, 4, 2, 3, 1],
    labels: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
  },
  'This Month': {
    revenue: [18500000, 16200000, 21400000, 17800000],
    expenses: [7200000, 6900000, 8400000, 7600000],
    enrolled: [45, 38, 52, 41],
    dropped: [6, 4, 8, 5],
    labels: ['1-hafta', '2-hafta', '3-hafta', '4-hafta'],
  },
  'This Quarter': {
    revenue: [48500000, 52300000, 61200000],
    expenses: [18500000, 20300000, 22400000],
    enrolled: [128, 145, 162],
    dropped: [15, 18, 12],
    labels: ['Yan-Mar', 'Apr-Iyun', 'Iyul-Sen'],
  },
  'This Year': {
    revenue: [48500000, 52300000, 61200000, 47800000, 55600000, 63100000, 59400000, 64800000, 70200000, 67500000, 73400000, 78900000],
    expenses: [18500000, 20300000, 22400000, 19200000, 21500000, 23800000, 22600000, 24100000, 25800000, 24900000, 26500000, 28200000],
    enrolled: [128, 145, 162, 134, 151, 173, 158, 176, 192, 180, 198, 215],
    dropped: [15, 18, 12, 14, 16, 10, 13, 11, 9, 12, 8, 7],
    labels: MONTHS,
  },
};

const groupPerformance = [
  { name: 'Web Dasturlash N1', students: 18, avgGrade: 88, revenue: 28500000, progress: 85 },
  { name: 'Mobile Development', students: 15, avgGrade: 92, revenue: 24000000, progress: 92 },
  { name: 'Data Science Pro', students: 12, avgGrade: 78, revenue: 21000000, progress: 70 },
  { name: 'Frontend React', students: 20, avgGrade: 85, revenue: 32000000, progress: 82 },
  { name: 'Backend Node.js', students: 14, avgGrade: 90, revenue: 22500000, progress: 90 },
  { name: 'UI/UX Design', students: 10, avgGrade: 76, revenue: 16500000, progress: 65 },
  { name: 'DevOps Engineering', students: 8, avgGrade: 94, revenue: 14200000, progress: 78 },
  { name: 'Python Backend', students: 16, avgGrade: 82, revenue: 25500000, progress: 75 },
];

// ─── Custom Tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-[12px] px-3 py-2 text-[11px] shadow-[0_8px_24px_var(--shadow-lg)]">
      <p className="font-bold text-[var(--text)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Period filter ─────────────────────────────────────────
const PERIODS = ['This Week', 'This Month', 'This Quarter', 'This Year'];

// ─── Main Component ────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod] = useState('This Year');

  const data = useMemo(() => periodData[period], [period]);

  // Chart data
  const chartData = useMemo(() =>
    data.labels.map((label, i) => ({
      name: label,
      daromad: data.revenue[i],
      xarajat: data.expenses[i],
      qabul: data.enrolled[i],
      chiqish: data.dropped[i],
    })),
    [data],
  );

  // Summary stats
  const stats = useMemo(() => {
    const totalRevenue = data.revenue.reduce((a, b) => a + b, 0);
    const totalExpenses = data.expenses.reduce((a, b) => a + b, 0);
    const totalEnrolled = data.enrolled.reduce((a, b) => a + b, 0);
    const totalDropped = data.dropped.reduce((a, b) => a + b, 0);
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      activeStudents: totalEnrolled - totalDropped,
    };
  }, [data]);

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="space-y-5 page-enter">
      {/* Header + Period filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: period === p ? 'var(--green)' : 'var(--surface)',
                color: period === p ? '#141B10' : 'var(--text-secondary)',
                border: `1px solid ${period === p ? 'var(--green)' : 'var(--border)'}`,
              }}
            >
              {p === 'This Week' && 'Bu hafta'}
              {p === 'This Month' && 'Bu oy'}
              {p === 'This Quarter' && 'Bu chorak'}
              {p === 'This Year' && 'Bu yil'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[var(--text-muted)] font-medium">
          {period === 'This Week' && '7 kunlik'}
          {period === 'This Month' && '4 haftalik'}
          {period === 'This Quarter' && '3 oylik'}
          {period === 'This Year' && '12 oylik'}
          {' dinamika'}
        </span>
      </div>

      {/* ── StatCards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard
            title="Jami daromad"
            value={formatCurrency(stats.totalRevenue)}
            delta={12.5}
            deltaLabel={period === 'This Week' ? 'haftalik' : period === 'This Year' ? 'yillik' : 'davr'}
            icon={<HiOutlineArrowTrendingUp className="w-4 h-4" />}
            color="#2ECC71"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard
            title="Jami xarajat"
            value={formatCurrency(stats.totalExpenses)}
            delta={3.2}
            deltaLabel={period === 'This Week' ? 'haftalik' : period === 'This Year' ? 'yillik' : 'davr'}
            icon={<HiOutlineBanknotes className="w-4 h-4" />}
            color="#F59E0B"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard
            title="Sof foyda"
            value={formatCurrency(stats.netProfit)}
            delta={18.7}
            deltaLabel={period === 'This Week' ? 'haftalik' : period === 'This Year' ? 'yillik' : 'davr'}
            icon={<HiOutlineCheckCircle className="w-4 h-4" />}
            color="#2ECC71"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatCard
            title="Faol o‘quvchilar"
            value={String(stats.activeStudents)}
            delta={8.4}
            deltaLabel="yangi qabul"
            icon={<HiOutlineUserGroup className="w-4 h-4" />}
            color="#3B82F6"
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue vs Expenses BarChart */}
        <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[var(--text)]">Daromad vs Xarajat</h2>
            <span className="flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#2ECC71' }} />
                Daromad
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#E8543E' }} />
                Xarajat
              </span>
            </span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Bar
                  dataKey="daromad"
                  name="Daromad"
                  fill="#2ECC71"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="xarajat"
                  name="Xarajat"
                  fill="#E8543E"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Growth AreaChart */}
        <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-bold text-[var(--text)]">O‘quvchilar dinamikasi</h2>
            <span className="flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#C6FF34' }} />
                Qabul
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#E8543E' }} />
                Chiqish
              </span>
            </span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="enrolledGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C6FF34" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C6FF34" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="droppedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8543E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E8543E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="qabul"
                  name="Qabul"
                  stroke="#C6FF34"
                  strokeWidth={2.5}
                  fill="url(#enrolledGrad)"
                  dot={{ r: 3, fill: '#C6FF34', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#C6FF34', strokeWidth: 2, stroke: 'var(--surface)' }}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="chiqish"
                  name="Chiqish"
                  stroke="#E8543E"
                  strokeWidth={2.5}
                  fill="url(#droppedGrad)"
                  dot={{ r: 3, fill: '#E8543E', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#E8543E', strokeWidth: 2, stroke: 'var(--surface)' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Group Performance Table ── */}
      <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-[var(--text)]">Guruhlar reytingi</h2>
          <span className="text-[10px] text-[var(--text-muted)]">
            {groupPerformance.length} ta guruh
          </span>
        </div>

        {/* Table wrapper with horizontal scroll for small screens */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 pr-4">
                  Guruh
                </th>
                <th className="text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 px-3">
                  O‘quvchilar
                </th>
                <th className="text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 px-3">
                  O‘rt. baho
                </th>
                <th className="text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 px-3">
                  Daromad
                </th>
                <th className="text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 pl-3">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {groupPerformance.map((group, i) => {
                const gradeColor =
                  group.avgGrade >= 90 ? '#2ECC71' :
                  group.avgGrade >= 80 ? '#F59E0B' :
                  '#E8543E';

                const progressColor =
                  group.progress >= 80 ? '#2ECC71' :
                  group.progress >= 60 ? '#F59E0B' :
                  '#E8543E';

                return (
                  <tr
                    key={group.name}
                    className={cn(
                      'border-b border-[var(--border)] transition-all duration-200',
                      'hover:bg-[var(--surface-hover)]',
                    )}
                    style={i % 2 === 1 ? { background: 'rgba(198,255,52,0.04)' } : {}}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-[8px] flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: i < 3 ? '#C6FF34' : 'var(--green-bg)',
                            color: i < 3 ? '#141B10' : 'var(--text-secondary)',
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--text)]">{group.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[12px] font-bold tabular-nums text-[var(--text)]">{group.students}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: gradeColor }}>
                        {group.avgGrade}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[12px] font-bold tabular-nums text-[var(--text)]">
                        {formatCurrency(group.revenue)}
                      </span>
                    </td>
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${group.progress}%`,
                              background: progressColor,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: progressColor }}>
                          {group.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
