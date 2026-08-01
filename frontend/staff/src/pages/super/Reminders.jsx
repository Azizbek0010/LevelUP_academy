import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell, Trash2, ChevronDown, ChevronRight,
  CheckCircle, XCircle, Clock, RefreshCw,
  ListOrdered, History,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { dateShort } from '../../format.js';
import { Card, Metric, FilterPills, StatusBadge, EmptyState } from './_ui.jsx';

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
  if (status === 'sent') return <StatusBadge tone="success">Отправлено</StatusBadge>;
  if (status === 'failed') return <StatusBadge tone="danger">Ошибка</StatusBadge>;
  if (status === 'pending') return <StatusBadge tone="warning">В очереди</StatusBadge>;
  return <StatusBadge>{status}</StatusBadge>;
}

function statusIcon(status) {
  if (status === 'sent') return <CheckCircle size={15} className="text-success" />;
  if (status === 'failed') return <XCircle size={15} className="text-error" />;
  return <Clock size={15} className="text-warning" />;
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
      <FilterPills
        options={[
          { key: 'rules', label: <span className="flex items-center gap-2"><ListOrdered size={14} /> Правила</span> },
          { key: 'history', label: <span className="flex items-center gap-2"><History size={14} /> История</span> },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* Rules tab */}
      {tab === 'rules' && (
        <Card>
          <EmptyState
            icon={Bell}
            title="Автоматические правила скоро"
            hint="Настройка триггеров, шаблонов и расписаний появится в следующем обновлении."
          />
        </Card>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Metric Icon={Bell} tone="neutral" label="Всего" value={totalCount} />
            <Metric Icon={CheckCircle} tone="success" label="Отправлено" value={sentCount} />
            <Metric Icon={XCircle} tone="danger" label="Ошибка" value={failedCount} />
            <Metric Icon={Clock} tone="warning" label="В очереди" value={pendingCount} />
          </div>

          {/* Filter buttons */}
          <FilterPills
            options={[
              { key: 'all', label: 'Все' },
              { key: 'sent', label: 'Отправлено' },
              { key: 'failed', label: 'Ошибка' },
              { key: 'pending', label: 'В очереди' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />

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
            <Card>
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
            </Card>
          )}
        </>
      )}
    </div>
  );
}
