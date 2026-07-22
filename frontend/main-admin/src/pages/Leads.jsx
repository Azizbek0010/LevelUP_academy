import { useState, useMemo } from 'react';
import {
  X, UserPlus, Sparkles, PhoneCall, CheckCircle2, XCircle,
  Inbox, Search, Mail, Phone, RotateCcw, Send, MessageSquare, Calendar, User,
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

const STEPS = [
  { key: 'new', label: 'Новая', Icon: Sparkles },
  { key: 'contacted', label: 'Связались', Icon: PhoneCall },
  { key: 'onboarded', label: 'Онбординг', Icon: CheckCircle2 },
];

function StatCard({ Icon, tint, title, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 text-left ${
        active ? 'border-lime-400 bg-lime-50/50' : 'bg-base-100 border-base-200/60'
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={19} strokeWidth={2.3} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">{title}</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5">{value}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Leads() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: leads, isLoading, error } = useLeads();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [onboard, setOnboard] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
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
      // если это open detail — обновляем локально сразу
      setSelectedLead((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

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
        <StatCard Icon={Sparkles} tint={{ bg: '#DBEAFE', fg: '#1E40AF' }} title="Новые" value={counts.new || 0} active={tab === 'new'} onClick={() => setTab('new')} />
        <StatCard Icon={PhoneCall} tint={{ bg: '#FEF3C7', fg: '#92400E' }} title="Связались" value={counts.contacted || 0} active={tab === 'contacted'} onClick={() => setTab('contacted')} />
        <StatCard Icon={CheckCircle2} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Онбординг" value={counts.onboarded || 0} active={tab === 'onboarded'} onClick={() => setTab('onboarded')} />
        <StatCard Icon={XCircle} tint={{ bg: '#FEE2E2', fg: '#991B1B' }} title="Отклонены" value={counts.rejected || 0} active={tab === 'rejected'} onClick={() => setTab('rejected')} />
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
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-14">
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
                      return (
                        <tr
                          key={l.id}
                          className="hover cursor-pointer transition-colors"
                          onClick={() => setSelectedLead(l)}
                        >
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={l.centerName || l.name} size={36} />
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{l.centerName || '—'}</div>
                                {l.message && (
                                  <div className="text-xs text-base-content/50 truncate max-w-[220px]" title={l.message}>
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

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onChangeStatus={(status) => changeStatus(selectedLead.id, status)}
          onOnboard={() => { setOnboard(selectedLead); setSelectedLead(null); }}
          busy={busyId === selectedLead.id}
        />
      )}
    </div>
  );
}

function LeadDetail({ lead, onClose, onChangeStatus, onOnboard, busy }) {
  const s = LEAD_STATUS[lead.status] || { label: lead.status, cls: 'badge-ghost' };
  const currentStep = STEPS.findIndex((st) => st.key === lead.status);
  const isRejected = lead.status === 'rejected';
  const isOnboarded = lead.status === 'onboarded';

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-lime-50 to-transparent border-b border-base-200 flex items-start gap-4">
          <Avatar name={lead.centerName || lead.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-xl truncate">{lead.centerName || '—'}</h3>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </div>
            <div className="text-xs text-base-content/50 mt-1 flex items-center gap-1.5">
              <Calendar size={12} /> Подано: {dateShort(lead.createdAt)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Stepper */}
          {!isRejected && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 mb-3">Прогресс</div>
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 transition-colors ${
                          done ? 'bg-lime-400 text-lime-950' : 'bg-base-200 text-base-content/40'
                        } ${active ? 'ring-4 ring-lime-100' : ''}`}>
                          <step.Icon size={15} />
                        </div>
                        <span className={`text-[10.5px] font-semibold ${done ? 'text-lime-700' : 'text-base-content/40'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 -mt-4 ${i < currentStep ? 'bg-lime-400' : 'bg-base-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isRejected && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-center gap-2">
              <XCircle size={16} /> Заявка отклонена — можно восстановить.
            </div>
          )}

          {/* Contacts */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 mb-2">Контакты</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-base-200">
                <User size={16} className="text-base-content/40 shrink-0" />
                <span className="text-sm font-medium">{lead.name || '—'}</span>
              </div>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-lime-400 hover:bg-lime-50/40 transition-colors">
                  <Phone size={16} className="text-base-content/40 shrink-0" />
                  <span className="text-sm font-medium">{lead.phone}</span>
                  <span className="ml-auto text-xs text-lime-600 font-semibold">Позвонить</span>
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-lime-400 hover:bg-lime-50/40 transition-colors">
                  <Mail size={16} className="text-base-content/40 shrink-0" />
                  <span className="text-sm font-medium truncate">{lead.email}</span>
                  <span className="ml-auto text-xs text-lime-600 font-semibold">Написать</span>
                </a>
              )}
            </div>
          </div>

          {/* Message */}
          {lead.message && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1.5">
                <MessageSquare size={12} /> Сообщение
              </div>
              <div className="rounded-xl bg-base-200/60 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                {lead.message}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-base-200 bg-base-100 flex flex-wrap gap-2">
          {busy ? (
            <div className="flex-1 flex items-center justify-center py-2">
              <span className="loading loading-spinner loading-sm" />
            </div>
          ) : isOnboarded ? (
            <span className="text-sm text-base-content/50 py-2 flex-1 text-center">Партнёр уже онбордингован</span>
          ) : isRejected ? (
            <button className="btn btn-outline gap-2 flex-1" onClick={() => onChangeStatus('new')}>
              <RotateCcw size={15} /> Восстановить
            </button>
          ) : (
            <>
              {lead.status === 'new' && (
                <button className="btn btn-outline gap-2" onClick={() => onChangeStatus('contacted')}>
                  <PhoneCall size={15} /> Связались
                </button>
              )}
              <button className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2 flex-1" onClick={onOnboard}>
                <Send size={15} /> Онбордить
              </button>
              <button className="btn btn-outline btn-error gap-2" onClick={() => onChangeStatus('rejected')}>
                <X size={15} /> Отклонить
              </button>
            </>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
