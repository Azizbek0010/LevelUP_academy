import { useEffect, useState } from 'react';
import { useChild } from '../child-context.jsx';
import { useChatMessages, useNotifications } from '../queries.js';
import { timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState } from '../components/ui.jsx';

const ICONS = {
  grade: '📝',
  attendance: '📅',
  payment: '💰',
  chat: '💬',
  system: '🔔',
};

const COLORS = {
  grade: '#3b82f6',
  attendance: '#f59e0b',
  payment: '#ef4444',
  chat: '#a855f7',
  system: '#6b7280',
};

export default function Notifications() {
  const { selectedChild } = useChild();
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

      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          { key: 'all', label: 'Все', count: items.length },
          { key: 'grade', label: 'Оценки', count: items.filter((n) => n.type === 'grade').length },
          { key: 'attendance', label: 'Посещаемость', count: items.filter((n) => n.type === 'attendance').length },
          { key: 'payment', label: 'Оплата', count: items.filter((n) => n.type === 'payment').length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-primary text-primary-content'
                : 'text-base-content/50 hover:bg-base-200'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className="ml-1 opacity-60">{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <span className="loading loading-dots loading-md text-primary" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <EmptyState icon="🔔" title="Нет уведомлений" message="Здесь будут важные события" />
      )}

      <div className="space-y-2">
        {filtered.map((n) => {
          const icon = ICONS[n.type] || ICONS.system;
          const color = COLORS[n.type] || COLORS.system;
          return (
            <div
              key={n.id}
              className={`card bg-base-100 hover:shadow-md transition-all cursor-pointer ${
                !n.read ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: `${color}12` }}
                  >
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm opacity-60">{n.body}</p>
                    <p className="text-[11px] opacity-30 mt-1">{timeAgo(n.createdAt)}</p>
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
