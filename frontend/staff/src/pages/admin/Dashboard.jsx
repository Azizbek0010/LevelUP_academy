import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  UserPlus, FolderPlus, CreditCard, FileText, ArrowUpRight, BarChart3,
  Sparkles, Activity, Zap, Sun, Moon, CloudSun, Sunrise
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useAdminDashboard } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import { Kpi } from '../mentor/_ui.jsx';

/* ═══════════════ Quick Action Card ═══════════════ */
function QuickAction({ to, label, Icon, color, description }) {
  return (
    <Link
      to={to}
      className="card bg-base-100 p-4 flex items-center gap-3.5 group card-hover-premium transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
    >
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `${color}15`, color }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-base-content">{label}</div>
        {description && (
          <div className="text-[11px] text-base-content/45 mt-0.5 truncate">{description}</div>
        )}
      </div>
      <ArrowUpRight size={14} className="text-base-content/45 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

/* ═══════════════ Stat Row ═══════════════ */
function StatRow({ Icon, label, value, danger, accent }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-base-100 border border-base-300 hover:border-primary/30 transition-all duration-200 group">
      <span className="flex items-center gap-2.5 text-[13px] text-base-content/70">
        {Icon && (
          <span className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Icon size={14} />
          </span>
        )}
        {label}
      </span>
      <span className={`text-[14px] font-extrabold tabular-nums ${danger ? 'text-error' : accent ? 'text-primary' : 'text-base-content'}`}>
        {value}
      </span>
    </div>
  );
}

/* ═══════════════ Main Dashboard ═══════════════ */
export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return { text: 'Тунлар хайрли', icon: <Moon size={24} /> };
    if (h < 12) return { text: 'Эрталаб хайрли', icon: <Sun size={24} /> };
    if (h < 17) return { text: 'Кунда хайрли', icon: <CloudSun size={24} /> };
    if (h < 21) return { text: 'Кеча хайрли', icon: <Sunrise size={24} /> };
    return { text: 'Тунлар хайрли', icon: <Moon size={24} /> };
  }, []);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Дашборд" />
        <div className="mt-6">
          <SkeletonKpis />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Дашборд" />
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  const raw = data?.data || data || {};
  const t = raw.totals || {};
  const m = raw.thisMonth || {};

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Дашборд" />

      {/* ═══ Welcome Banner ═══ */}
      <div className="card bg-base-100 p-6 relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-15" style={{ background: 'linear-gradient(135deg, #C6FF34, #22c55e)' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
            {greeting.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
              {greeting.text}, {user?.firstName || 'Администратор'}!
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}. Вот обзор вашего филиала.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl shrink-0" style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Zap size={16} style={{ color: '#16a34a' }} />
            <span className="text-xs font-bold" style={{ color: '#15803d' }}>Всё активно</span>
          </div>
        </div>
      </div>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          Icon={TrendingUp}
          title="Общий доход"
          value={money(t.revenue)}
          tone="success"
        />
        <Kpi
          Icon={TriangleAlert}
          title="Долги"
          value={money(t.outstandingDebt)}
          tone="warning"
        />
        <Kpi
          Icon={Receipt}
          title="Расходы"
          value={money(t.expenses)}
          tone="danger"
        />
        <Kpi
          Icon={Wallet}
          title="Чистая прибыль"
          value={money(t.profit)}
          tone="neutral"
        />
      </div>

      {/* ═══ Branch Stats + Monthly Overview ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Branch Stats */}
        <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-3">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">Показатели филиала</h2>
          </div>
          <div className="space-y-2.5">
            <StatRow Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} accent />
            <StatRow Icon={Users} label="Группы" value={fmt(t.groups)} />
            <StatRow Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} />
          </div>
        </div>

        {/* Monthly Overview */}
        <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-4">
          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">За этот месяц</h2>
          </div>
          <div className="space-y-2.5">
            <StatRow Icon={TrendingUp} label="Доход" value={money(m.revenue)} accent />
            <StatRow Icon={Receipt} label="Расход" value={money(m.expenses)} />
            <StatRow Icon={Sparkles} label="Прибыль" value={money(m.profit)} accent={m.profit > 0} danger={m.profit < 0} />
          </div>
        </div>
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-5">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">Быстрые действия</h2>
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
      <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-6">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-[15px] font-extrabold text-base-content tracking-[-0.02em]">Последняя активность</h2>
        </div>
        <div className="space-y-3">
          {[
            { icon: Activity, text: 'Система работает стабильно', time: 'Только что', color: '#2ECC71' },
            { icon: BarChart3, text: 'Данные обновлены', time: '5 мин назад', color: '#3B82F6' },
            { icon: Sparkles, text: 'Добро пожаловать в панель управления', time: 'Сегодня', color: '#F59E0B' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-[12px] bg-base-100 border border-base-300">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                <item.icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-base-content">{item.text}</p>
              </div>
              <span className="text-[11px] text-base-content/45 shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
