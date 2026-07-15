import { useState, useMemo } from 'react';
import {
  BarChart3, PieChart as PieIcon, TrendingUp, Users, AlertTriangle, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { money, fmt } from '../../format.js';
import { useAdminReports } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const COLORS = ['#2ECC71', '#E8543E', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899'];

/* ═══════════════ KPI Card ═══════════════ */
function KpiCard({ Icon, title, value, color, gradient, delay }) {
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[20px] p-5 card-hover-premium group relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          style={{ background: gradient }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em]">{title}</span>
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${color}15`, color }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
          </div>
          <div className="text-[26px] font-extrabold text-[var(--text)] tabular-nums leading-none tracking-[-0.03em]">{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Custom Tooltip ═══════════════ */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-[12px] p-3 shadow-lg border border-[var(--border)]">
      <p className="text-[12px] font-bold text-[var(--text)] mb-1">{label}</p>
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
  const { data, isLoading, error } = useAdminReports();

  const raw = data?.data || data || {};
  const byGroup = raw.byGroup || raw.groups || [];

  const totalRevenue = byGroup.reduce((s, g) => s + Number(g.revenue || 0), 0);
  const totalDebt = byGroup.reduce((s, g) => s + Number(g.debt || g.outstandingDebt || 0), 0);
  const totalStudents = byGroup.reduce((s, g) => s + Number(g.students ?? g.studentsCount ?? 0), 0);
  const avgRevenue = byGroup.length > 0 ? totalRevenue / byGroup.length : 0;

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

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Отчёты" subtitle="Выручка и долги по группам" />
        <div className="mt-6"><SkeletonTable cols={4} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Отчёты" subtitle="Выручка и долги по группам" />
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Отчёты" subtitle="Выручка и долги по группам" />

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard Icon={TrendingUp} title="Общая выручка" value={money(totalRevenue)} color="#2ECC71" gradient="linear-gradient(135deg,#2ECC71,#27AE60)" delay="stagger-1" />
        <KpiCard Icon={AlertTriangle} title="Общий долг" value={money(totalDebt)} color="#E8543E" gradient="linear-gradient(135deg,#E8543E,#C0392B)" delay="stagger-2" />
        <KpiCard Icon={Users} title="Студентов" value={fmt(totalStudents)} color="#3B82F6" gradient="linear-gradient(135deg,#3B82F6,#2980B9)" delay="stagger-3" />
        <KpiCard Icon={BarChart3} title="Средняя выручка" value={money(avgRevenue)} color="#8B5CF6" gradient="linear-gradient(135deg,#8B5CF6,#6C3483)" delay="stagger-4" />
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar Chart — Revenue by Group */}
        <div className="lg:col-span-2 glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-3">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-6 rounded-full bg-[var(--green)]" />
            <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Выручка по группам</h2>
          </div>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[13px] text-[var(--text-muted)]">
              <Activity size={16} className="mr-2 opacity-40" /> Нет данных для графика
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Выручка" fill="#2ECC71" radius={[6, 6, 0, 0]} />
                <Bar dataKey="debt" name="Долг" fill="#E8543E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — Revenue Share */}
        <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-6 rounded-full bg-[#8B5CF6]" />
            <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Доля выручки</h2>
          </div>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[13px] text-[var(--text-muted)]">
              <PieIcon size={16} className="mr-2 opacity-40" /> Нет данных
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
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ═══ Table ═══ */}
      <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 rounded-full bg-[#3B82F6]" />
          <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Детали по группам</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-transparent">Группа</th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-transparent text-right">Студентов</th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-transparent text-right">Выручка</th>
                <th className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-transparent text-right">Долг</th>
              </tr>
            </thead>
            <tbody>
              {byGroup.length === 0 && (
                <tr><td colSpan={4} className="text-center text-[var(--text-muted)] py-8 text-[13px]">Нет данных</td></tr>
              )}
              {byGroup.map((g, i) => {
                const debt = Number(g.debt || g.outstandingDebt || 0);
                return (
                  <tr key={g.id || g.groupId || i} className="border-b border-[var(--border)]/50 hover:bg-[var(--green-bg)]/30 transition-colors">
                    <td className="font-medium text-[13px]">{g.name || g.groupName || '—'}</td>
                    <td className="text-right tabular-nums text-[13px]">{fmt(g.students ?? g.studentsCount ?? 0)}</td>
                    <td className="text-right tabular-nums text-[13px] font-semibold text-[var(--green)]">{money(g.revenue)}</td>
                    <td className="text-right tabular-nums text-[13px] font-semibold" style={{ color: debt > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{money(debt)}</td>
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
