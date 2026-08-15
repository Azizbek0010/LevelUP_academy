import { useState } from 'react';
import { Bell, GraduationCap, CalendarCheck, Wallet, MessageSquareText, BellRing, ChevronDown } from 'lucide-react';
import { useNotifications } from '../queries.js';
import { timeAgo } from '../format.js';
import {
  C, IconTile, PageHeader, EmptyState, ErrorState, Skeleton, RowSkeleton,
} from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

const ICON_MAP = {
  grade: GraduationCap,
  attendance: CalendarCheck,
  payment: Wallet,
  chat: MessageSquareText,
  system: Bell,
};

const HUE_MAP = {
  grade: 'blue',
  attendance: 'amber',
  payment: 'coral',
  chat: 'violet',
  system: 'lime',
};

const FILTERS = [
  { key: 'all', label: 'notif.filter.all' },
  { key: 'grade', label: 'notif.filter.grade', icon: GraduationCap, hue: 'blue' },
  { key: 'attendance', label: 'notif.filter.attendance', icon: CalendarCheck, hue: 'amber' },
  { key: 'payment', label: 'notif.filter.payment', icon: Wallet, hue: 'coral' },
];

export default function Notifications() {
  const { t } = useI18n();
  const { items, isLoading, isFetchingMore, hasMore, loadMore, error, refetch } = useNotifications();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? items : items.filter((n) => n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  if (error) {
    return (
      <>
        <PageHeader title={t('notif.title')} />
        <div className="k-card">
          <ErrorState message={error.message} onRetry={refetch} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t('notif.title')}
        subtitle={unread > 0 ? t('notif.unread', { count: unread }) : t('notif.allRead')}
      />

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const count = f.key === 'all' ? items.length : items.filter((n) => n.type === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="k-press-sm flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all"
              style={{
                background: isActive ? `${C.lime}1c` : C.card,
                color: isActive ? C.limeDk : C.muted,
                border: `1px solid ${isActive ? C.lime : C.line}`,
              }}
            >
              {f.icon && (
                <IconTile icon={f.icon} hue={f.hue} size={18} radius={6} />
              )}
              {t(f.label)}
              {count > 0 && (
                <span
                  className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? C.lime : C.bg,
                    color: isActive ? '#fff' : C.muted,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <>
          <Skeleton h={56} count={1} />
          <div className="mt-4"><RowSkeleton count={4} height={70} /></div>
        </>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="k-card">
          <EmptyState icon={Bell} hue="violet" title={t('notif.emptyTitle')} text={t('notif.emptyMsg')} />
        </div>
      )}

      {/* Notification Cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((n) => {
            const Icon = ICON_MAP[n.type] || ICON_MAP.system;
            const hue = HUE_MAP[n.type] || 'lime';
            return (
              <div key={n.id} className="k-card k-hover p-4 flex items-start gap-3">
                <div className="relative shrink-0">
                  <IconTile icon={Icon} hue={hue} size={40} />
                  {!n.read && (
                    <span
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2"
                      style={{ background: C.lime, borderColor: C.card }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold truncate" style={{ color: C.text }}>{n.title}</span>
                    {!n.read && (
                      <span
                        className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: `${C.lime}1c`, color: C.limeDk }}
                      >
                        {t('notif.new')}
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: C.muted }}>{n.body}</p>
                  <p className="text-[11px] font-semibold mt-1 flex items-center gap-1" style={{ color: C.muted }}>
                    <BellRing size={12} strokeWidth={2.2} />
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FE-PARENT-PAGINATION: курсорная подгрузка — лента синтезируется из 5 источников на бэке, поэтому "ещё" */}
      {!isLoading && hasMore && filter === 'all' && (
        <div className="text-center mt-4">
          <button
            className="k-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-bold"
            style={{ background: C.bg, color: C.limeDk, border: `1px solid ${C.line}` }}
            onClick={loadMore}
            disabled={isFetchingMore}
          >
            <ChevronDown size={15} strokeWidth={2.6} className={isFetchingMore ? 'animate-bounce' : ''} />
            {isFetchingMore ? t('common.loading') : t('notif.showMore')}
          </button>
        </div>
      )}
    </>
  );
}
