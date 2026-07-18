import { useMemo, useState } from 'react';
import {
  TrendingUp, Building2, GraduationCap, Wallet, Crown, X, ArrowRight,
  TrendingDown, ThumbsUp, AlertTriangle, Award,
} from 'lucide-react';
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

const PERIODS = [
  { key: 'month', label: 'Этот месяц', mult: 1 },
  { key: 'quarter', label: 'Квартал', mult: 3 },
  { key: 'year', label: 'Год', mult: 12 },
];

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

function BarDetailModal({ bar, partner, total, cur, onClose }) {
  if (!bar) return null;
  const share = total > 0 ? ((bar.value / total) * 100).toFixed(1) : '0.0';
  const s = partner ? (ORG_STATUS[partner.status] || { label: partner.status, cls: 'badge-ghost' }) : null;
  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box max-w-md p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-base-200 bg-gradient-to-r from-lime-50 to-transparent">
          {partner && <Avatar name={partner.name} size={40} />}
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-base leading-tight truncate">{bar.fullName || bar.name}</div>
            {s && <span className={`badge badge-sm ${s.cls} mt-1`}>{s.label}</span>}
          </div>
          <button className="btn btn-ghost btn-sm btn-circle shrink-0" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 p-4 text-lime-950">
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">Счёт / мес</div>
            <div className="text-3xl font-black mt-1">{fmt(bar.value)} <span className="text-sm font-bold">{cur}</span></div>
            <div className="text-xs mt-1 opacity-70">Доля в общем доходе: {share}%</div>
          </div>
          <div className="rounded-xl border border-base-200 p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-base-content/60">Доля</span>
              <span className="font-bold tabular-nums">{share}%</span>
            </div>
            <div className="h-2 rounded-full bg-base-200 overflow-hidden">
              <div className="h-full rounded-full bg-lime-400" style={{ width: `${Math.min(100, parseFloat(share))}%` }} />
            </div>
          </div>
          {partner && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-base-200/40 p-2 text-center">
                <div className="text-xs text-base-content/50">Филиалы</div>
                <div className="font-extrabold tabular-nums">{fmt(partner.branches)}</div>
              </div>
              <div className="rounded-lg bg-base-200/40 p-2 text-center">
                <div className="text-xs text-base-content/50">Ученики</div>
                <div className="font-extrabold tabular-nums">{fmt(partner.students)}</div>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-base-200 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Закрыть</button>
          {bar.id && (
            <Link
              to={`/organizations/${bar.id}`}
              className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2 flex-1"
              onClick={onClose}
            >
              Детали <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function PartnerRow({ p, cur, tone }) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(p.createdAt)) / 86400000));
  const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-base-200/40">
      <Avatar name={p.name} size={32} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{p.name}</div>
        <div className="text-xs text-base-content/50 flex items-center gap-2 flex-wrap">
          <span className={`badge badge-xs ${s.cls}`}>{s.label}</span>
          <span>Активен {days} дн.</span>
        </div>
      </div>
      <div className={`text-sm font-extrabold tabular-nums shrink-0 ${tone === 'best' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {fmt(p.monthlyBill)} <span className="text-[10px] font-semibold opacity-60">{cur}</span>
      </div>
    </div>
  );
}

export default function Revenue() {
  const { data, isLoading, error } = useDashboard();
  const [period, setPeriod] = useState('month');
  const [selectedBar, setSelectedBar] = useState(null);

  const mult = PERIODS.find((p) => p.key === period)?.mult || 1;
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || '';

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

    // Лучшие / слабые партнёры
    const best = sorted.slice(0, 3);
    const worst = [...sorted].reverse().slice(0, 3); // самые низкие/frozen оказываются здесь

    return {
      partners, cur, total, avg, sorted, barData, pieData,
      active, trial, frozen,
      activeRev: active.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      trialRev: trial.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      frozenRev: frozen.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      best, worst,
    };
  }, [data]);

  if (error && error.status !== 401) {
    return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;
  }

  const selectedPartner = selectedBar && stats
    ? stats.partners.find((p) => p.id === selectedBar.id)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Доход платформы" subtitle="Ежемесячная выручка от всех учебных центров" />

      {/* Period filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-base-content/60 font-semibold">Период:</span>
        <div className="join">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`join-item btn btn-sm ${period === p.key ? 'bg-lime-400 hover:bg-lime-500 border-0 text-lime-950' : 'btn-outline'}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {stats && mult !== 1 && (
          <span className="text-xs text-base-content/50">
            × {mult} к месячному счёту (~{fmt(stats.total * mult)} {stats.cur})
          </span>
        )}
      </div>

      {isLoading || !stats ? (
        <>
          <SkeletonKpis count={4} />
          <div className="card bg-base-100"><div className="card-body"><SkeletonList rows={6} /></div></div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              Icon={Wallet}
              tint={{ bg: '#E6F4D7', fg: '#3F6212' }}
              title={`Доход / ${periodLabel.toLowerCase()}`}
              value={fmt(stats.total * mult)}
              unit={stats.cur}
              accent
            />
            <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёров" value={String(stats.partners.length)} unit="учебных центров" />
            <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Средний счёт" value={fmt(stats.avg * mult)} unit={stats.cur} />
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
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FEE7' }} />
                      <Bar
                        dataKey="value"
                        fill="#A3E635"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                        onClick={(d) => setSelectedBar(d?.payload || null)}
                        cursor="pointer"
                      />
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
                        <div className="text-xs text-base-content/50">{fmt(item.rev * mult)} {stats.cur}/{periodLabel.toLowerCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Анализ партнёров */}
          {stats.partners.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={18} className="text-lime-500" />
                  <h2 className="card-title text-base">Анализ партнёров</h2>
                  <span className="text-xs text-base-content/40">с кем лучше / хуже работать</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 grid place-items-center">
                        <ThumbsUp size={16} />
                      </span>
                      <div>
                        <div className="font-bold text-sm text-emerald-800">Лучшие партнёры</div>
                        <div className="text-xs text-emerald-700/70">Топ по доходу</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {stats.best.map((p) => (
                        <PartnerRow key={p.id} p={p} cur={stats.cur} tone="best" />
                      ))}
                      {stats.best.length === 0 && (
                        <div className="text-xs text-base-content/40 text-center py-4">Нет данных</div>
                      )}
                    </div>
                    <div className="mt-3 rounded-lg bg-emerald-100/60 p-2.5 text-xs text-emerald-800 flex items-start gap-2">
                      <TrendingUp size={13} className="shrink-0 mt-0.5" />
                      <span>Рекомендуем усилить сотрудничество: расширить пакет, предложить дополнительные модули</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 grid place-items-center">
                        <TrendingDown size={16} />
                      </span>
                      <div>
                        <div className="font-bold text-sm text-rose-800">Слабые партнёры</div>
                        <div className="text-xs text-rose-700/70">Минимальный доход / заморожены</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {stats.worst.map((p) => (
                        <PartnerRow key={p.id} p={p} cur={stats.cur} tone="worst" />
                      ))}
                      {stats.worst.length === 0 && (
                        <div className="text-xs text-base-content/40 text-center py-4">Нет данных</div>
                      )}
                    </div>
                    <div className="mt-3 rounded-lg bg-rose-100/60 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                      <span>Рассмотреть пересмотр условий: провести звонок, выяснить блокеры, предложить план развития</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

      {selectedBar && stats && (
        <BarDetailModal
          bar={selectedBar}
          partner={selectedPartner}
          total={stats.total}
          cur={stats.cur}
          onClose={() => setSelectedBar(null)}
        />
      )}
    </div>
  );
}
