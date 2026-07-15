import { useEffect, useState } from 'react';
import { useChild } from '../child-context.jsx';
import { useChatMessages } from '../queries.js';
import { timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState } from '../components/ui.jsx';

export default function Notifications() {
  const { selectedChild } = useChild();
  const { data } = useChatMessages(`parent:${''}`);

  const messages = data?.data?.messages || [];

  return (
    <>
      <PageHeader title="Уведомления" subtitle="Важные события и оповещения" />

      {messages.length === 0 ? (
        <div className="card bg-base-100">
          <div className="card-body text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔔</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Пока нет уведомлений</h3>
            <p className="text-sm text-base-content/50 max-w-sm mx-auto">
              Здесь будут отображаться уведомления о занятиях, оценках и платежах
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="card bg-base-100 hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={`${msg.sender_first_name || ''} ${msg.sender_last_name || ''}`} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{msg.sender_first_name} {msg.sender_last_name}</span>
                      <span className="text-[11px] opacity-30">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className="text-sm opacity-70 line-clamp-2">{msg.body}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
