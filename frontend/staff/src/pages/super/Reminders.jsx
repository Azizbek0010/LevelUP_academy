import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Send, Trash2, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Clock, RefreshCw,
  ListOrdered, History,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { dateShort } from '../../format.js';

// ---- Query ----

function useRemindersQuery() {
  const { token, logout } = useAuth();
  const q = useQuery({
    queryKey: ['super-reminders'],
    queryFn: () => api.superReminders(token),
    enabled: !!token,
    refetchInterval: 2000,
  });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

// ---- Status helpers ----

function statusBadge(status) {
  if (status === 'sent') return <span className="badge badge-success badge-sm">Отправлено</span>;
  if (status === 'failed') return <span className="badge badge-error badge-sm">Ошибка</span>;
  if (status === 'pending') return <span className="badge badge-warning badge-sm">В очереди</span>;
  return <span className="badge badge-ghost badge-sm">{status}</span>;
}

function statusIcon(status) {
  if (status === 'sent') return <CheckCircle size={15} className="text-success" />;
  if (status === 'failed') return <XCircle size={15} className="text-error" />;
  return <Clock size={15} className="text-warning" />;
}

// ---- Stat card ----

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-5 flex-row items-center gap-4">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-extrabold tabular-nums">{value}</div>
          <div className="text-xs text-base-content/50">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function SuperReminders() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error } = useRemindersQuery();
  const items = data?.items ?? data?.reminders ?? [];

  const [tab, setTab] = useState('history'); // 'rules' | 'history'
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const deleteMutation = useMutation({
    mutationFn: (id) => api.superDeleteReminder(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-reminders'] }),
  });

  const resendMutation = useMutation({
    mutationFn: (id) => api.superResendReminder(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-reminders'] }),
  });

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = items.filter((item) => {
    return statusFilter === 'all' || item.status === statusFilter;
  });

  const totalCount   = items.length;
  const sentCount    = items.filter((i) => i.status === 'sent').length;
  const failedCount  = items.filter((i) => i.status === 'failed').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Напоминания" subtitle="Автоматические уведомления студентам и родителям" />

      {/* Tabs */}
      <div className="tabs tabs-boxed w-fit">
        <button
          className={`tab gap-2 ${tab === 'rules' ? 'tab-active' : ''}`}
          onClick={() => setTab('rules')}
        >
          <ListOrdered size={14} /> Правила
        </button>
        <button
          className={`tab gap-2 ${tab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setTab('history')}
        >
          <History size={14} /> История
        </button>
      </div>

      {/* Rules tab */}
      {tab === 'rules' && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-16">
            <Bell size={48} className="text-base-content/20 mb-3" />
            <p className="text-base-content/50 text-sm font-medium">
              Автоматические правила скоро
            </p>
            <p className="text-xs text-base-content/30 mt-1">
              Настройка триггеров, шаблонов и расписаний появится в следующем обновлении.
            </p>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Bell}        label="Всего"     value={totalCount}   color="bg-base-200 text-base-content" />
            <StatCard icon={CheckCircle} label="Отправлено" value={sentCount}   color="bg-success/10 text-success" />
            <StatCard icon={XCircle}     label="Ошибка"    value={failedCount}  color="bg-error/10 text-error" />
            <StatCard icon={Clock}       label="В очереди"  value={pendingCount} color="bg-warning/10 text-warning" />
          </div>

          {/* Filter buttons */}
          <div className="join">
            {['all', 'sent', 'failed', 'pending'].map((f) => (
              <button
                key={f}
                className={`join-item btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(f)}
              >
                {f === 'all' ? 'Все' : f === 'sent' ? 'Отправлено' : f === 'failed' ? 'Ошибка' : 'В очереди'}
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : error && error.status !== 401 ? (
            <div className="alert alert-error text-sm"><span>{error.message}</span></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-base-content/40 text-sm">
              Записей не найдено
            </div>
          ) : (
            <div className="card bg-base-100 shadow-sm">
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th className="w-8" />
                      <th>Студент</th>
                      <th>Родитель</th>
                      <th>Сообщение</th>
                      <th>Статус</th>
                      <th>Отправлено</th>
                      <th className="text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const isExpanded = !!expanded[item.id];
                      const studentName = item.studentName ?? item.student_name ?? '—';
                      const parentName  = item.parentName  ?? item.parent_name  ?? '—';
                      const message     = item.message     ?? item.text         ?? '';
                      const sentAt      = item.sentAt      ?? item.sent_at      ?? item.createdAt ?? item.created_at;

                      return [
                        <tr key={item.id} className="hover">
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => toggleExpand(item.id)}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          </td>
                          <td className="text-sm font-medium">{studentName}</td>
                          <td className="text-sm text-base-content/70">{parentName}</td>
                          <td className="max-w-xs">
                            <p className="text-sm text-base-content/70 truncate">{message}</p>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              {statusIcon(item.status)}
                              {statusBadge(item.status)}
                            </div>
                          </td>
                          <td className="text-xs text-base-content/50">
                            {sentAt ? dateShort(sentAt) : '—'}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {item.status === 'failed' && (
                                <button
                                  className="btn btn-ghost btn-xs text-info"
                                  title="Переотправить"
                                  onClick={() => resendMutation.mutate(item.id)}
                                  disabled={resendMutation.isPending}
                                >
                                  <RefreshCw size={13} />
                                </button>
                              )}
                              <button
                                className="btn btn-ghost btn-xs text-error"
                                title="Удалить"
                                onClick={() => deleteMutation.mutate(item.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>,
                        isExpanded && (
                          <tr key={`${item.id}-exp`} className="bg-base-200/40">
                            <td colSpan={7} className="px-6 py-4">
                              <p className="text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                {message || 'Нет текста'}
                              </p>
                            </td>
                          </tr>
                        ),
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
