import { useMemo } from 'react';
import { TrendingUp, Building2, GraduationCap, Wallet, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useDashboard } from '../queries.js';
import { fmt, ORG_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonKpis, SkeletonList } from '../components/Skeleton.jsx';

function Kpi({ Icon, tint, title, value, unit, accent }) {
  return (
    <div className={`card shadow-sm border transition-shadow hover:shadow-md ${accent ? 'bg-gradient-to-br from-lime-400 to-lime-500 border-lime-400' : 'bg-base-100 border-base-200/60'}`}>
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <div className="font-semibold mb-1 max-w-[160px] truncate">{label}</div>
      <div className="text-lime-600 font-bold">{fmt(payload[0]?.value)} UZS</div>
    </div>
  );
};

const PIE_COLORS = { active: '#A3E635', trial: '#FCD34D', frozen: '#F87171' };
const PIE_LABELS = { active: 'Активные', trial: 'Триал', frozen: 'Заморожены' };

export default function Revenue() {
  const { data, isLoading, error } = useDashboard();

  const stats = useMemo(() => {
    if (!data) return null;
    const partners = data.partners || [];
    const cur = data.totals?.currency || 'UZS';
    const total = partners.reduce((s, p) => s + (p.monthlyBill || 0), 0);
    const active = partners.filter((p) => p.status === 'active');
    const trial = partners.filter((p) => p.status === 'trial');
    const frozen = partners.filter((p) => p.status === 'frozen');
    const avg = partners.length ? Math.round(total / partners.length) : 0;
    const sorted = [...partners].sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0));

    const barData = sorted.slice(0, 8).map((p) => ({
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

    return {
      partners, cur, total, avg, sorted, barData, pieData,
      active, trial, frozen,
      activeRev: active.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      trialRev: trial.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      frozenRev: frozen.reduce((s, p) => s + (p.monthlyBill || 0), 0),
    };
  }, [data]);

  if (error && error.status !== 401) {
    return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Доход платформы" subtitle="Ежемесячная выручка от всех учебных центров" />

      {isLoading || !stats ? (
        <>
          <SkeletonKpis count={4} />
          <div className="card bg-base-100"><div className="card-body"><SkeletonList rows={6} /></div></div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi Icon={Wallet} tint={{ bg: '#E6F4D7', fg: '#3F6212' }} title="Общий доход / мес" value={fmt(stats.total)} unit={stats.cur} accent />
            <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёров" value={String(stats.partners.length)} unit="учебных центров" />
            <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Средний счёт" value={fmt(stats.avg)} unit={stats.cur} />
            <Kpi Icon={TrendingUp} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Активные" value={String(stats.active.length)} unit={`из ${stats.partners.length}`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 shadow-sm border border-base-200/60 lg:col-span-2">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={16} className="text-lime-500" />
                  <h2 className="card-title text-base">ТОП партнёров по доходу</h2>
                  <span className="text-xs text-base-content/40 ml-auto">{stats.cur}/мес</span>
                </div>
                {stats.barData.length === 0 ? (
                  <p className="text-base-content/40 text-sm text-center py-10">Партнёров пока нет</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={stats.barData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#A3E635" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {stats.pieData.length > 0 && (
                <div className="card bg-base-100 shadow-sm border border-base-200/60">
                  <div className="card-body p-5">
                    <h2 className="card-title text-sm mb-3">Разбивка по статусам</h2>
                    <div className="flex items-center justify-center gap-4">
                      <PieChart width={120} height={120}>
                        <Pie data={stats.pieData} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
                          {stats.pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                      <div className="space-y-2">
                        {stats.pieData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.color }} />
                            <span className="text-base-content/70">{entry.name}</span>
                            <span className="font-bold ml-auto">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow-sm border border-base-200/60">
                <div className="card-body p-5">
                  <h2 className="card-title text-sm mb-3">Доход по статусам</h2>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Активные', count: stats.active.length, rev: stats.activeRev, color: 'text-success', bg: 'bg-success/10' },
                      { label: 'Триал', count: stats.trial.length, rev: stats.trialRev, color: 'text-warning', bg: 'bg-warning/10' },
                      { label: 'Заморожены', count: stats.frozen.length, rev: stats.frozenRev, color: 'text-error', bg: 'bg-error/10' },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-lg p-3 ${item.bg}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                          <span className="text-sm font-bold">{item.count}</span>
                        </div>
                        <div className="text-xs text-base-content/50">{fmt(item.rev)} {stats.cur}/мес</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200/60">
            <div className="card-body">
              <h2 className="card-title text-base mb-1">Полная таблица счетов</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Партнёр</th>
                      <th className="text-right">Филиалы</th>
                      <th className="text-right">Ученики</th>
                      <th>Статус</th>
                      <th className="text-right">Счёт / мес</th>
                      <th className="text-right">Доля</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.sorted.map((p, i) => {
                      const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
                      const share = stats.total > 0 ? ((p.monthlyBill / stats.total) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={p.id} className="hover">
                          <td className="text-base-content/40 text-xs tabular-nums">{i + 1}</td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={p.name} size={28} />
                              <Link to={`/organizations/${p.id}`} className="font-medium hover:text-lime-600 transition-colors">
                                {p.name}
                              </Link>
                            </div>
                          </td>
                          <td className="text-right tabular-nums">{fmt(p.branches)}</td>
                          <td className="text-right tabular-nums">{fmt(p.students)}</td>
                          <td><span className={`badge badge-sm ${s.cls}`}>{s.label}</span></td>
                          <td className="text-right font-semibold tabular-nums">{fmt(p.monthlyBill)}</td>
                          <td className="text-right text-xs text-base-content/50 tabular-nums">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold border-t-2 border-base-300">
                      <td colSpan={5} className="text-right text-sm opacity-60">Итого:</td>
                      <td className="text-right text-lime-600 tabular-nums">{fmt(stats.total)}</td>
                      <td className="text-right text-xs text-base-content/40">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
