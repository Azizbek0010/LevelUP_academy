import { Link } from 'react-router-dom';
import { Wallet, Building2, GraduationCap, Store, RefreshCw, ArrowRight } from 'lucide-react';
import { fmt, dateShort, LEAD_STATUS } from '../../format.js';
import { useMainDashboard, useMainLeads } from '../../queries.js';
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

export default function MainDashboard() {
  const { data, isLoading, error, refetch } = useMainDashboard();
  const { data: allLeads } = useMainLeads();
  const leads = (allLeads || []).filter((l) => l.status === 'new' || l.status === 'contacted').slice(0, 5);
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
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <PageHeader title="Дашборд платформы" subtitle="Обзор партнёров, дохода и заявок" />
        <button className="btn btn-ghost btn-sm gap-1.5 shrink-0 mt-1" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Обновить
        </button>
      </div>

      {isLoading || !data ? (
        <>
          <SkeletonKpis />
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="card bg-base-100 lg:col-span-2"><div className="card-body"><SkeletonList rows={6} /></div></div>
            <div className="card bg-base-100"><div className="card-body"><SkeletonList rows={5} /></div></div>
          </div>
        </>
      ) : (
        <Loaded data={data} leads={leads} newLeadsCount={newLeadsCount} />
      )}
    </div>
  );
}

function Loaded({ data, leads, newLeadsCount }) {
  const t = data.totals;
  const cur = t.currency;
  const maxBill = Math.max(1, ...data.partners.map((p) => p.monthlyBill || 0));
  const topPartners = [...data.partners].sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0)).slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi Icon={Wallet} tint={{ bg: '#E6F4D7', fg: '#3F6212' }} title="Наш доход / мес" value={fmt(t.ourMonthlyIncome)} unit={cur} />
        <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёры" value={fmt(t.partners)} unit="учебных центров" />
        <Kpi Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Ученики" value={fmt(t.students)} unit="по всем партнёрам" />
        <Kpi Icon={Store} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Филиалы" value={fmt(t.branches)} unit="всего" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="card bg-base-100 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">Доход по партнёрам <span className="text-base-content/40 font-normal text-sm">({cur}/мес)</span></h2>
              <Link to="/main/revenue" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Все <ArrowRight size={13} />
              </Link>
            </div>
            {topPartners.length === 0 ? (
              <p className="text-base-content/40 text-sm py-6 text-center">Пока нет данных</p>
            ) : (
              <div className="space-y-3.5">
                {topPartners.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar name={p.name} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1 gap-2">
                        <Link to={`/main/organizations/${p.id}`} className="truncate font-medium hover:text-primary transition-colors">
                          {p.name}
                        </Link>
                        <span className="font-bold tabular-nums">{fmt(p.monthlyBill)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, ((p.monthlyBill || 0) / maxBill) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between mb-1">
              <h2 className="card-title text-base">Активные заявки</h2>
              <Link to="/main/leads" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                {newLeadsCount > 0 && <span className="badge badge-primary badge-xs mr-1">{newLeadsCount}</span>}
                Все <ArrowRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-base-200 -mb-2">
              {leads.length === 0 ? (
                <p className="text-base-content/40 text-sm py-6 text-center">Активных заявок нет</p>
              ) : (
                leads.map((l) => {
                  const s = LEAD_STATUS[l.status] || { label: l.status, cls: 'badge-ghost' };
                  return (
                    <div key={l.id} className="py-2.5 flex items-center gap-2.5">
                      <Avatar name={l.centerName || l.name} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{l.centerName || l.name}</div>
                        <div className="text-xs text-base-content/50">{dateShort(l.createdAt)}</div>
                      </div>
                      <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {data.partners.length > 0 && (
        <div className="card bg-base-100 mt-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="card-title text-base">Партнёры</h2>
              <Link to="/main/organizations" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Все <ArrowRight size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Учебный центр</th>
                    <th className="text-right">Филиалы</th>
                    <th className="text-right">Ученики</th>
                    <th className="text-right">Счёт/мес</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.partners].sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0)).slice(0, 5).map((p) => {
                    const statusMap = { active: 'badge-success', trial: 'badge-warning', frozen: 'badge-error' };
                    const statusLabel = { active: 'Активен', trial: 'Триал', frozen: 'Заморожен' };
                    return (
                      <tr key={p.id} className="hover">
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={p.name} size={28} />
                            <Link to={`/main/organizations/${p.id}`} className="font-medium hover:text-primary">{p.name}</Link>
                          </div>
                        </td>
                        <td className="text-right">{fmt(p.branches)}</td>
                        <td className="text-right">{fmt(p.students)}</td>
                        <td className="text-right font-semibold">{fmt(p.monthlyBill)}</td>
                        <td><span className={`badge badge-sm ${statusMap[p.status] || 'badge-ghost'}`}>{statusLabel[p.status] || p.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
