import { useState } from 'react';
import { useNotifications } from '../queries.js';
import { timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';

const ICON_MAP = {
  grade: 'academic',
  attendance: 'calendar-check',
  payment: 'wallet',
  chat: 'chat',
  system: 'bell',
};

const COLOR_MAP = {
  grade: '#3b82f6',
  attendance: '#f59e0b',
  payment: '#ef4444',
  chat: '#a855f7',
  system: '#6b7280',
};

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'grade', label: 'Оценки' },
  { key: 'attendance', label: 'Посещаемость' },
  { key: 'payment', label: 'Оплата' },
];

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const [filter, setFilter] = useState('all');

  const items = data?.data || [];
  const filtered = filter === 'all' ? items : items.filter((n) => n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Уведомления"
        subtitle={unread > 0 ? `${unread} непрочитанных` : 'Все прочитаны'}
      />

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit flex-wrap shadow-sm">
        {FILTERS.map((f) => {
          const count = f.key === 'all' ? items.length : items.filter((n) => n.type === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === f.key
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/50 hover:bg-base-200'
              }`}
            >
              {f.key !== 'all' && (
                <div className="w-2 h-2 rounded-full" style={{ background: COLOR_MAP[f.key] }} />
              )}
              {f.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.key ? 'bg-primary-content/20' : 'bg-base-200'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <span className="loading loading-dots loading-md text-primary" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState icon="bell" title="Нет уведомлений" message="Здесь будут важные события" />
      )}

      {/* Notification Cards */}
      <div className="space-y-2">
        {filtered.map((n) => {
          const iconName = ICON_MAP[n.type] || ICON_MAP.system;
          const color = COLOR_MAP[n.type] || COLOR_MAP.system;
          return (
            <div
              key={n.id}
              className={`card bg-base-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
                !n.read ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}12` }}
                    >
                      <Icon name={iconName} className="w-5 h-5" style={{ color }} />
                    </div>
                    {!n.read && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-base-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{n.title}</span>
                    </div>
                    <p className="text-sm opacity-60">{n.body}</p>
                    <p className="text-[11px] opacity-30 mt-1 flex items-center gap-1">
                      <Icon name="clock" className="w-3 h-3" />
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
