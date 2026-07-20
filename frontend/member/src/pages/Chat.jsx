import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import { useChatMessages } from '../queries.js';
import { getSocket } from '../socket.js';
import { timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';

const ROOMS = [
  { key: 'global', label: 'Общий чат', icon: 'globe', desc: 'Чат для всех родителей и сотрудников' },
  { key: 'direct', label: 'От staff', icon: 'chat', desc: 'Личные сообщения от менторов и администраторов' },
];

export default function Chat() {
  const { token, user } = useAuth();
  const { selectedChild } = useChild();
  const [activeRoom, setActiveRoom] = useState('global');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  const roomKey = activeRoom === 'direct' ? `parent:${user?.id}` : 'global';
  const roomInfo = ROOMS.find((r) => r.key === activeRoom);
  const { data, isLoading } = useChatMessages(roomKey);

  useEffect(() => {
    if (data?.data?.messages) {
      setMessages(data.data.messages);
    }
  }, [data]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    socketRef.current = s;
    return () => {};
  }, [token]);

  useEffect(() => {
    if (!socketRef.current) return;
    const s = socketRef.current;
    const event = activeRoom === 'global' ? 'chat:global:message' : 'chat:parent:message';
    const handler = (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    s.on(event, handler);
    return () => s.off(event, handler);
  }, [activeRoom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current || sending) return;
    if (activeRoom !== 'global') return;

    setSending(true);
    socketRef.current.emit('chat:global:send', { body: text }, (res) => {
      setSending(false);
      if (res?.ok) setInput('');
    });
    inputRef.current?.focus();
  }, [input, sending, activeRoom]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = activeRoom === 'global';

  const roleColors = {
    admin: { bg: 'rgba(59,130,246,.1)', text: '#3b82f6', label: 'Админ' },
    mentor: { bg: 'rgba(168,85,247,.1)', text: '#a855f7', label: 'Ментор' },
    parent: { bg: 'rgba(34,197,94,.1)', text: '#22c55e', label: 'Родитель' },
    superadmin: { bg: 'rgba(245,158,11,.1)', text: '#f59e0b', label: 'Super Admin' },
  };

  return (
    <>
      <PageHeader
        title="Чат"
        subtitle={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ''}
      />

      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit shadow-sm">
        {ROOMS.map((r) => (
          <button
            key={r.key}
            onClick={() => { setActiveRoom(r.key); setMessages([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeRoom === r.key
                ? 'bg-primary text-primary-content shadow-sm'
                : 'text-base-content/50 hover:bg-base-200'
            }`}
          >
            <Icon name={r.icon} className="w-4 h-4" />
            {r.label}
          </button>
        ))}
      </div>

      <div className="card bg-base-100 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base-300 bg-base-200/30">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium opacity-60">Онлайн</span>
          <span className="text-[11px] opacity-30 ml-1">· {roomInfo?.desc}</span>
          {activeRoom === 'direct' && (
            <span className="ml-auto text-[11px] opacity-30 bg-base-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Icon name="document-text" className="w-3 h-3" />
              Только чтение
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {isLoading && messages.length === 0 && (
            <div className="text-center py-12">
              <span className="loading loading-dots loading-md text-primary" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <EmptyState icon="chat" title="Пока нет сообщений" message="Начните общение первым" />
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            const role = roleColors[msg.sender_role] || roleColors.parent;
            const showAvatar = idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id;
            const isLastInGroup = idx === messages.length - 1 || messages[idx + 1]?.sender_id !== msg.sender_id;

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 shrink-0">
                  {showAvatar && (
                    <Avatar name={`${msg.sender_first_name || ''} ${msg.sender_last_name || ''}`} size={32} />
                  )}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && !isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[11px] font-semibold opacity-60">
                        {msg.sender_first_name} {msg.sender_last_name}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: role.bg, color: role.text }}
                      >
                        {role.label}
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 relative group ${
                      isMe
                        ? 'bg-primary text-primary-content rounded-br-md shadow-sm'
                        : 'bg-base-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                    {isLastInGroup && (
                      <p className={`text-[10px] mt-1 opacity-30 ${isMe ? 'text-right' : ''}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {canSend && (
          <div className="border-t border-base-300 p-3 bg-base-50">
            <div className="flex gap-2 items-end">
              <input
                ref={inputRef}
                type="text"
                className="input input-bordered flex-1 text-sm rounded-xl"
                placeholder="Введите сообщение..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className={`btn btn-primary btn-circle ${sending ? 'loading' : ''}`}
                onClick={handleSend}
                disabled={!input.trim() || sending}
              >
                <Icon name="paperplane" className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
