import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import { useChatMessages } from '../queries.js';
import { getSocket } from '../socket.js';
import { datetimeShort, timeAgo } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import { EmptyState } from '../components/ui.jsx';

const ROOMS = [
  { key: 'global', label: 'Общий чат', icon: '🌐' },
  { key: 'direct', label: 'От staff', icon: '💬' },
];

export default function Chat() {
  const { token, user } = useAuth();
  const { selectedChild } = useChild();
  const [activeRoom, setActiveRoom] = useState('global');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const inputRef = useRef(null);

  const roomKey = activeRoom === 'direct' ? `parent:${user?.id}` : 'global';
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

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setConnected(true);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
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

  return (
    <>
      <PageHeader
        title="Чат"
        subtitle={selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ''}
      />

      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit">
        {ROOMS.map((r) => (
          <button
            key={r.key}
            onClick={() => { setActiveRoom(r.key); setMessages([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeRoom === r.key
                ? 'bg-primary text-primary-content shadow-sm'
                : 'text-base-content/50 hover:bg-base-200'
            }`}
          >
            <span className="mr-1.5">{r.icon}</span>
            {r.label}
          </button>
        ))}
      </div>

      <div className="card bg-base-100 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-base-300 bg-base-200/30">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-error'}`} />
          <span className="text-xs font-medium opacity-60">
            {connected ? 'Онлайн' : 'Отключено'}
          </span>
          {activeRoom === 'direct' && (
            <span className="ml-auto text-[11px] opacity-30">Только чтение</span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {isLoading && messages.length === 0 && (
            <div className="text-center py-12">
              <span className="loading loading-dots loading-md text-primary" />
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <EmptyState icon="💬" title="Пока нет сообщений" message="Начните общение первым" />
          )}

          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} animate-[fadeIn_.2s_ease]`}>
                <Avatar
                  name={`${msg.sender_first_name || ''} ${msg.sender_last_name || ''}`}
                  size={34}
                />
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <p className="text-[11px] font-semibold mb-1 opacity-50 px-1">
                      {msg.sender_first_name} {msg.sender_last_name}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-primary text-primary-content rounded-br-md shadow-sm'
                        : 'bg-base-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                  </div>
                  <p className={`text-[10px] mt-1 opacity-30 px-1 ${isMe ? 'text-right' : ''}`}>
                    {timeAgo(msg.created_at)}
                  </p>
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
                placeholder={connected ? 'Введите сообщение...' : 'Подключение...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!connected}
              />
              <button
                className={`btn btn-primary btn-circle ${sending ? 'loading' : ''}`}
                onClick={handleSend}
                disabled={!connected || !input.trim() || sending}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
