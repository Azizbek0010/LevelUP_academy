// @ts-nocheck
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, BarChart2, Building2, Calendar, Check, Minus, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { branchesApi } from '../../../shared/api/endpoints/branches';
import { ComparisonTab } from './ComparisonTab';
import {
  computeSummary,
  getSeries,
  PAYMENT_METHODS_DIST,
  TIME_SERIES_90D,
  TOP_GROUPS,
  type TimePoint,
} from '../../../dev/mockStats';
import { AnimatedNumber } from '../../../shared/ui/AnimatedNumber';
import { useResolvedTheme } from '../../../shared/hooks/useResolvedTheme';
import { PaymentDayModal } from './PaymentDayModal';

type RangePreset = '7d' | '30d' | '90d' | 'custom';

// Бренд-палитра (было розово-неоновое, стало lime + teal + amber)
const NEON_PINK = 'oklch(85% 0.22 130)';    // lime primary
const NEON_MAGENTA = 'oklch(78% 0.20 145)'; // lime deeper
const NEON_VIOLET = 'oklch(75% 0.16 175)';  // teal
const NEON_BLUE = 'oklch(70% 0.16 215)';    // cool blue
const NEON_YELLOW = 'oklch(85% 0.22 130)';  // lime dot

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return CURRENCY.format(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('ru-RU', { month: 'short' })}`;
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function sliceByDate(from: string, to: string): TimePoint[] {
  return TIME_SERIES_90D.filter((p) => p.date >= from && p.date <= to);
}

export default function StatsPage(): React.ReactElement {
  const [tab, setTab] = useState<'metrics' | 'comparison'>('metrics');
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [dayModal, setDayModal] = useState<{ date: string; total: number } | null>(null);

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
  });
  const branches = branchesQuery.data?.items.filter((b) => b.status === 'active') ?? [];
  const activeBranchIds = branches.map((b) => b.id);
  const usingAll = selectedBranches.size === 0 || selectedBranches.size === activeBranchIds.length;

  const now = new Date();
  const defTo = toDateInput(now.toISOString());
  const defFrom = toDateInput(new Date(now.getTime() - 29 * 86400_000).toISOString());
  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);

  const { series, days } = useMemo(() => {
    if (preset === 'custom') {
      const s = sliceByDate(from, to);
      return { series: s, days: s.length };
    }
    const d = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    return { series: getSeries(d), days: d };
  }, [preset, from, to]);

  const summary = useMemo(() => computeSummary(Math.max(days, 1)), [days]);

  // Branch-adjusted metrics — proportion revenue by number of selected branches
  const branchFactor = useMemo(() => {
    if (usingAll || activeBranchIds.length === 0) return 1;
    const totalRevenue = branches.reduce((s, b) => s + b.monthlyRevenue, 0);
    const selectedRevenue = branches
      .filter((b) => selectedBranches.has(b.id))
      .reduce((s, b) => s + b.monthlyRevenue, 0);
    return totalRevenue > 0 ? selectedRevenue / totalRevenue : 1;
  }, [selectedBranches, branches, usingAll, activeBranchIds.length]);

  const adjustedSeries = useMemo(
    () => series.map((p) => ({ ...p, revenue: Math.round(p.revenue * branchFactor) })),
    [series, branchFactor],
  );

  function toggleBranch(id: string) {
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedBranches(new Set());
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </div>
            <h1 className="text-2xl font-semibold">Отчёты</h1>
          </div>
          <p className="text-base-content/60 text-sm mt-1 ml-10">
            Финансы, посещаемость, сравнение филиалов
          </p>
        </div>

        {tab === 'metrics' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="join shadow-sm">
            {(['7d', '30d', '90d', 'custom'] as const).map((r) => (
              <button
                key={r}
                type="button"
                className={clsx(
                  'join-item btn btn-sm',
                  preset === r ? 'btn-primary' : 'btn-ghost bg-base-100',
                )}
                onClick={() => setPreset(r)}
              >
                {r === '7d' && '7 дней'}
                {r === '30d' && '30 дней'}
                {r === '90d' && '90 дней'}
                {r === 'custom' && (
                  <>
                    <Calendar className="size-3.5" /> Свой период
                  </>
                )}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2 bg-base-100 border border-base-300 rounded-lg px-2 py-1">
              <input
                type="date"
                value={from}
                min={TIME_SERIES_90D[0]?.date}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="input input-xs bg-transparent border-0 focus:outline-none w-32"
              />
              <span className="text-base-content/40 text-xs">→</span>
              <input
                type="date"
                value={to}
                min={from}
                max={TIME_SERIES_90D[TIME_SERIES_90D.length - 1]?.date}
                onChange={(e) => setTo(e.target.value)}
                className="input input-xs bg-transparent border-0 focus:outline-none w-32"
              />
            </div>
          )}
        </div>
        )}
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-bordered">
        <button
          role="tab"
          className={clsx('tab gap-2', tab === 'metrics' && 'tab-active')}
          onClick={() => setTab('metrics')}
        >
          <TrendingUp className="size-4" /> Метрики
        </button>
        <button
          role="tab"
          className={clsx('tab gap-2', tab === 'comparison' && 'tab-active')}
          onClick={() => setTab('comparison')}
        >
          <BarChart2 className="size-4" /> Сравнение филиалов
        </button>
      </div>

      {tab === 'comparison' && <ComparisonTab />}

      {tab === 'metrics' && <div className="space-y-6">

      {/* Branch filter */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body py-3">
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="size-4 text-primary" />
              Филиалы:
              <span className="text-base-content/50 font-normal text-xs">
                {usingAll ? 'все филиалы' : `выбрано ${selectedBranches.size} из ${activeBranchIds.length}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              <button
                type="button"
                className={clsx(
                  'btn btn-xs gap-1',
                  usingAll ? 'btn-primary' : 'btn-ghost border border-base-300',
                )}
                onClick={selectAll}
              >
                {usingAll && <Check className="size-3" />} Все филиалы
              </button>
              {branches.map((b) => {
                const active = !usingAll && selectedBranches.has(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={clsx(
                      'btn btn-xs gap-1',
                      active ? 'btn-primary' : 'btn-ghost border border-base-300',
                    )}
                    onClick={() => toggleBranch(b.id)}
                  >
                    {active && <Check className="size-3" />} {b.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div key={`kpi-${preset}-${from}-${to}-${selectedBranches.size}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="chart-rise chart-rise-delay-1 card-lift">
          <KpiCard
            label="Выручка"
            value={adjustedSeries.reduce((s, p) => s + p.revenue, 0)}
            valueFormat={(v) => `${formatCurrency(v)} сум`}
            delta={summary.revenueDelta}
            trend={adjustedSeries.map((p) => p.revenue)}
          />
        </div>
        <div className="chart-rise chart-rise-delay-2 card-lift">
          <KpiCard
            label="Посещаемость"
            value={series.length > 0 ? series.reduce((s, p) => s + p.attendance, 0) / series.length : 0}
            valueFormat={(v) => `${v.toFixed(1)}%`}
            delta={summary.attendanceDelta}
            deltaUnit="pp"
            trend={series.map((p) => p.attendance)}
          />
        </div>
        <div className="chart-rise chart-rise-delay-3 card-lift">
          <KpiCard
            label="Новые студенты"
            value={series.reduce((s, p) => s + p.newStudents, 0)}
            valueFormat={(v) => String(Math.round(v))}
            delta={summary.studentsDelta}
            trend={series.map((p) => p.newStudents)}
          />
        </div>
        <div className="chart-rise chart-rise-delay-4 card-lift">
          <KpiCard
            label="Должники"
            value={summary.unpaidStudents}
            valueFormat={(v) => String(Math.round(v))}
            delta={summary.unpaidDelta}
            invertColors
            trend={series.map((_, i) => Math.max(0, 12 - Math.floor(i / 3)))}
          />
        </div>
      </div>

      {/* Hero — revenue */}
      <NeonChartCard
        key={`hero-${preset}-${from}-${to}-${selectedBranches.size}`}
        title={usingAll ? 'Выручка · все филиалы' : `Выручка · ${selectedBranches.size} филиал(ов)`}
        subtitle={
          adjustedSeries.length > 0
            ? `${formatDate(adjustedSeries[0]!.date)} — ${formatDate(adjustedSeries[adjustedSeries.length - 1]!.date)}`
            : ''
        }
        value={adjustedSeries.reduce((s, p) => s + p.revenue, 0)}
        unit="сум"
        delta={summary.revenueDelta}
        data={adjustedSeries.map((p) => ({ date: p.date, value: p.revenue }))}
        yFormat={formatCurrency}
        onDayClick={(iso, total) => setDayModal({ date: iso, total })}
      />

      {/* Attendance + payment methods */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <NeonLineCard
            key={`att-${preset}-${from}-${to}`}
            title="Посещаемость"
            subtitle="% присутствия по дням"
            value={series.length > 0 ? series.reduce((s, p) => s + p.attendance, 0) / series.length : 0}
            unit="%"
            data={series.map((p) => ({ date: p.date, value: p.attendance }))}
            domain={[60, 100]}
            yFormat={(v) => `${v}%`}
          />
        </div>

        <PaymentMethodsCard />
      </div>

      {/* Top groups */}
      <TopGroupsCard />
      </div>}

      <PaymentDayModal
        open={!!dayModal}
        date={dayModal?.date ?? null}
        totalHint={dayModal?.total ?? 3_000_000}
        onClose={() => setDayModal(null)}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Neon hero card
// ────────────────────────────────────────────────────────────

interface NeonProps {
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  delta: number;
  data: Array<{ date: string; value: number }>;
  yFormat: (v: number) => string;
  onDayClick?: (iso: string, value: number) => void;
}

function NeonChartCard(props: NeonProps): React.ReactElement {
  const theme = useResolvedTheme();
  return theme === 'dark' ? <NeonHeroDark {...props} /> : <NeonHeroLight {...props} />;
}

function makeChartClickHandler(onDayClick?: (iso: string, v: number) => void) {
  if (!onDayClick) return undefined;
  return (state: unknown) => {
    const s = state as { activePayload?: Array<{ payload?: { date?: string; value?: number } }> };
    const point = s?.activePayload?.[0]?.payload;
    if (point?.date) onDayClick(point.date, Number(point.value ?? 0));
  };
}

function NeonHeroDark({
  title,
  subtitle,
  value,
  unit,
  delta,
  data,
  yFormat,
  onDayClick,
}: NeonProps): React.ReactElement {
  return (
    <div
      className="card overflow-hidden relative border shadow-xl chart-rise chart-rise-delay-5"
      style={{
        background:
          'radial-gradient(120% 100% at 100% 0%, rgba(233, 53, 131, 0.15), transparent 55%), radial-gradient(90% 90% at 0% 100%, rgba(124, 58, 237, 0.18), transparent 55%), #0a0e27',
        borderColor: '#2a1f4a',
      }}
    >
      <div className="card-body">
        <HeroHeader
          title={title}
          subtitle={subtitle}
          value={value}
          unit={unit}
          delta={delta}
          textColor="text-white"
          mutedColor="text-white/50"
          glow="0 0 20px rgba(255, 61, 154, 0.4)"
        />
        <div className="h-80 mt-6 chart-sweep">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
              onClick={makeChartClickHandler(onDayClick)}
              style={onDayClick ? { cursor: 'pointer' } : undefined}
            >
              <defs>
                <linearGradient id="neon-area-dark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON_PINK} stopOpacity={0.95} />
                  <stop offset="35%" stopColor={NEON_MAGENTA} stopOpacity={0.75} />
                  <stop offset="70%" stopColor={NEON_VIOLET} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={NEON_BLUE} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="neon-stroke-dark" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={NEON_PINK} />
                  <stop offset="100%" stopColor="#ff8a00" />
                </linearGradient>
                <filter id="neon-glow-dark" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                fontSize={11}
                stroke="rgba(255,255,255,0.4)"
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                dy={8}
              />
              <YAxis
                tickFormatter={yFormat}
                fontSize={11}
                stroke="rgba(255,255,255,0.4)"
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<NeonTooltip unit={unit} dark />} cursor={{ stroke: NEON_PINK, strokeDasharray: '3 3', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#neon-stroke-dark)"
                strokeWidth={3}
                fill="url(#neon-area-dark)"
                animationDuration={1600}
                animationEasing="ease-out"
                activeDot={{ r: 7, fill: NEON_YELLOW, stroke: 'white', strokeWidth: 2, className: 'neon-dot' }}
                dot={{ r: 3, fill: NEON_YELLOW, stroke: NEON_YELLOW, strokeWidth: 1 }}
                filter="url(#neon-glow-dark)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function NeonHeroLight({
  title,
  subtitle,
  value,
  unit,
  delta,
  data,
  yFormat,
  onDayClick,
}: NeonProps): React.ReactElement {
  return (
    <div
      className="card overflow-hidden relative border border-base-300 bg-base-100 shadow-sm chart-rise chart-rise-delay-5"
      style={{
        backgroundImage:
          'radial-gradient(120% 100% at 100% 0%, rgba(233, 53, 131, 0.06), transparent 55%), radial-gradient(90% 90% at 0% 100%, rgba(124, 58, 237, 0.06), transparent 55%)',
      }}
    >
      <div className="card-body">
        <HeroHeader
          title={title}
          subtitle={subtitle}
          value={value}
          unit={unit}
          delta={delta}
          textColor="text-base-content"
          mutedColor="text-base-content/50"
        />
        <div className="h-80 mt-6 chart-sweep">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 4, left: 0, bottom: 0 }}
              onClick={makeChartClickHandler(onDayClick)}
              style={onDayClick ? { cursor: 'pointer' } : undefined}
            >
              <defs>
                <linearGradient id="neon-area-light" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NEON_PINK} stopOpacity={0.55} />
                  <stop offset="45%" stopColor={NEON_MAGENTA} stopOpacity={0.28} />
                  <stop offset="90%" stopColor={NEON_VIOLET} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="neon-stroke-light" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={NEON_MAGENTA} />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(90% 0 0 / 0.5)" strokeDasharray="3 6" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                fontSize={11}
                stroke="oklch(60% 0 0)"
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                dy={8}
              />
              <YAxis
                tickFormatter={yFormat}
                fontSize={11}
                stroke="oklch(60% 0 0)"
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<NeonTooltip unit={unit} />} cursor={{ stroke: NEON_MAGENTA, strokeDasharray: '3 3', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#neon-stroke-light)"
                strokeWidth={3}
                fill="url(#neon-area-light)"
                animationDuration={1600}
                animationEasing="ease-out"
                activeDot={{ r: 6, fill: NEON_MAGENTA, stroke: 'var(--color-base-100)', strokeWidth: 3 }}
                dot={{ r: 2.5, fill: NEON_MAGENTA, stroke: NEON_MAGENTA }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function HeroHeader({
  title,
  subtitle,
  value,
  unit,
  delta,
  textColor,
  mutedColor,
  glow,
}: {
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  delta: number;
  textColor: string;
  mutedColor: string;
  glow?: string;
}): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className={`text-xs uppercase tracking-widest ${mutedColor}`}>{title}</div>
        <div className="flex items-baseline gap-3 mt-2">
          <div
            className={`text-4xl md:text-5xl font-bold tabular-nums tracking-tight ${textColor}`}
            style={glow ? { textShadow: glow } : undefined}
          >
            <AnimatedNumber value={value} />
          </div>
          <div className={`text-lg ${mutedColor}`}>{unit}</div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <DeltaChip value={delta} onDark={!!glow} />
          <span className={`text-xs ${mutedColor}`}>vs пред. период</span>
        </div>
      </div>
      <div className={`text-xs ${mutedColor} text-right`}>{subtitle}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// NeonLineCard for attendance — theme-aware
// ────────────────────────────────────────────────────────────

interface NeonLineProps {
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  data: Array<{ date: string; value: number }>;
  domain: [number, number];
  yFormat: (v: number) => string;
}

function NeonLineCard(props: NeonLineProps): React.ReactElement {
  const theme = useResolvedTheme();
  return theme === 'dark' ? <NeonLineDark {...props} /> : <NeonLineLight {...props} />;
}

function NeonLineDark({
  title,
  subtitle,
  value,
  unit,
  data,
  domain,
  yFormat,
}: NeonLineProps): React.ReactElement {
  return (
    <div
      className="card overflow-hidden relative border shadow-xl chart-rise chart-rise-delay-5 h-full"
      style={{
        background:
          'radial-gradient(90% 80% at 100% 100%, rgba(59, 130, 246, 0.15), transparent 55%), radial-gradient(80% 80% at 0% 0%, rgba(124, 58, 237, 0.15), transparent 55%), #0a0e27',
        borderColor: '#1e2a4a',
      }}
    >
      <div className="card-body">
        <LineHeader title={title} subtitle={subtitle} value={value} unit={unit} textColor="text-white" mutedColor="text-white/50" glow="0 0 16px rgba(59, 130, 246, 0.4)" />
        <div className="h-60 mt-4 chart-sweep chart-sweep-delay-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="neon-line-dark" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={NEON_VIOLET} />
                  <stop offset="50%" stopColor={NEON_MAGENTA} />
                  <stop offset="100%" stopColor={NEON_PINK} />
                </linearGradient>
                <filter id="neon-line-glow-dark" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} fontSize={11} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} minTickGap={30} dy={6} />
              <YAxis domain={domain} fontSize={11} stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} width={35} tickFormatter={yFormat} />
              <Tooltip content={<NeonTooltip unit={unit} dark />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#neon-line-dark)"
                strokeWidth={3}
                dot={{ r: 3, fill: NEON_YELLOW, stroke: NEON_YELLOW, strokeWidth: 1 }}
                activeDot={{ r: 6, fill: NEON_YELLOW, stroke: 'white', strokeWidth: 2, className: 'neon-dot' }}
                animationDuration={1600}
                animationEasing="ease-out"
                filter="url(#neon-line-glow-dark)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function NeonLineLight({
  title,
  subtitle,
  value,
  unit,
  data,
  domain,
  yFormat,
}: NeonLineProps): React.ReactElement {
  return (
    <div className="card overflow-hidden bg-base-100 border border-base-300 chart-rise chart-rise-delay-5 h-full card-lift">
      <div className="card-body">
        <LineHeader title={title} subtitle={subtitle} value={value} unit={unit} textColor="text-base-content" mutedColor="text-base-content/60" />
        <div className="h-60 mt-4 chart-sweep chart-sweep-delay-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="neon-line-light" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={NEON_VIOLET} />
                  <stop offset="50%" stopColor={NEON_MAGENTA} />
                  <stop offset="100%" stopColor={NEON_PINK} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(90% 0 0 / 0.5)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} fontSize={11} stroke="oklch(60% 0 0)" tickLine={false} axisLine={false} minTickGap={30} dy={6} />
              <YAxis domain={domain} fontSize={11} stroke="oklch(60% 0 0)" tickLine={false} axisLine={false} width={35} tickFormatter={yFormat} />
              <Tooltip content={<NeonTooltip unit={unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#neon-line-light)"
                strokeWidth={3}
                dot={{ r: 2.5, fill: NEON_MAGENTA }}
                activeDot={{ r: 6, fill: NEON_MAGENTA, stroke: 'var(--color-base-100)', strokeWidth: 3 }}
                animationDuration={1600}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LineHeader({
  title,
  subtitle,
  value,
  unit,
  textColor,
  mutedColor,
  glow,
}: {
  title: string;
  subtitle: string;
  value: number;
  unit: string;
  textColor: string;
  mutedColor: string;
  glow?: string;
}): React.ReactElement {
  return (
    <div>
      <div className={`text-xs uppercase tracking-widest ${mutedColor}`}>{title}</div>
      <div className="flex items-baseline gap-2 mt-2">
        <div className={`text-3xl font-bold tabular-nums ${textColor}`} style={glow ? { textShadow: glow } : undefined}>
          <AnimatedNumber value={value} format={(v) => v.toFixed(1)} />
        </div>
        <div className={`text-base ${mutedColor}`}>{unit}</div>
      </div>
      <p className={`text-xs ${mutedColor} mt-1`}>{subtitle}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Payment methods pie + top groups bar
// ────────────────────────────────────────────────────────────

function PaymentMethodsCard(): React.ReactElement {
  return (
    <div className="card bg-base-100 border border-base-300 chart-rise chart-rise-delay-6 card-lift">
      <div className="card-body">
        <h2 className="text-lg font-medium">Способы оплаты</h2>
        <p className="text-xs text-base-content/60">Доля за период</p>
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PAYMENT_METHODS_DIST}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationDuration={1400}
                animationEasing="ease-out"
                stroke="var(--color-base-100)"
                strokeWidth={2}
              >
                {PAYMENT_METHODS_DIST.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Доля']}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid oklch(90% 0 0)' }}
              />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TopGroupsCard(): React.ReactElement {
  return (
    <div className="card bg-base-100 border border-base-300 chart-rise chart-rise-delay-6 card-lift overflow-hidden">
      <div className="card-body">
        <h2 className="text-lg font-medium">Топ групп по выручке</h2>
        <p className="text-xs text-base-content/60">Текущий месяц</p>
        <div className="h-64 mt-2 chart-sweep chart-sweep-delay-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TOP_GROUPS} layout="vertical" margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-bar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={NEON_VIOLET} />
                  <stop offset="60%" stopColor={NEON_MAGENTA} />
                  <stop offset="100%" stopColor={NEON_PINK} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(90% 0 0 / 0.4)" horizontal={false} strokeDasharray="3 6" />
              <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} fontSize={11} stroke="oklch(60% 0 0)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" fontSize={11} stroke="oklch(40% 0 0)" tickLine={false} axisLine={false} width={220} />
              <Tooltip
                formatter={(v: number) => [`${CURRENCY.format(v)} сум`, 'Выручка']}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid oklch(90% 0 0)' }}
                cursor={{ fill: 'oklch(90% 0 0 / 0.3)' }}
              />
              <Bar dataKey="revenue" fill="url(#grad-bar)" radius={[0, 6, 6, 0]} animationDuration={1400} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// KPI card + shared bits
// ────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  valueFormat: (v: number) => string;
  delta: number;
  deltaUnit?: '%' | 'pp';
  invertColors?: boolean;
  trend: number[];
}

function KpiCard({
  label,
  value,
  valueFormat,
  delta,
  deltaUnit = '%',
  invertColors = false,
  trend,
}: KpiProps): React.ReactElement {
  const positive = delta > 0;
  const negative = delta < 0;
  const good = invertColors ? negative : positive;
  const bad = invertColors ? positive : negative;

  const stroke = good ? 'oklch(55% 0.2 145)' : bad ? 'oklch(55% 0.24 25)' : 'oklch(60% 0.02 260)';
  const gradFill = good ? 'oklch(65% 0.2 145)' : bad ? 'oklch(60% 0.24 25)' : 'oklch(60% 0.02 260)';
  const gradId = `spark-${label.replace(/\s+/g, '-')}`;

  const data = trend.map((v, i) => ({ i, v }));

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      <div className="card-body py-4">
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span className="uppercase tracking-wider">{label}</span>
          <DeltaChip value={delta} unit={deltaUnit} invert={invertColors} />
        </div>
        <div className="text-2xl font-semibold mt-1 tabular-nums tracking-tight">
          <AnimatedNumber value={value} format={valueFormat} duration={800} />
        </div>
        <div className="h-12 -mx-2 -mb-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradFill} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={gradFill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={1.5}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DeltaChip({
  value,
  unit = '%',
  invert = false,
  onDark = false,
}: {
  value: number;
  unit?: '%' | 'pp';
  invert?: boolean;
  onDark?: boolean;
}): React.ReactElement {
  if (Math.abs(value) < 0.05) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${onDark ? 'text-white/50' : 'text-base-content/50'}`}>
        <Minus className="size-3" /> 0{unit}
      </span>
    );
  }
  const up = value > 0;
  const good = invert ? !up : up;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const sign = up ? '+' : '';
  const cls = onDark
    ? good ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
    : good ? 'bg-success/10 text-success' : 'bg-error/10 text-error';
  return (
    <span className={clsx('inline-flex items-center gap-0.5 font-medium text-xs rounded-full px-2 py-0.5', cls)}>
      <Arrow className="size-3" />
      {sign}
      {value.toFixed(1)}
      {unit}
    </span>
  );
}

function NeonTooltip({
  active,
  payload,
  label,
  unit,
  dark = false,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
  unit: string;
  dark?: boolean;
}): React.ReactElement | null {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0]?.value;
  if (dark) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs backdrop-blur"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 61, 154, 0.3)',
          color: 'white',
        }}
      >
        <div className="text-white/50 mb-0.5">{label ? formatDate(label) : ''}</div>
        <div className="font-semibold text-base tabular-nums">
          {typeof v === 'number' ? CURRENCY.format(v) : v}{' '}
          <span className="text-xs text-white/50 font-normal">{unit}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg px-3 py-2 text-xs bg-base-100/95 backdrop-blur border border-base-300 shadow-lg">
      <div className="text-base-content/60 mb-0.5">{label ? formatDate(label) : ''}</div>
      <div className="font-semibold text-base tabular-nums">
        {typeof v === 'number' ? CURRENCY.format(v) : v}{' '}
        <span className="text-xs text-base-content/50 font-normal">{unit}</span>
      </div>
    </div>
  );
}
