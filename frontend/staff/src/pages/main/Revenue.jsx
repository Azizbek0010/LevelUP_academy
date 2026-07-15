import { useMemo } from 'react';
import { TrendingUp, Building2, GraduationCap, Wallet, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMainDashboard } from '../../queries.js';
import { fmt, ORG_STATUS } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonKpis, SkeletonList } from '../../components/Skeleton.jsx';

function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">{title}</div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      </div>
    </div>
  );
}

function Bar({ name, value, max, cur, rank, id }) {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 3;
  const rankColor = rank === 1 ? '#C6FF34' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7c2f' : null;
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center text-xs font-bold" style={{ color: rankColor || '#9ca3af' }}>
        {rank <= 3 ? `#${rank}` : rank}
      </span>
      <Avatar name={name} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-sm mb-1 gap-2">
          <Link to={`/main/organizations/${id}`} className="truncate font-medium hover:text-primary transition-colors">{name}</Link>
          <span className="font-bold tabular-nums shrink-0">{fmt(value)} {cur}</span>
        </div>
        <div className="h-2.5 rounded-full bg-base-200 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#C6FF34' }} />
        </div>
      </div>
    </div>
  );
}

function StatusBlock({ label, count, revenue, cur, color, bg }) {
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-sm font-semibold ${color}`}>{label}</span>
        <span className="text-sm font-bold">{count}</span>
      </div>
      <div className="text-xs text-base-content/50">{fmt(revenue)} {cur}/мес</div>
    </div>
  );
}

export default function MainRevenue() {
  const { data, isLoading, error } = useMainDashboard();

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
    const maxBill = Math.max(1, ...partners.map((p) => p.monthlyBill || 0));
    return {
      partners, cur, total, avg, sorted, maxBill, active, trial, frozen,
      activeRev: active.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      trialRev: trial.reduce((s, p) => s + (p.monthlyBill || 0), 0),
      frozenRev: frozen.reduce((s, p) => s + (p.monthlyBill || 0), 0),
    };
  }, [data]);

  if (error && error.status !== 401) return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Доход платформы" subtitle="Ежемесячная выручка от всех учебных центров" />

      {isLoading || !stats ? (
        <><SkeletonKpis count={4} /><div className="card bg-base-100"><div className="card-body"><SkeletonList rows={6} /></div></div></>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi Icon={Wallet} tint={{ bg: '#E6F4D7', fg: '#3F6212' }} title="Общий доход / мес" value={fmt(stats.total)} unit={stats.cur} />
            <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёров" value={String(stats.partners.length)} unit="учебных центров" />
            <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Средний счёт" value={fmt(stats.avg)} unit={stats.cur} />
            <Kpi Icon={TrendingUp} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Активные" value={String(stats.active.length)} unit={`из ${stats.partners.length}`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card bg-base-100 lg:col-span-2">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={16} className="text-primary" />
                  <h2 className="card-title text-base">Рейтинг по доходу</h2>
                  <span className="text-xs text-base-content/40 ml-auto">{stats.cur}/мес</span>
                </div>
                {stats.sorted.length === 0 ? (
                  <p className="text-base-content/40 text-sm text-center py-8">Партнёров пока нет</p>
                ) : (
                  <div className="space-y-4">
                    {stats.sorted.map((p, i) => (
                      <Bar key={p.id} id={p.id} name={p.name} value={p.monthlyBill || 0} max={stats.maxBill} cur={stats.cur} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card bg-base-100">
                <div className="card-body">
                  <h2 className="card-title text-base mb-3">По статусам</h2>
                  <div className="space-y-3">
                    <StatusBlock label="Активные" count={stats.active.length} revenue={stats.activeRev} cur={stats.cur} color="text-success" bg="bg-success/10" />
                    <StatusBlock label="Триал" count={stats.trial.length} revenue={stats.trialRev} cur={stats.cur} color="text-warning" bg="bg-warning/10" />
                    <StatusBlock label="Заморожены" count={stats.frozen.length} revenue={stats.frozenRev} cur={stats.cur} color="text-error" bg="bg-error/10" />
                  </div>
                </div>
              </div>
              <div className="card bg-primary text-primary-content">
                <div className="card-body p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Итого / месяц</div>
                  <div className="text-4xl font-extrabold leading-none">{fmt(stats.total)}</div>
                  <div className="text-sm opacity-70 mt-1">{stats.cur}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-base mb-1">Полная таблица счетов</h2>
              <div className="overflow-x-auto">
                <table className="table table-sm table-zebra">
                  <thead>
                    <tr>
                      <th>#</th><th>Партнёр</th>
                      <th className="text-right">Филиалы</th><th className="text-right">Ученики</th>
                      <th>Статус</th><th className="text-right">Счёт / мес</th><th className="text-right">Доля</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.sorted.map((p, i) => {
                      const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
                      const share = stats.total > 0 ? ((p.monthlyBill / stats.total) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={p.id} className="hover">
                          <td className="text-base-content/40 text-xs">{i + 1}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={p.name} size={28} />
                              <Link to={`/main/organizations/${p.id}`} className="font-medium hover:text-primary">{p.name}</Link>
                            </div>
                          </td>
                          <td className="text-right">{fmt(p.branches)}</td>
                          <td className="text-right">{fmt(p.students)}</td>
                          <td><span className={`badge badge-sm ${s.cls}`}>{s.label}</span></td>
                          <td className="text-right font-semibold">{fmt(p.monthlyBill)}</td>
                          <td className="text-right text-xs text-base-content/50">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={5} className="text-right text-sm opacity-60">Итого:</td>
                      <td className="text-right text-primary">{fmt(stats.total)}</td>
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
