import { useState } from 'react';
import { useNotifications } from '../queries.js';
import { timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { EmptyState } from '../components/ui.jsx';
import {
  GraduationCap,
  CalendarCheck,
  Wallet,
  MessageCircle,
  Bell,
  Clock,
  Inbox,
  Filter,
} from 'lucide-react';

const ICON_MAP = {
  grade: GraduationCap,
  attendance: CalendarCheck,
  payment: Wallet,
  chat: MessageCircle,
  system: Bell,
};

const COLOR_MAP = {
  grade: '#3b82f6',
  attendance: '#f59e0b',
  payment: '#ef4444',
  chat: '#a855f7',
  system: '#6b7280',
};

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

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-base-100 p-1 rounded-xl w-fit flex-wrap shadow-sm">
        {[
          { key: 'all', label: 'Все', count: items.length, icon: Inbox },
          { key: 'grade', label: 'Оценки', count: items.filter((n) => n.type === 'grade').length, icon: GraduationCap },
          { key: 'attendance', label: 'Посещаемость', count: items.filter((n) => n.type === 'attendance').length, icon: CalendarCheck },
          { key: 'payment', label: 'Оплата', count: items.filter((n) => n.type === 'payment').length, icon: Wallet },
        ].map((f) => {
          const IconComp = f.icon;
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
              <IconComp className="w-3.5 h-3.5" />
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f.key ? 'bg-white/20' : 'bg-base-200'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="loading loading-dots loading-md text-primary" />
          <p className="text-sm text-base-content/40">Загрузка...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <EmptyState icon="bell" title="Нет уведомлений" message="Здесь будут важные события" />
      )}

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.map((n) => {
          const IconComp = ICON_MAP[n.type] || Bell;
          const color = COLOR_MAP[n.type] || COLOR_MAP.system;
          return (
            <div
              key={n.id}
              className={`card bg-base-100 hover:shadow-md transition-all duration-200 cursor-pointer group ${
                !n.read ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''
              }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${color}12` }}
                  >
                    <IconComp className="w-5 h-5" style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm ${!n.read ? 'font-bold' : 'font-semibold'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-base-content/55 leading-relaxed">{n.body}</p>
                    <p className="text-[11px] text-base-content/30 mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
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
