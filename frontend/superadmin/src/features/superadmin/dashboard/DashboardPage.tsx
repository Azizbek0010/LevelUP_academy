import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import clsx from 'clsx';
import {
  ArrowUpRight,
  Building2,
  GraduationCap,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { dashboardApi, type DashboardBranchItem } from '../../../shared/api/endpoints/dashboard';
import { AnimatedNumber } from '../../../shared/ui/AnimatedNumber';
import { Skeleton, SkeletonTable } from '../../../shared/ui/Skeleton';
import { useResolvedTheme } from '../../../shared/hooks/useResolvedTheme';

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return CURRENCY.format(n);
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function collectionRate(revenue: number, debt: number): string {
  const total = revenue + debt;
  if (total === 0) return '—';
  return `${Math.round((revenue / total) * 100)}%`;
}

const BRANCH_PALETTE = [
  'oklch(85% 0.22 130)',
  'oklch(75% 0.16 175)',
  'oklch(70% 0.20 300)',
  'oklch(75% 0.20 55)',
  'oklch(70% 0.22 340)',
  'oklch(70% 0.16 215)',
];

export default function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
  });

  const totals = data?.totals;
  const branches = data?.branches ?? [];
  const activeBranches = branches.filter((b) => !b.isArchived);

  // Build simple bar chart data from current branch revenues
  const chartData = useMemo(() => {
    if (activeBranches.length === 0) return [];
    return activeBranches.map((b) => ({ name: b.name, revenue: b.revenue, debt: b.debt }));
  }, [activeBranches]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card bg-base-100 border border-base-300 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-9 w-32" />
              <div className="flex items-end justify-between">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="card bg-base-100 border border-base-300 overflow-hidden">
          <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <SkeletonTable rows={4} cols={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div role="alert" className="alert alert-error">
          <span>Ошибка загрузки дашборда. Проверьте подключение к серверу.</span>
        </div>
        <button
          type="button"
          className="btn btn-sm mt-3"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Дашборд организации</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Обзор всей сети · {activeBranches.length} активных филиалов
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-primary/15 border border-primary/30 text-[11px] font-semibold">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          LIVE
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <BigKpi
          label="Выручка"
          value={totals?.revenue ?? 0}
          format={(v) => `${formatCurrency(v)} ${totals?.currency ?? 'UZS'}`}
          icon={Wallet}
          delay={0}
          color="oklch(85% 0.22 130)"
          trendPositive
        />
        <BigKpi
          label="Долги"
          value={totals?.outstandingDebt ?? 0}
          format={(v) => `${formatCurrency(v)} ${totals?.currency ?? 'UZS'}`}
          icon={TrendingUp}
          delay={100}
          color="oklch(68% 0.22 25)"
        />
        <BigKpi
          label="Студентов"
          value={totals?.activeStudents ?? 0}
          format={(v) => String(Math.round(v))}
          icon={GraduationCap}
          delay={200}
          color="oklch(78% 0.18 145)"
          trendPositive
        />
        <BigKpi
          label="Администраторов"
          value={totals?.admins ?? 0}
          format={(v) => String(Math.round(v))}
          icon={Users}
          delay={300}
          color="oklch(70% 0.20 300)"
        />
      </div>

      {/* Revenue by Branch Chart */}
      {activeBranches.length > 0 && (
        <RevenueByBranchCard data={chartData} branches={activeBranches} />
      )}

      {/* Branches Table */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="card-body pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Филиалы</h2>
            </div>
            <Link to="/superadmin/branches" className="btn btn-ghost btn-sm gap-1">
              Все филиалы <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm dense-table">
            <thead className="bg-base-200/60">
              <tr>
                <th>Филиал</th>
                <th className="text-center">Тип</th>
                <th className="text-right">Студенты</th>
                <th className="text-right">Админы</th>
                <th className="text-right">Выручка</th>
                <th className="text-right">Долги</th>
              </tr>
            </thead>
            <tbody>
              {activeBranches.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-base-200/40 cursor-pointer"
                  onClick={() => navigate(`/superadmin/branches/${b.id}`)}
                >
                  <td className="font-medium hover:text-primary">{b.name}</td>
                  <td className="text-center">
                    {b.isMain ? (
                      <span className="badge badge-primary badge-sm">Главный</span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">Филиал</span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">{b.students}</td>
                  <td className="text-right tabular-nums">{b.admins}</td>
                  <td className="text-right tabular-nums font-medium">
                    {CURRENCY.format(b.revenue)}
                  </td>
                  <td className={clsx('text-right tabular-nums', b.debt > 0 && 'text-error/80')}>
                    {b.debt > 0 ? CURRENCY.format(b.debt) : '—'}
                  </td>
                </tr>
              ))}
              {activeBranches.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-base-content/40 py-8">
                    Нет активных филиалов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/superadmin/branches" icon={Building2} label="Управление филиалами" />
        <QuickLink to="/superadmin/users" icon={Users} label="Сотрудники" />
        <QuickLink to="/superadmin/stats" icon={TrendingUp} label="Отчёты" />
        <QuickLink to="/superadmin/settings" icon={Settings} label="Настройки" />
      </div>

      {/* Bottom Stats Bar */}
      <div className="panel-dark rounded-2xl mt-6 relative">
        <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <BottomStat label="Филиалов" value={String(totals?.branches ?? 0)} />
          <BottomStat label="Студентов" value={formatCompact(totals?.activeStudents ?? 0)} />
          <BottomStat label="Выручка" value={`${formatCurrency(totals?.revenue ?? 0)} сум`} />
          <BottomStat
            label="Собрано"
            value={collectionRate(totals?.revenue ?? 0, totals?.outstandingDebt ?? 0)}
            check
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/superadmin/branches')}
          className="absolute -bottom-4 right-6 size-12 rounded-full bg-primary text-primary-content grid place-items-center shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
          title="Перейти к филиалам"
        >
          <span className="text-2xl leading-none pb-0.5">+</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BottomStat({ label, value, check = false }: { label: string; value: string; check?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">{label}</div>
      <div className="text-2xl font-bold tabular-nums tracking-tight mt-0.5 flex items-center gap-2">
        {value}
        {check && (
          <span className="size-4 rounded-full bg-primary text-primary-content grid place-items-center text-[10px] font-black">✓</span>
        )}
      </div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="card bg-base-100 border border-base-300 hover:border-primary transition-colors card-lift">
      <div className="card-body py-3 flex-row items-center gap-3">
        <Icon className="size-5 text-primary shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}

function BigKpi({
  label, value, format, icon: Icon, delay, color, pulse = false, trendPositive = false,
}: {
  label: string; value: number; format: (v: number) => string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  delay: number; color: string; pulse?: boolean; trendPositive?: boolean;
}) {
  const spark = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const wave = 0.5 + 0.35 * Math.sin(t * 3 + delay * 0.01);
      const trend = trendPositive ? t * 0.35 : -t * 0.15;
      pts.push({ x: i, y: Math.max(0.05, Math.min(1, wave + trend)) });
    }
    return pts;
  }, [delay, trendPositive]);

  const w = 100; const h = 30;
  const path = useMemo(() => {
    const pts = spark.map((p) => ({ x: (p.x / 11) * w, y: h - p.y * h }));
    let d = `M ${pts[0]!.x},${pts[0]!.y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]!; const curr = pts[i]!;
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX},${prev.y} ${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }, [spark]);
  const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
  const gradId = `spark-grad-${delay}`;

  return (
    <div className="card bg-base-100 border border-base-300 relative overflow-hidden wow-lift chart-rise rounded-2xl" style={{ animationDelay: `${delay}ms` }}>
      <div className="absolute -top-6 -right-6 size-24 rounded-full opacity-[0.08]" style={{ background: color, filter: 'blur(20px)' }} />
      <div className="card-body py-4 px-5 relative">
        <div className="flex items-center justify-between text-[10px] font-semibold text-base-content/50">
          <span className="uppercase tracking-[0.12em]">{label}</span>
          <div className="size-8 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
            <Icon className={`size-4 ${pulse ? 'animate-pulse' : ''}`} style={{ color }} />
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums tracking-tight mt-1">
          <AnimatedNumber value={value} format={format} />
        </div>
        <div className="flex items-end justify-between gap-2 mt-1">
          <span className={clsx('inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold', trendPositive ? 'bg-success/15 text-success' : 'bg-base-200 text-base-content/40')}>
            {trendPositive ? '↑ Рост' : '· Данные'}
          </span>
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-24 h-8 shrink-0">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function RevenueByBranchCard({ data, branches }: { data: Array<{ name: string; revenue: number; debt: number }>; branches: DashboardBranchItem[] }) {
  const theme = useResolvedTheme();
  const isDark = theme === 'dark';

  return (
    <div className="card border shadow-xl overflow-hidden chart-rise chart-rise-delay-4" style={{ borderColor: 'var(--color-base-300)' }}>
      <div className="card-body">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-base-content/50 font-semibold">Выручка по филиалам</div>
            <div className="text-lg font-semibold mt-0.5">Выручка и долги по филиалам</div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-primary" /><span className="text-[11px] font-medium">Выручка</span></div>
            <div className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-error/60" /><span className="text-[11px] font-medium">Долги</span></div>
          </div>
        </div>
        <div className="h-64 mt-5 chart-sweep">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRANCH_PALETTE[0]} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={BRANCH_PALETTE[0]} stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="grad-debt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(68% 0.22 25)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(68% 0.22 25)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={isDark ? 'rgba(255,255,255,0.05)' : 'oklch(90% 0 0 / 0.35)'} strokeDasharray="2 8" vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={6} stroke={isDark ? 'rgba(255,255,255,0.4)' : 'oklch(60% 0 0)'} />
              <YAxis tickFormatter={(v: number) => formatCurrency(v)} fontSize={11} tickLine={false} axisLine={false} width={55} stroke={isDark ? 'rgba(255,255,255,0.4)' : 'oklch(60% 0 0)'} />
              <Tooltip
                contentStyle={{ background: isDark ? 'rgba(20,16,12,0.96)' : 'white', border: `1px solid ${isDark ? 'rgba(180,220,120,0.25)' : 'oklch(90% 0.02 130)'}`, borderRadius: '8px', fontSize: 12 }}
                formatter={(value: number, name: string) => [CURRENCY.format(value) + ' UZS', name === 'revenue' ? 'Выручка' : 'Долги']}
              />
              <Area type="monotone" dataKey="revenue" stroke={BRANCH_PALETTE[0]} strokeWidth={2} fill="url(#grad-revenue)" />
              <Area type="monotone" dataKey="debt" stroke="oklch(68% 0.22 25)" strokeWidth={1.5} fill="url(#grad-debt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
