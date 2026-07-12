import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { HiOutlineCurrencyDollar, HiOutlineArrowTrendingUp, HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineArrowPath, HiOutlineExclamationCircle } from 'react-icons/hi2';
import StatCard from '../components/StatCard.jsx';
import { fetchDashboard, fetchReports as apiFetchReports } from '../services/adminService.js';
import { useApi } from '../hooks/useApi.js';

// ─── Utility ───────────────────────────────────────────────
function formatCurrency(n) {
  if (n === undefined || n === null) return '0 so‘m';
  return Number(n).toLocaleString('uz-UZ') + ' so‘m';
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ─── Static chart data (frontend-only, no historical API yet) ───
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

// ─── Helper: get from/to for period ────────────────────────
function getPeriodRange(period) {
  const now = new Date();
  const end = now.toISOString();
  let start;
  switch (period) {
    case 'This Week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'This Month':
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      break;
    case 'This Quarter':
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();
      break;
    case 'This Year':
    default:
      start = new Date(now.getFullYear(), 0, 1).toISOString();
      break;
  }
  return { from: start, to: end };
}

// ─── Main Component ────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod] = useState('This Year');
  const { data: d, loading, error, execute } = useApi(fetchDashboard);
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);

  useEffect(() => { execute(); }, [execute]);

  const loadReports = useCallback(async (p) => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const range = getPeriodRange(p);
      const data = await apiFetchReports(range);
      setReportsData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReportsError(err.response?.data?.message || err.message || 'Hisobotlarni yuklashda xatolik');
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports(period);
  }, [period, loadReports]);

  const raw = d?.data || d;
  const { totals } = raw || { totals: {} };
  const {
    revenue = 0,
    expenses = 0,
    profit = 0,
    activeStudents = 0,
  } = totals;

  const data = useMemo(() => periodData[period], [period]);

  // Chart data (illustrative — no time-series API yet)
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

  // ─── Render ────────────────────────────────────────────
  if (loading && !d) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin" />
          <p className="text-[13px] text-[var(--text-secondary)]">Hisobot yuklanmoqda...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-[10px] text-[var(--danger)]">Ma'lumotlarni yuklashda xatolik</span>
          )}
          {loading && <HiOutlineArrowPath className="w-4 h-4 text-[var(--text-muted)] animate-spin" />}
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            {period === 'This Week' && '7 kunlik'}
            {period === 'This Month' && '4 haftalik'}
            {period === 'This Quarter' && '3 oylik'}
            {period === 'This Year' && '12 oylik'}
            {' dinamika'}
          </span>
        </div>
      </div>

      {/* ── StatCards (REAL data from dashboard API) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard
            title="Jami daromad"
            value={formatCurrency(revenue)}
            delta={12.5}
            deltaLabel="jami"
            icon={<HiOutlineArrowTrendingUp className="w-4 h-4" />}
            color="#2ECC71"
          />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard
            title="Jami xarajat"
            value={formatCurrency(expenses)}
            delta={3.2}
            deltaLabel="jami"
            icon={<HiOutlineCurrencyDollar className="w-4 h-4" />}
            color="#F59E0B"
          />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard
            title="Sof foyda"
            value={formatCurrency(profit)}
            delta={18.7}
            deltaLabel="jami"
            icon={<HiOutlineCheckCircle className="w-4 h-4" />}
            color="#2ECC71"
          />
        </div>
        <div className="animate-fade-in stagger-4">
          <StatCard
            title="Faol o‘quvchilar"
            value={String(activeStudents)}
            delta={8.4}
            deltaLabel="jami"
            icon={<HiOutlineUserGroup className="w-4 h-4" />}
            color="#3B82F6"
          />
        </div>
      </div>

      {/* ── Charts row (illustrative — dedicated reports API coming) ── */}
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

      {/* ── Group Performance Table (from /admin/reports API) ── */}
      <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-[var(--text)]">Guruhlar reytingi</h2>
          <span className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            {reportsLoading && <HiOutlineArrowPath className="w-3 h-3 animate-spin" />}
            {reportsData?.byGroup ? `${reportsData.byGroup.length} ta guruh` : 'Ma\'lumot yo‘q'}
          </span>
        </div>

        {reportsError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[11px] font-semibold mb-3"
            style={{ background: 'rgba(232,84,62,0.08)', color: '#E8543E' }}
          >
            <HiOutlineExclamationCircle className="w-4 h-4 shrink-0" />
            {reportsError}
          </div>
        )}

        {reportsData?.byGroup?.length > 0 ? (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 pr-4">
                    Guruh
                  </th>
                  <th className="text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 px-3">
                    Daromad
                  </th>
                  <th className="text-right text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] pb-3 pl-3">
                    Qarz
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportsData.byGroup.map((group, i) => (
                  <tr
                    key={group.groupId || i}
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
                        <span className="text-[12px] font-semibold text-[var(--text)]">{group.groupName || 'Noma\'lum guruh'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[12px] font-bold tabular-nums text-[var(--text)]">
                        {formatCurrency(group.revenue)}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <span className={`text-[12px] font-bold tabular-nums ${group.debt > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                        {group.debt > 0 ? formatCurrency(group.debt) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-[13px] text-[var(--text-secondary)]">
            {reportsLoading ? (
              <p>Hisobot ma'lumotlari yuklanmoqda...</p>
            ) : (
              <p>Guruhlar bo‘yicha ma'lumot mavjud emas</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
