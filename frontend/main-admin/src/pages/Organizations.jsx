import { useState } from 'react';
import { Search, Building2, CheckCircle2, Clock, PauseCircle, UserPlus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, useInvalidate } from '../queries.js';
import { fmt, dateShort, ORG_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import OnboardModal from '../components/OnboardModal.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';

const STATUS_ICON = { active: CheckCircle2, trial: Clock, frozen: PauseCircle };
const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'trial', label: 'Триал' },
  { key: 'frozen', label: 'Заморожены' },
];

export default function Organizations() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, error } = useDashboard();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [err, setErr] = useState('');
  const [onboard, setOnboard] = useState(false);

  const partners = data?.partners || [];
  const cur = data?.totals?.currency || 'UZS';

  const toggle = async (p) => {
    const next = p.status === 'frozen' ? 'active' : 'frozen';
    try {
      await api.setPartnerStatus(token, p.id, next);
      invalidate('dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  const rows = partners.filter((p) => {
    const matchQ = p.name.toLowerCase().includes(q.toLowerCase()) || (p.domain || '').includes(q.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchQ && matchStatus;
  });

  const counts = partners.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Партнёры" subtitle="Учебные центры на платформе — статус, ученики, счёт">
        <button className="btn btn-primary gap-2" onClick={() => setOnboard(true)}>
          <UserPlus size={17} /> Новый партнёр
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="card bg-base-100">
          <div className="card-body gap-4">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="input input-bordered input-sm max-w-xs flex items-center gap-2">
                <Search size={14} className="text-base-content/40" />
                <input
                  className="grow"
                  placeholder="Поиск по названию / домену…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div className="join">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`join-item btn btn-sm ${statusFilter === f.key ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label}
                    {f.key !== 'all' && counts[f.key] ? (
                      <span className="badge badge-xs ml-1">{counts[f.key]}</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <span className="text-sm opacity-40 ml-auto">{rows.length} партнёров</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Учебный центр</th>
                    <th>Домен</th>
                    <th className="text-right">Филиалы</th>
                    <th className="text-right">Ученики</th>
                    <th className="text-right">Счёт/мес ({cur})</th>
                    <th>Статус</th>
                    <th>Создан</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10">
                        <Building2 size={28} className="mx-auto text-base-content/25 mb-2" />
                        <div className="opacity-50 text-sm">
                          {q || statusFilter !== 'all' ? 'Ничего не найдено' : 'Партнёров нет'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => {
                      const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
                      const StatusIcon = STATUS_ICON[p.status];
                      return (
                        <tr key={p.id} className="hover">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={p.name} size={34} />
                              <div>
                                <Link to={`/organizations/${p.id}`} className="font-medium hover:text-primary transition-colors block">
                                  {p.name}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="text-base-content/60 text-sm">{p.domain || '—'}</td>
                          <td className="text-right">{fmt(p.branches)}</td>
                          <td className="text-right">{fmt(p.students)}</td>
                          <td className="text-right font-semibold">{fmt(p.monthlyBill)}</td>
                          <td>
                            <span className={`badge badge-sm gap-1 ${s.cls}`}>
                              {StatusIcon && <StatusIcon size={11} />}
                              {s.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-sm text-base-content/60">{dateShort(p.createdAt)}</td>
                          <td>
                            <div className="flex items-center gap-1.5 justify-end">
                              <Link to={`/organizations/${p.id}`} className="btn btn-xs btn-ghost gap-1">
                                <ArrowRight size={13} />
                              </Link>
                              <button
                                className={`btn btn-xs ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                                onClick={() => toggle(p)}
                              >
                                {p.status === 'frozen' ? 'Актив.' : 'Заморозить'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {onboard && (
        <OnboardModal
          lead={null}
          onClose={() => setOnboard(false)}
          onDone={() => { setOnboard(false); invalidate('leads', 'dashboard'); }}
        />
      )}
    </div>
  );
}
