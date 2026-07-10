import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, ChevronDown, ChevronRight, Clock3, History, Plus, RefreshCw, Trash2, Workflow, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { remindersApi, type ReminderItem } from '../../../shared/api/endpoints/reminders';
import { Badge } from '../../../shared/ui/Badge';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { toast } from '../../../shared/ui/Toast';
import { SendReminderModal } from './SendReminderModal';
import { RulesTab } from './RulesTab';

type StatusFilter = ReminderItem['status'] | 'all';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function RemindersPage(): React.ReactElement {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'rules' | 'history'>('rules');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sendOpen, setSendOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ReminderItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersApi.list(),
    refetchInterval: 2000,
  });

  const items = query.data?.items ?? [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => remindersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Напоминание удалено');
      setToDelete(null);
    },
  });

  const resendMut = useMutation({
    mutationFn: (id: string) => remindersApi.resend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.info('Переотправка поставлена в очередь');
    },
  });

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((r) => r.status === filter);
  }, [items, filter]);

  const sent = items.filter((r) => r.status === 'sent').length;
  const failed = items.filter((r) => r.status === 'failed').length;
  const pending = items.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Уведомления</h1>
          <p className="text-base-content/60 text-sm mt-1">
            Автоматические правила + история отправок
          </p>
        </div>
        {tab === 'history' && (
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setSendOpen(true)}
          >
            <Plus className="size-4" /> Ручная отправка
          </button>
        )}
      </div>

      <div role="tablist" className="tabs tabs-bordered">
        <button
          role="tab"
          className={clsx('tab gap-2', tab === 'rules' && 'tab-active')}
          onClick={() => setTab('rules')}
        >
          <Workflow className="size-4" /> Автоматические правила
        </button>
        <button
          role="tab"
          className={clsx('tab gap-2', tab === 'history' && 'tab-active')}
          onClick={() => setTab('history')}
        >
          <History className="size-4" /> История отправок
        </button>
      </div>

      {tab === 'rules' && <RulesTab />}

      {tab === 'history' && <>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard label="Всего" value={items.length} tone="neutral" icon={Bell} />
        <StatCard label="Отправлено" value={sent} tone="success" icon={CheckCircle2} />
        <StatCard label="Ошибка" value={failed} tone="error" icon={XCircle} />
        <StatCard label="В очереди" value={pending} tone="warning" icon={Clock3} />
      </div>

      <div className="join">
        {(['all', 'sent', 'failed', 'pending'] as const).map((v) => (
          <button
            key={v}
            type="button"
            className={clsx('join-item btn btn-sm', filter === v ? 'btn-primary' : 'btn-ghost')}
            onClick={() => setFilter(v)}
          >
            {v === 'all'
              ? 'Все'
              : v === 'sent'
                ? 'Отправлено'
                : v === 'failed'
                  ? 'Ошибка'
                  : 'В очереди'}
          </button>
        ))}
      </div>

      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th className="w-6"></th>
                <th>Студент</th>
                <th>Родитель</th>
                <th>Сообщение</th>
                <th>Статус</th>
                <th>Отправлено</th>
                <th className="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  expanded={expandedId === r.id}
                  onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  onDelete={() => setToDelete(r)}
                  onResend={() => resendMut.mutate(r.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-base-content/50">
                    Напоминаний нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>}

      <SendReminderModal open={sendOpen} onClose={() => setSendOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Удалить напоминание?"
        message={
          toDelete
            ? `Запись о напоминании студенту "${toDelete.studentName}" будет удалена.`
            : ''
        }
        confirmLabel="Удалить"
        danger
        pending={deleteMut.isPending}
      />
    </div>
  );
}

function ReminderRow({
  reminder,
  expanded,
  onToggle,
  onDelete,
  onResend,
}: {
  reminder: ReminderItem;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onResend: () => void;
}): React.ReactElement {
  const preview =
    reminder.message.length > 60 ? `${reminder.message.slice(0, 60)}…` : reminder.message;

  return (
    <>
      <tr className="hover:bg-base-200/40 align-top cursor-pointer" onClick={onToggle}>
        <td>
          <button type="button" className="btn btn-ghost btn-xs btn-square">
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        </td>
        <td className="font-medium">{reminder.studentName}</td>
        <td className="font-mono text-xs">{reminder.parentPhone}</td>
        <td className="max-w-xs text-sm text-base-content/70 truncate">{preview}</td>
        <td>
          {reminder.status === 'sent' && <Badge variant="success">отправлено</Badge>}
          {reminder.status === 'failed' && (
            <div className="space-y-1">
              <Badge variant="error">ошибка</Badge>
              {reminder.error && (
                <div className="text-xs text-base-content/50 max-w-xs">{reminder.error}</div>
              )}
            </div>
          )}
          {reminder.status === 'pending' && (
            <span className="inline-flex items-center gap-1">
              <Badge variant="warning">в очереди</Badge>
              <span className="loading loading-dots loading-xs" />
            </span>
          )}
        </td>
        <td className="font-mono text-xs">{formatDateTime(reminder.sentAt)}</td>
        <td className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {(reminder.status === 'failed' || reminder.status === 'sent') && (
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={onResend}
                title="Переотправить"
              >
                <RefreshCw className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              className="btn btn-xs btn-ghost text-error hover:bg-error/10"
              onClick={onDelete}
              title="Удалить"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-base-200/30">
          <td colSpan={7} className="p-4">
            <div className="text-xs text-base-content/50 mb-1">Полный текст сообщения:</div>
            <div className="whitespace-pre-wrap text-sm bg-base-100 rounded-lg p-3 border border-base-300">
              {reminder.message}
            </div>
            {reminder.telegramMessageId && (
              <div className="text-xs text-base-content/50 mt-2">
                Telegram message ID: <span className="font-mono">{reminder.telegramMessageId}</span>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: 'success' | 'error' | 'warning' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}): React.ReactElement {
  const toneCls =
    tone === 'success'
      ? 'text-success'
      : tone === 'error'
        ? 'text-error'
        : tone === 'warning'
          ? 'text-warning'
          : 'text-base-content';
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-3">
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className={`text-2xl font-semibold ${toneCls}`}>{value}</div>
      </div>
    </div>
  );
}
