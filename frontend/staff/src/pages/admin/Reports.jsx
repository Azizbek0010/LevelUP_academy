import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Users, AlertTriangle, Activity, Filter, Search,
  Download, X, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { money, fmt } from '../../format.js';
import { useAdminReports } from '../../queries.js';
import { Kpi, RowSkeleton } from '../mentor/_ui.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';

/* Design-system palette (index.css :root) — coherent shades instead of random hues */
const COLORS = ['#40833B', '#dc2626', '#b45309', '#2563eb', '#15803d', '#5c6b53', '#7d8c73'];

/* ═══════════════ KPI Card ═══════════════ */
/* ═══════════════ Custom Tooltip ═══════════════ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card bg-base-100 p-3 shadow-lg border border-base-300">
      <p className="text-[12px] font-bold text-base-content mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px]" style={{ color: p.color }}>
          {p.name}: {money(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════ Main Reports ═══════════════ */
export default function AdminReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [showExport, setShowExport] = useState(false);

  // Build query string for backend period filter
  const qs = useMemo(() => {
    if (!from && !to) return '';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return `?${params.toString()}`;
  }, [from, to]);

  const { data, isLoading, error, refetch } = useAdminReports(qs);

  const raw = data?.data || data || {};
  const byGroupAll = raw.byGroup || raw.groups || [];

  // Search filter
  const byGroup = useMemo(() => {
    if (!search) return byGroupAll;
    const q = search.toLowerCase();
    return byGroupAll.filter((g) => {
      const name = (g.name || g.groupName || '').toLowerCase();
      return name.includes(q);
    });
  }, [byGroupAll, search]);

  const totalRevenue = byGroup.reduce((s, g) => s + Number(g.revenue || 0), 0);
  const totalDebt = byGroup.reduce((s, g) => s + Number(g.debt || g.outstandingDebt || 0), 0);
  const totalStudents = byGroup.reduce((s, g) => s + Number(g.students ?? g.studentsCount ?? 0), 0);
  const avgRevenue = byGroup.length > 0 ? totalRevenue / byGroup.length : 0;
  const groupsWithDebt = byGroup.filter((g) => Number(g.debt || g.outstandingDebt || 0) > 0).length;

  const barData = useMemo(() =>
    byGroup.map((g) => ({
      name: (g.name || g.groupName || '—').slice(0, 12),
      revenue: Number(g.revenue || 0),
      debt: Number(g.debt || g.outstandingDebt || 0),
    })),
    [byGroup]
  );

  const pieData = useMemo(() => {
    if (byGroup.length === 0) return [];
    return byGroup.map((g) => ({
      name: g.name || g.groupName || '—',
      value: Number(g.revenue || 0),
    })).filter((d) => d.value > 0);
  }, [byGroup]);

  const hasActiveFilters = from || to || search;

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setSearch('');
  };

  /* ═══ Loading ═══ */
  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 animate-page-enter">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[28px] font-extrabold text-base-content tracking-[-0.035em] leading-none">Отчёты</h1>
          </div>
          <p className="text-[13px] text-base-content/70">Загрузка...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card bg-base-100 p-5">
              <div className="skeleton h-3 w-20 rounded-[6px] mb-4" />
              <div className="skeleton h-8 w-32 rounded-[6px]" />
            </div>
          ))}
        </div>
        <RowSkeleton count={3} />
      </div>
    );
  }

  /* ═══ Error ═══ */
  if (error) {
    return (
      <div className="space-y-6 pb-8 animate-page-enter">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[28px] font-extrabold text-base-content tracking-[-0.035em] leading-none">Отчёты</h1>
          </div>
        </div>
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-[16px] text-[13px] font-semibold animate-slide-up"
          style={{ background: 'rgba(232,84,62,0.10)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.18)' }}
        >
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(232,84,62,0.12)' }}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="flex-1">Ошибка загрузки: {error.message || error}</span>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 h-7 rounded-[8px] text-[11px] font-semibold hover:bg-[rgba(232,84,62,0.12)] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-page-enter">

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[28px] font-extrabold text-base-content tracking-[-0.035em] leading-none">Отчёты</h1>
          </div>
          <p className="text-[13px] text-base-content/70">
            Анализ доходов и долгов по группам
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            className="btn btn-ghost btn-sm gap-1.5"
            onClick={() => setShowExport(true)}
            disabled={byGroup.length === 0}
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
        </div>
      </div>

      {/* ═══ Filter Panel ═══ */}
      <div className="card bg-base-100 p-4 card-hover-premium">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/45 pointer-events-none" />
            <input
              placeholder="Поиск по названию группы..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-10 rounded-[12px] border border-base-300 bg-base-100 text-[13px] text-base-content outline-none placeholder:text-base-content/45 hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/45 hover:text-base-content transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date filters */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-base-content/45 shrink-0 hidden sm:block">
              <Filter size={14} className="inline mr-1" />
              Период:
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="appearance-none w-[140px] h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:light] cursor-pointer"
            />
            <span className="text-[11px] text-base-content/45">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="appearance-none w-[140px] h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:light] cursor-pointer"
            />
          </div>

          {/* Clear */}
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] text-[12px] font-semibold transition-all shrink-0 ${
              hasActiveFilters
                ? 'text-base-content/45 hover:text-base-content hover:bg-base-200'
                : 'text-transparent pointer-events-none'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Сбросить
          </button>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          Icon={TrendingUp}
          title="Общий доход"
          value={money(totalRevenue)}
          tone="success"
        />
        <Kpi
          Icon={AlertTriangle}
          title="Общий долг"
          value={money(totalDebt)}
          unit={groupsWithDebt > 0 ? `${groupsWithDebt} группа(-ы)` : ''}
          tone="danger"
        />
        <Kpi
          Icon={Users}
          title="Ученики"
          value={fmt(totalStudents)}
          unit={`${byGroup.length} группа(-ы)`}
          tone="neutral"
        />
        <Kpi
          Icon={BarChart3}
          title="Средний доход"
          value={money(avgRevenue)}
          tone="neutral"
        />
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Chart */}
        <div className="lg:col-span-2 card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-3">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">Доход по группам</h2>
          </div>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[13px] text-base-content/45">
              <Activity size={16} className="mr-2 opacity-40" /> Данные отсутствуют
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Доход" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="debt" name="Долг" fill="var(--danger)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-4">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">Доля дохода</h2>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[13px] text-base-content/45">
              <Activity size={16} className="mr-2 opacity-40" /> Данные отсутствуют
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        pageKey="reports"
        data={byGroup}
      />
    </div>
  );
}
