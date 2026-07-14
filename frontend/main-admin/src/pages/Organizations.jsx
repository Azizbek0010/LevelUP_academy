import { useState } from 'react';
import { Search, Building2, CheckCircle2, Clock, PauseCircle } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, useInvalidate } from '../queries.js';
import { fmt, dateShort, ORG_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';

const STATUS_ICON = { active: CheckCircle2, trial: Clock, frozen: PauseCircle };

export default function Organizations() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, error } = useDashboard(); // тот же ключ, что у дашборда → из кэша
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const partners = data?.partners;
  const cur = data?.totals.currency || 'UZS';

  const toggle = async (p) => {
    const next = p.status === 'frozen' ? 'active' : 'frozen';
    try {
      await api.setPartnerStatus(token, p.id, next);
      invalidate('dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  const rows = (partners || []).filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) || (p.domain || '').includes(q),
  );
  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Партнёры" subtitle="Учебные центры на платформе — филиалы, ученики, счёт и статус" />

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="card bg-base-100">
          <div className="card-body gap-4">
            <label className="input input-bordered input-sm max-w-xs flex items-center gap-2">
              <Search size={14} className="text-base-content/40" />
              <input
                className="grow"
                placeholder="Поиск по названию / домену…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Учебный центр</th><th>Домен</th>
                    <th className="text-right">Филиалы</th><th className="text-right">Ученики</th>
                    <th className="text-right">Счёт/мес ({cur})</th><th>Статус</th><th>Создан</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10">
                      <Building2 size={28} className="mx-auto text-base-content/25 mb-2" />
                      <div className="opacity-50 text-sm">Партнёров нет</div>
                    </td></tr>
                  ) : (
                    rows.map((p) => {
                      const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
                      const StatusIcon = STATUS_ICON[p.status];
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={p.name} size={34} />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="text-base-content/60">{p.domain || '—'}</td>
                          <td className="text-right">{fmt(p.branches)}</td>
                          <td className="text-right">{fmt(p.students)}</td>
                          <td className="text-right font-semibold">{fmt(p.monthlyBill)}</td>
                          <td>
                            <span className={`badge badge-sm gap-1 ${s.cls}`}>
                              {StatusIcon && <StatusIcon size={11} />}
                              {s.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-sm">{dateShort(p.createdAt)}</td>
                          <td className="text-right">
                            <button
                              className={`btn btn-xs ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                              onClick={() => toggle(p)}
                            >
                              {p.status === 'frozen' ? 'Активировать' : 'Заморозить'}
                            </button>
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
    </div>
  );
}
