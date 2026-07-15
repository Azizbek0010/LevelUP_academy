import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Building2, GraduationCap, Store, RefreshCw, ArrowRight,
  TrendingUp, Inbox, Crown, Sparkles, PhoneCall, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { fmt, dateShort, LEAD_STATUS } from '../format.js';
import { useDashboard, useLeads } from '../queries.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonKpis, SkeletonList } from '../components/Skeleton.jsx';

const PIE_COLORS = { active: '#A3E635', trial: '#FCD34D', frozen: '#F87171' };
const PIE_LABELS = { active: 'Активные', trial: 'Триал', frozen: 'Заморожены' };
const STATUS_ICON = { new: Sparkles, contacted: PhoneCall, onboarded: CheckCircle2, rejected: XCircle };

function Kpi({ Icon, tint, title, value, unit, accent }) {
  return (
    <div className={`card shadow-sm border transition-shadow hover:shadow-md ${accent ? 'bg-gradient-to-br from-lime-400 to-lime-500 border-lime-400' : 'bg-base-100 border-base-200/60'}`}>
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
            style={accent ? { background: 'rgba(0,0,0,0.12)', color: '#1a2e05' } : { background: tint.bg, color: tint.fg }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className={`text-[11px] font-semibold uppercase tracking-wider leading-tight ${accent ? 'text-lime-950/60' : 'text-base-content/45'}`}>
            {title}
          </div>
        </div>
        <div className={`text-3xl font-extrabold mt-3 leading-none ${accent ? 'text-lime-950' : ''}`}>{value}</div>
        {unit && <div className={`text-xs mt-1.5 ${accent ? 'text-lime-950/55' : 'text-base-content/45'}`}>{unit}</div>}
      </div>
    </div>
  );
}

const CustomBar = ({ x, y, width, height }) => (
  <rect x={x} y={y} width={width} height={height} rx={4} fill="#A3E635" />
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <div className="font-semibold mb-1 truncate max-w-[160px]">{label}</div>
      <div className="text-lime-600 font-bold">{fmt(payload[0]?.value)} UZS</div>
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: allLeads } = useLeads();

  const recentLeads = useMemo(
    () => (allLeads || [])
      .filter((l) => l.status === 'new' || l.status === 'contacted')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5),
    [allLeads],
  );
  const newLeadsCount = (allLeads || []).filter((l) => l.status === 'new').length;

  if (error && error.status !== 401) {
    return (
      <div className="alert alert-error text-sm flex items-center justify-between">
        <span>{error.message}</span>
        <button className="btn btn-sm btn-ghost gap-1" onClick={() => refetch()}>
          <RefreshCw size={14} /> Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Дашборд платформы" subtitle="Обзор партнёров, дохода и заявок LevelUp Academy" />
        <button
          className="btn btn-ghost btn-sm gap-1.5 shrink-0 mt-1"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {isLoading || !data ? (
        <>
          <SkeletonKpis count={4} />
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="card bg-base-100 lg:col-span-2"><div className="card-body"><SkeletonList rows={6} /></div></div>
            <div className="card bg-base-100"><div className="card-body"><SkeletonList rows={5} /></div></div>
          </div>
        </>
      ) : (
        <Loaded data={data} recentLeads={recentLeads} newLeadsCount={newLeadsCount} allLeadsCount={(allLeads || []).length} />
      )}
    </div>
  );
}

function Loaded({ data, recentLeads, newLeadsCount, allLeadsCount }) {
  const t = data.totals;
  const cur = t.currency;
  const partners = data.partners || [];
  const sorted = [...partners].sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0));
  const topPartners = sorted.slice(0, 6);
  const maxBill = Math.max(1, ...partners.map((p) => p.monthlyBill || 0));
  const activeCount = partners.filter((p) => p.status === 'active').length;

  const barData = topPartners.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name,
    fullName: p.name,
    value: p.monthlyBill || 0,
    id: p.id,
  }));

  const statusCounts = partners.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: PIE_LABELS[status] || status,
    value: count,
    color: PIE_COLORS[status] || '#94a3b8',
  }));

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          Icon={Wallet}
          tint={{ bg: '#ECFCCB', fg: '#365314' }}
          title="Наш доход / мес"
          value={fmt(t.ourMonthlyIncome)}
          unit={cur}
          accent
        />
        <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёры" value={fmt(t.partners)} unit="учебных центров" />
        <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Ученики" value={fmt(t.students)} unit="по платформе" />
        <Kpi Icon={Store} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Филиалы" value={fmt(t.branches)} unit="всего" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200/60 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown size={17} className="text-lime-500" />
                <h2 className="card-title text-base">Доход по партнёрам</h2>
                <span className="text-xs text-base-content/40">({cur}/мес)</span>
              </div>
              <Link to="/revenue" className="text-sm text-lime-600 font-semibold hover:underline flex items-center gap-1">
                Все <ArrowRight size={13} />
              </Link>
            </div>

            {barData.length === 0 ? (
              <div className="text-center py-12">
                <Building2 size={32} className="mx-auto text-base-content/20 mb-2" />
                <p className="text-base-content/40 text-sm">Пока нет партнёров</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" shape={<CustomBar />} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {pieData.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body p-5">
                <h2 className="card-title text-sm mb-3">По статусам</h2>
                <div className="flex items-center gap-3">
                  <PieChart width={90} height={90}>
                    <Pie data={pieData} cx={40} cy={40} innerRadius={24} outerRadius={42} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-1.5 flex-1">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          {entry.name}
                        </span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card bg-base-100 shadow-sm border border-base-200/60 flex-1">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title text-sm">Активные заявки</h2>
                {newLeadsCount > 0 && (
                  <Link to="/leads" className="badge badge-error badge-sm">{newLeadsCount} новых</Link>
                )}
              </div>
              <div className="divide-y divide-base-200 -mb-2">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-6">
                    <Inbox size={24} className="mx-auto text-base-content/25 mb-1" />
                    <p className="text-base-content/40 text-xs">Активных заявок нет</p>
                  </div>
                ) : (
                  recentLeads.map((l) => {
                    const s = LEAD_STATUS[l.status] || { label: l.status, cls: 'badge-ghost' };
                    const StatusIcon = STATUS_ICON[l.status];
                    return (
                      <Link
                        key={l.id}
                        to="/leads"
                        className="py-2.5 flex items-center gap-2.5 hover:bg-base-200/50 -mx-5 px-5 transition-colors"
                      >
                        <Avatar name={l.centerName || l.name} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{l.centerName || l.name}</div>
                          <div className="text-xs text-base-content/50">{dateShort(l.createdAt)}</div>
                        </div>
                        <span className={`badge badge-sm gap-1 ${s.cls}`}>
                          {StatusIcon && <StatusIcon size={10} />}
                          {s.label}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
              {(allLeadsCount > 0 || recentLeads.length > 0) && (
                <Link to="/leads" className="btn btn-ghost btn-xs w-full mt-3 gap-1">
                  Все заявки ({allLeadsCount}) <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {partners.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200/60">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="card-title text-base">ТОП партнёров</h2>
                <span className="text-xs text-base-content/40">{activeCount} активных</span>
              </div>
              <Link to="/organizations" className="text-sm text-lime-600 font-semibold hover:underline flex items-center gap-1">
                Все партнёры <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-3">
              {topPartners.map((p, i) => {
                const pct = Math.max(4, ((p.monthlyBill || 0) / maxBill) * 100);
                const statusCls = { active: 'badge-success', trial: 'badge-warning', frozen: 'badge-error' };
                const statusLabel = { active: 'Активен', trial: 'Триал', frozen: 'Заморожен' };
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-extrabold text-base-content/40 tabular-nums">{i + 1}</span>
                    <Avatar name={p.name} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1.5 gap-2">
                        <Link to={`/organizations/${p.id}`} className="truncate font-medium hover:text-lime-600 transition-colors">
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`badge badge-xs ${statusCls[p.status] || 'badge-ghost'}`}>{statusLabel[p.status] || p.status}</span>
                          <span className="font-bold tabular-nums">{fmt(p.monthlyBill)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: i === 0 ? '#A3E635' : '#C6FF34' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
