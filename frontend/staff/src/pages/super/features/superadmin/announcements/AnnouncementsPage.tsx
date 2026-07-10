import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  UserCog,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import {
  announcementsApi,
  type AnnouncementItem,
  type AnnouncementReader,
} from '../../../shared/api/endpoints/announcements';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader, Avatar } from '../../../shared/ui/PageHeader';
import { toast } from '../../../shared/ui/Toast';
import { AnnouncementModal } from './AnnouncementModal';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  return `${days} дн назад`;
}

function targetIcon(type: string): React.ComponentType<{ className?: string }> {
  if (type === 'all-staff') return Users;
  if (type === 'all-admins') return UserCog;
  if (type === 'all-mentors') return ShieldAlert;
  if (type.startsWith('branch:')) return Building2;
  return Megaphone;
}

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'супер-админ',
  admin: 'админ',
  mentor: 'ментор',
};

type ReadTab = 'read' | 'unread';

export default function AnnouncementsPage(): React.ReactElement {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AnnouncementItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readTab, setReadTab] = useState<Record<string, ReadTab>>({});

  const query = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsApi.list(),
  });

  const items = query.data?.items ?? [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => announcementsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Анонс удалён');
      setToDelete(null);
    },
  });

  return (
    <div className="p-8">
      <PageHeader
        icon={Megaphone}
        title="Announcements"
        subtitle="Внутренние объявления для админов и менторов (не для родителей)"
        right={
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2 rounded-lg"
            onClick={() => setOpen(true)}
          >
            <Plus className="size-4" /> Новый анонс
          </button>
        }
      />

      {query.isLoading && (
        <div className="text-center text-base-content/40 text-sm p-10">Загрузка…</div>
      )}

      {!query.isLoading && items.length === 0 && (
        <div className="bg-base-100 border border-base-300 rounded-2xl p-8">
          <EmptyState
            icon={Megaphone}
            title="Анонсов пока нет"
            description="Отправь первый — все получат в Telegram и внутри системы."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm gap-2"
                onClick={() => setOpen(true)}
              >
                <Plus className="size-4" /> Написать анонс
              </button>
            }
          />
        </div>
      )}

      <div className="space-y-3">
        {items.map((a, i) => {
          const Icon = targetIcon(a.targetType);
          const expanded = expandedId === a.id;
          const readPct = a.recipientCount > 0
            ? Math.round((a.readCount / a.recipientCount) * 100)
            : 0;
          const tab = readTab[a.id] ?? 'read';
          const readers = a.readers ?? [];
          const readList = readers.filter((r) => r.readAt).sort((x, y) => (y.readAt ?? '').localeCompare(x.readAt ?? ''));
          const unreadList = readers.filter((r) => !r.readAt);
          return (
            <div
              key={a.id}
              className="bg-base-100 border border-base-300 rounded-2xl chart-rise overflow-hidden"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium leading-tight">{a.title}</div>
                      <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1 flex-wrap">
                        <span>
                          Кому: <span className="font-medium text-base-content/80">{a.targetLabel}</span>
                        </span>
                        <span className="text-base-content/25">·</span>
                        <span>
                          От: <span className="font-medium text-base-content/80">{a.senderName}</span>
                        </span>
                        <span className="text-base-content/25">·</span>
                        <span>{timeAgo(a.sentAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Read progress → кликабельно, разворачивает список */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : a.id)}
                    className={clsx(
                      'group flex items-center gap-3 shrink-0 px-3 py-2 rounded-lg border transition-all',
                      expanded
                        ? 'border-primary bg-primary/5'
                        : 'border-base-300 hover:border-primary/60 hover:bg-base-200/40',
                    )}
                    title="Показать кто прочитал / не прочитал"
                  >
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-base-content/50 font-semibold">
                        Прочитали
                      </div>
                      <div className="text-sm font-bold tabular-nums">
                        {a.readCount} <span className="text-base-content/50 font-normal">/ {a.recipientCount}</span>
                      </div>
                    </div>
                    <div className="w-20 h-1.5 bg-base-300 rounded overflow-hidden">
                      <div
                        className={clsx(
                          'h-full transition-all',
                          readPct >= 80
                            ? 'bg-success'
                            : readPct >= 50
                              ? 'bg-warning'
                              : 'bg-error',
                        )}
                        style={{ width: `${readPct}%` }}
                      />
                    </div>
                    {expanded ? (
                      <ChevronDown className="size-4 text-primary" />
                    ) : (
                      <ChevronRight className="size-4 text-base-content/40 group-hover:text-primary" />
                    )}
                  </button>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm bg-base-200/40 rounded-lg p-3 border border-base-300">
                  {a.body}
                </div>
              </div>

              {/* Разворачиваемый блок: Прочитали / Не прочитали */}
              {expanded && (
                <div className="border-t border-base-300 bg-base-200/30 p-4">
                  <div className="inline-flex items-center rounded-lg border border-base-300 bg-base-100 p-0.5 mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReadTab((s) => ({ ...s, [a.id]: 'read' }))
                      }
                      className={clsx(
                        'px-3 h-7 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5',
                        tab === 'read'
                          ? 'bg-success text-white shadow-sm'
                          : 'text-base-content/60 hover:text-base-content',
                      )}
                    >
                      <Check className="size-3.5" /> Прочитали
                      <span className="tabular-nums opacity-70">· {readList.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReadTab((s) => ({ ...s, [a.id]: 'unread' }))
                      }
                      className={clsx(
                        'px-3 h-7 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5',
                        tab === 'unread'
                          ? 'bg-warning text-white shadow-sm'
                          : 'text-base-content/60 hover:text-base-content',
                      )}
                    >
                      <X className="size-3.5" /> Не прочитали
                      <span className="tabular-nums opacity-70">· {unreadList.length}</span>
                    </button>
                  </div>

                  {tab === 'read' && (
                    <ReaderList
                      list={readList}
                      empty="Никто ещё не прочитал"
                      showRead
                    />
                  )}
                  {tab === 'unread' && (
                    <ReaderList
                      list={unreadList}
                      empty="Все прочитали!"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 px-5 py-2 border-t border-base-300">
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-error hover:bg-error/10 gap-1"
                  onClick={() => setToDelete(a)}
                >
                  <Trash2 className="size-3.5" /> Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnnouncementModal open={open} onClose={() => setOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Удалить анонс?"
        message={
          toDelete
            ? `«${toDelete.title}» будет удалён из истории. Это действие нельзя отменить.`
            : ''
        }
        confirmLabel="Удалить"
        danger
        pending={deleteMut.isPending}
      />
    </div>
  );
}

function onlineTone(iso: string | null): { text: string; cls: string } {
  if (!iso) return { text: 'не заходил', cls: 'text-base-content/40' };
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 5) return { text: 'в сети сейчас', cls: 'text-success' };
  if (min < 60) return { text: `${min} мин назад`, cls: 'text-success' };
  const hr = Math.floor(min / 60);
  if (hr < 24) return { text: `${hr} ч назад`, cls: 'text-warning' };
  const days = Math.floor(hr / 24);
  return { text: `${days} дн назад`, cls: 'text-error' };
}

function ReaderList({
  list,
  empty,
  showRead = false,
}: {
  list: AnnouncementReader[];
  empty: string;
  showRead?: boolean;
}): React.ReactElement {
  if (list.length === 0) {
    return (
      <div className="text-center text-sm text-base-content/40 py-6">
        <span className="font-mono">○</span> {empty}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {list.map((r) => {
        const online = onlineTone(r.lastOnlineAt);
        return (
          <div
            key={r.id}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-base-100 border border-base-300"
          >
            <div className="relative shrink-0">
              <Avatar name={r.name} size="sm" />
              {/* Онлайн-точка если в сети недавно */}
              {r.lastOnlineAt &&
                Date.now() - new Date(r.lastOnlineAt).getTime() < 5 * 60_000 && (
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-base-100" />
                )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate leading-tight">{r.name}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-base-content/50 flex items-center gap-1.5 flex-wrap">
                <span>{ROLE_LABEL[r.role] ?? r.role}</span>
                <span className="text-base-content/25 normal-case">·</span>
                <span className={`normal-case tracking-normal ${online.cls}`}>
                  {online.text}
                </span>
                {showRead && r.readAt && (
                  <>
                    <span className="text-base-content/25 normal-case">·</span>
                    <span className="normal-case tracking-normal text-base-content/40">
                      прочитано {timeAgo(r.readAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
            {r.readAt ? (
              <Check className="size-4 text-success shrink-0" />
            ) : (
              <span className="size-4 rounded-full border-2 border-warning/50 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
