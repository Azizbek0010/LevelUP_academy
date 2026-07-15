import { useState, useMemo } from 'react';
import {
  Check, X, UserPlus, Sparkles, PhoneCall, CheckCircle2, XCircle,
  Inbox, Search, Mail, Phone, RotateCcw, Send, Filter,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLeads, useInvalidate } from '../queries.js';
import { dateShort, LEAD_STATUS } from '../format.js';
import OnboardModal from '../components/OnboardModal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';

const STATUS_ICON = { new: Sparkles, contacted: PhoneCall, onboarded: CheckCircle2, rejected: XCircle };

const TABS = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'contacted', label: 'Связались' },
  { key: 'onboarded', label: 'Онбординг' },
  { key: 'rejected', label: 'Отклонены' },
];

function StatCard({ Icon, tint, title, value }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={18} strokeWidth={2.3} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">{title}</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: leads, isLoading, error } = useLeads();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [onboard, setOnboard] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const counts = useMemo(() => {
    const c = { new: 0, contacted: 0, onboarded: 0, rejected: 0 };
    (leads || []).forEach((l) => { c[l.status] = (c[l.status] || 0) + 1; });
    return c;
  }, [leads]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    setErr('');
    try {
      await api.updateLead(token, id, { status });
      invalidate('leads', 'dashboard');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const matcher = (TABS.find((t) => t.key === tab) || TABS[0]);
  const visible = useMemo(() => {
    return (leads || [])
      .filter((l) => tab === 'all' || l.status === tab)
      .filter((l) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        return (l.centerName || '').toLowerCase().includes(s)
          || (l.name || '').toLowerCase().includes(s)
          || (l.phone || '').toLowerCase().includes(s)
          || (l.email || '').toLowerCase().includes(s);
      });
  }, [leads, tab, q]);

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Заявки с лендинга
            {counts.new > 0 && <span className="badge badge-error">{counts.new} новых</span>}
          </span>
        }
        subtitle="Обработка и онбординг новых учебных центров"
      >
        <button
          className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2"
          onClick={() => setOnboard({})}
        >
          <UserPlus size={17} /> Новый партнёр
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard Icon={Sparkles} tint={{ bg: '#DBEAFE', fg: '#1E40AF' }} title="Новые" value={counts.new || 0} />
        <StatCard Icon={PhoneCall} tint={{ bg: '#FEF3C7', fg: '#92400E' }} title="Связались" value={counts.contacted || 0} />
        <StatCard Icon={CheckCircle2} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Онбординг" value={counts.onboarded || 0} />
        <StatCard Icon={XCircle} tint={{ bg: '#FEE2E2', fg: '#991B1B' }} title="Отклонены" value={counts.rejected || 0} />
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="card bg-base-100 shadow-sm border border-base-200/60">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="join">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`join-item btn btn-sm ${tab === t.key ? 'bg-lime-400 hover:bg-lime-500 border-0 text-lime-950' : 'btn-ghost'}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                    {t.key !== 'all' && counts[t.key] > 0 && (
                      <span className={`badge badge-xs ml-1 ${t.key === 'new' ? 'badge-error' : ''}`}>{counts[t.key]}</span>
                    )}
                  </button>
                ))}
              </div>
              <label className="input input-bordered input-sm flex items-center gap-2 max-w-xs ml-auto">
                <Search size={14} className="text-base-content/40" />
                <input className="grow" placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
              <span className="text-sm opacity-50">{visible.length} заявок</span>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Учебный центр</th>
                    <th>Контакт</th>
                    <th>Телефон / Email</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th className="text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-14">
                        <Inbox size={32} className="mx-auto text-base-content/25 mb-2" />
                        <div className="opacity-50 text-sm">
                          {q || tab !== 'all' ? 'Ничего не найдено' : 'Заявок пока нет'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visible.map((l) => {
                      const s = LEAD_STATUS[l.status] || { label: l.status, cls: 'badge-ghost' };
                      const StatusIcon = STATUS_ICON[l.status];
                      const isBusy = busyId === l.id;
                      return (
                        <tr key={l.id} className="hover">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={l.centerName || l.name} size={36} />
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{l.centerName || '—'}</div>
                                {l.message && (
                                  <div className="text-xs text-base-content/50 truncate max-w-[200px]" title={l.message}>
                                    {l.message}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-sm">{l.name || '—'}</td>
                          <td>
                            <div className="text-sm space-y-0.5">
                              {l.phone && (
                                <div className="flex items-center gap-1.5 text-base-content/80">
                                  <Phone size={11} className="text-base-content/40" />
                                  {l.phone}
                                </div>
                              )}
                              {l.email && (
                                <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                                  <Mail size={11} className="text-base-content/40" />
                                  {l.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap text-sm text-base-content/60">{dateShort(l.createdAt)}</td>
                          <td>
                            <span className={`badge badge-sm gap-1 ${s.cls}`}>
                              {StatusIcon && <StatusIcon size={11} />}
                              {s.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 justify-end">
                              {isBusy ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : l.status === 'onboarded' ? (
                                <span className="text-xs opacity-40">обработана</span>
                              ) : l.status === 'rejected' ? (
                                <button
                                  className="btn btn-xs btn-ghost gap-1"
                                  onClick={() => changeStatus(l.id, 'new')}
                                >
                                  <RotateCcw size={12} /> Восстановить
                                </button>
                              ) : (
                                <>
                                  {l.status === 'new' && (
                                    <button
                                      className="btn btn-xs btn-outline gap-1"
                                      onClick={() => changeStatus(l.id, 'contacted')}
                                    >
                                      <PhoneCall size={12} /> Связались
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-xs bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-1"
                                    onClick={() => setOnboard(l)}
                                  >
                                    <Send size={12} /> Онбордить
                                  </button>
                                  <button
                                    className="btn btn-xs btn-outline btn-error gap-1"
                                    onClick={() => changeStatus(l.id, 'rejected')}
                                  >
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
