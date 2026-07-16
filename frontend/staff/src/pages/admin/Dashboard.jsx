import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  UserPlus, FolderPlus, CreditCard, FileText, ArrowUpRight, ArrowDownRight,
  BarChart3, Sparkles, Activity,
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fmt, money } from '../../format.js';
import { useAdminDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/* ═══════════════ Premium KPI Card ═══════════════ */
function KpiCard({ Icon, title, value, trend, trendLabel, color, gradient, delay }) {
  const isPositive = trend >= 0;
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[20px] p-5 card-hover-premium group relative overflow-hidden">
        {/* Gradient accent */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          style={{ background: gradient }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em]">
              {title}
            </span>
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${color}15`, color }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
          </div>
          <div className="text-[26px] font-extrabold text-[var(--text)] tabular-nums leading-none tracking-[-0.03em]">
            {value}
          </div>
          {trend != null && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isPositive ? 'text-[#2ECC71]' : 'text-[#E8543E]'}`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {isPositive ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}%
              </span>
              {trendLabel && (
                <span className="text-[10px] text-[var(--text-muted)]">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Quick Action Card ═══════════════ */
function QuickAction({ to, label, Icon, color, description }) {
  return (
    <Link
      to={to}
      className="glass-strong rounded-[16px] p-4 flex items-center gap-3.5 group card-hover-premium transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
    >
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `${color}15`, color }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-[var(--text)]">{label}</div>
        {description && (
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{description}</div>
        )}
      </div>
      <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--green)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

/* ═══════════════ Stat Row ═══════════════ */
function StatRow({ Icon, label, value, danger, accent }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--green)]/30 transition-all duration-200 group">
      <span className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
        {Icon && (
          <span className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)] group-hover:scale-110 transition-transform">
            <Icon size={14} />
          </span>
        )}
        {label}
      </span>
      <span className={`text-[14px] font-extrabold tabular-nums ${danger ? 'text-[var(--danger)]' : accent ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
        {value}
      </span>
    </div>
  );
}

/* ═══════════════ Revenue Chart ═══════════════ */
function RevenueChart({ totals, thisMonth }) {
  const chartData = {
    labels: ['Доход', 'Расход', 'Прибыль'],
    datasets: [
      {
        label: 'Всего',
        data: [totals.revenue || 0, totals.expenses || 0, totals.profit || 0],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: '#22c55e',
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
      },
      {
        label: 'Этот месяц',
        data: [thisMonth.revenue || 0, thisMonth.expenses || 0, thisMonth.profit || 0],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12, weight: '600' },
          color: '#6b7a62',
        },
      },
      tooltip: {
        backgroundColor: '#1a1f16',
        titleColor: '#e8efe2',
        bodyColor: '#94a388',
        borderColor: '#2d3628',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7a62', font: { size: 12, weight: '600' } },
      },
      y: {
        grid: { color: 'rgba(220, 229, 212, 0.3)' },
        ticks: {
          color: '#6b7a62',
          font: { size: 11 },
          callback: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
        },
      },
    },
  };

  return (
    <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-3">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1 h-6 rounded-full bg-[#3B82F6]" />
        <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Финансы</h2>
      </div>
      <div className="h-[260px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

/* ═══════════════ Main Dashboard ═══════════════ */
export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />
        <div className="mt-6">
          <SkeletonKpis />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  const raw = data?.data || data || {};
  const t = raw.totals || {};
  const m = raw.thisMonth || {};

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Дашборд" subtitle="Филиал: доход, расход, студенты, группы" />

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          Icon={TrendingUp}
          title="Общий доход"
          value={money(t.revenue)}
          color="#2ECC71"
          gradient="linear-gradient(135deg, #2ECC71, #27AE60)"
          delay="stagger-1"
        />
        <KpiCard
          Icon={TriangleAlert}
          title="Долги"
          value={money(t.outstandingDebt)}
          color="#F59E0B"
          gradient="linear-gradient(135deg, #F59E0B, #E67E22)"
          delay="stagger-2"
        />
        <KpiCard
          Icon={Receipt}
          title="Расходы"
          value={money(t.expenses)}
          color="#E8543E"
          gradient="linear-gradient(135deg, #E8543E, #C0392B)"
          delay="stagger-3"
        />
        <KpiCard
          Icon={Wallet}
          title="Чистая прибыль"
          value={money(t.profit)}
          color="#3B82F6"
          gradient="linear-gradient(135deg, #3B82F6, #2980B9)"
          delay="stagger-4"
        />
      </div>

      {/* ═══ Revenue Chart ═══ */}
      <RevenueChart totals={t} thisMonth={m} />

      {/* ═══ Branch Stats + Monthly Overview ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Branch Stats */}
        <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-3">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-6 rounded-full bg-[var(--green)]" />
            <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Показатели филиала</h2>
          </div>
          <div className="space-y-2.5">
            <StatRow Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} accent />
            <StatRow Icon={Users} label="Группы" value={fmt(t.groups)} />
            <StatRow Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} />
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1 h-6 rounded-full bg-[#3B82F6]" />
            <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">За этот месяц</h2>
          </div>
          <div className="space-y-2.5">
            <StatRow Icon={TrendingUp} label="Доход" value={money(m.revenue)} accent />
            <StatRow Icon={Receipt} label="Расход" value={money(m.expenses)} />
            <StatRow Icon={Sparkles} label="Прибыль" value={money(m.profit)} accent={m.profit > 0} danger={m.profit < 0} />
          </div>
        </div>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 rounded-full bg-[#F59E0B]" />
          <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Быстрые действия</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction to="/students" label="Студенты" Icon={UserPlus} color="#2ECC71" description="Добавить или найти студента" />
          <QuickAction to="/groups" label="Группы" Icon={FolderPlus} color="#3B82F6" description="Управление учебными группами" />
          <QuickAction to="/payments" label="Платежи" Icon={CreditCard} color="#F59E0B" description="Счета и оплаты" />
          <QuickAction to="/expenses" label="Расходы" Icon={Receipt} color="#E8543E" description="Учёт расходов" />
          <QuickAction to="/reports" label="Отчёты" Icon={FileText} color="#8B5CF6" description="Аналитика и статистика" />
          <QuickAction to="/mentors" label="Менторы" Icon={Users} color="#06B6D4" description="Преподаватели филиала" />
        </div>
      </div>

      {/* ═══ Activity Feed ═══ */}
      <div className="glass-strong rounded-[20px] p-5 card-hover-premium animate-fade-in stagger-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 rounded-full bg-[#8B5CF6]" />
          <h2 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Последняя активность</h2>
        </div>
        <div className="space-y-3">
          {[
            { icon: Activity, text: 'Система работает стабильно', time: 'Только что', color: '#2ECC71' },
            { icon: BarChart3, text: 'Данные обновлены', time: '5 мин назад', color: '#3B82F6' },
            { icon: Sparkles, text: 'Добро пожаловать в панель управления', time: 'Сегодня', color: '#F59E0B' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                <item.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text)]">{item.text}</p>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
