import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Building2,
  CircleCheck,
  GraduationCap,
  Sparkles,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { useNotifStore, type NotifKind } from '../stores/notifications';

const ICON: Record<NotifKind, React.ComponentType<{ className?: string }>> = {
  payment: CircleCheck,
  rule: Sparkles,
  'delivery.failed': XCircle,
  branch: Building2,
  student: GraduationCap,
};

const COLOR: Record<NotifKind, string> = {
  payment: 'text-success bg-success/10',
  rule: 'text-primary bg-primary/10',
  'delivery.failed': 'text-error bg-error/10',
  branch: 'text-warning bg-warning/10',
  student: 'text-info bg-info/10',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч`;
  const days = Math.floor(hr / 24);
  return `${days} дн`;
}

export function NotificationsBell(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const items = useNotifStore((s) => s.items);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const markRead = useNotifStore((s) => s.markRead);
  const ensureSeeded = useNotifStore((s) => s.ensureSeeded);

  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  function openNotif(id: string, href?: string) {
    markRead(id);
    setOpen(false);
    if (href) navigate(href);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-square relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Уведомления"
      >
        {unread > 0 ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-error-content text-[10px] font-medium inline-flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 border border-base-300 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Уведомления</div>
              <div className="text-xs text-base-content/50">
                {unread > 0 ? `${unread} непрочитанных` : 'Все прочитано'}
              </div>
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => markAllRead()}
              >
                Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-base-200">
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-base-content/50">
                Уведомлений пока нет
              </div>
            )}
            {items.map((n) => {
              const Icon = ICON[n.kind];
              return (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => openNotif(n.id, n.href)}
                  className={clsx(
                    'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-base-200/60 transition-colors',
                    !n.read && 'bg-primary/[.03]',
                  )}
                >
                  <div className={clsx('inline-flex size-9 rounded-lg items-center justify-center shrink-0', COLOR[n.kind])}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={clsx('text-sm truncate', !n.read && 'font-medium')}>
                        {n.title}
                      </div>
                      <div className="text-[10px] text-base-content/50 shrink-0">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div className="text-xs text-base-content/60 mt-0.5 line-clamp-2">
                      {n.body}
                    </div>
                  </div>
                  {!n.read && (
                    <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
