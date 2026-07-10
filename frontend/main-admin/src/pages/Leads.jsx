import { useState } from 'react';
import { Check, X, UserPlus } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLeads, useInvalidate } from '../queries.js';
import { dateShort, LEAD_STATUS } from '../format.js';
import OnboardModal from '../components/OnboardModal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';

// обработанные заявки уходят из «активных» — они уже в Партнёрах
const VIEWS = [
  { key: 'active', label: 'Активные', match: (s) => s === 'new' || s === 'contacted' },
  { key: 'new', label: 'Новые', match: (s) => s === 'new' },
  { key: 'contacted', label: 'Связались', match: (s) => s === 'contacted' },
  { key: 'onboarded', label: 'Онбординг (→ Партнёры)', match: (s) => s === 'onboarded' },
  { key: 'rejected', label: 'Отклонённые', match: (s) => s === 'rejected' },
  { key: 'all', label: 'Все', match: () => true },
];

export default function Leads() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: leads, isLoading, error } = useLeads();
  const [view, setView] = useState('active');
  const [onboard, setOnboard] = useState(null);
  const [err, setErr] = useState('');

  const changeStatus = async (id, status) => {
    try {
      await api.updateLead(token, id, { status });
      invalidate('leads', 'dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  const matcher = (VIEWS.find((v) => v.key === view) || VIEWS[0]).match;
  const visible = (leads || []).filter((l) => matcher(l.status));
  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Заявки с лендинга" subtitle="Обработка и онбординг новых учебных центров">
        <button className="btn btn-primary gap-2" onClick={() => setOnboard({})}>
          <UserPlus size={17} /> Онбординг партнёра
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <div className="card bg-base-100">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <select className="select select-bordered select-sm" value={view} onChange={(e) => setView(e.target.value)}>
                {VIEWS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
              <span className="text-sm opacity-50 ml-auto">{visible.length} заявок</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Центр / Контакт</th><th>Телефон</th><th>Сообщение</th><th>Статус</th><th>Дата</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={6} className="text-center opacity-50 py-8">
                      {view === 'active' ? 'Активных заявок нет — обработанные ушли в «Партнёры»' : 'Заявок нет'}
                    </td></tr>
                  ) : (
                    visible.map((l) => {
                      const s = LEAD_STATUS[l.status] || { label: l.status, cls: 'badge-ghost' };
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={l.centerName || l.name} size={34} />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{l.centerName || '—'}</div>
                                <div className="text-xs text-base-content/55 truncate">{l.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap">{l.phone}</td>
                          <td className="max-w-[220px] truncate text-sm opacity-70" title={l.message || ''}>{l.message || '—'}</td>
                          <td><span className={`badge badge-sm ${s.cls}`}>{s.label}</span></td>
                          <td className="whitespace-nowrap text-sm">{dateShort(l.createdAt)}</td>
                          <td>
                            <div className="flex items-center gap-1.5 justify-end">
                              {l.status === 'onboarded' ? (
                                <span className="text-xs opacity-40">обработана</span>
                              ) : l.status === 'rejected' ? (
                                <button className="btn btn-xs btn-ghost" onClick={() => changeStatus(l.id, 'new')}>вернуть</button>
                              ) : (
                                <>
                                  <button className="btn btn-xs btn-primary gap-1" onClick={() => setOnboard(l)}>
                                    <Check size={13} /> Принять
                                  </button>
                                  <button className="btn btn-xs btn-outline btn-error gap-1" onClick={() => changeStatus(l.id, 'rejected')}>
                                    <X size={13} /> Отклонить
                                  </button>
                                </>
                              )}
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
          lead={onboard.id ? onboard : null}
          onClose={() => setOnboard(null)}
          onDone={() => { setOnboard(null); invalidate('leads', 'dashboard'); }}
        />
      )}
    </div>
  );
}
