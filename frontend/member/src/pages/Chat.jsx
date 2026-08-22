import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import { useChatMessages, useChatThreads } from '../queries.js';
import { getSocket, useSocketConnected } from '../socket.js';
import Avatar from '../components/Avatar.jsx';
import { EmptyState } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';
import { api } from '../api.js';

const ROOM_INFO = { label: 'Преподаватели', icon: 'academic', desc: 'Личные сообщения с преподавателями ребёнка', color: '#40833B' };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

const ROLE_STYLES = {
  admin: { bg: 'rgba(59,130,246,.12)', text: '#3b82f6', label: 'Админ', icon: 'shield-check' },
  mentor: { bg: 'rgba(168,85,247,.12)', text: '#a855f7', label: 'Учитель', icon: 'academic' },
  parent: { bg: 'rgba(34,197,94,.12)', text: '#22c55e', label: 'Родитель', icon: 'user' },
  seo: { bg: 'rgba(245,158,11,.12)', text: '#f59e0b', label: 'SEO', icon: 'cog' },
};

function MessageBubble({ m, mine, groupStart, groupEnd, showSender }) {
  const role = ROLE_STYLES[m.sender_role] || ROLE_STYLES.parent;
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${groupEnd ? 'mb-3' : 'mb-0.5'}`}>
      {!mine && (
        <div className="w-8 shrink-0 mr-2 self-end">
          {groupEnd ? (
            <Avatar name={`${m.sender_first_name || ''} ${m.sender_last_name || ''}`} size={32} />
          ) : null}
        </div>
      )}
      <div className={`max-w-[82%] sm:max-w-[72%] ${mine ? 'items-end' : 'items-start'}`}>
        {showSender && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-[11px] font-semibold opacity-70">
              {m.sender_first_name} {m.sender_last_name}
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: role.bg, color: role.text }}
            >
              {role.label}
            </span>
          </div>
        )}
        <div
          className={`px-4 py-2.5 ${
            mine
              ? 'bg-primary text-primary-content shadow-md shadow-primary/15'
              : 'bg-base-100 border border-base-200/60 shadow-sm'
          } ${
            mine
              ? `rounded-2xl ${groupStart ? 'rounded-tr-lg' : 'rounded-tr-2xl'} ${groupEnd ? 'rounded-br-md' : 'rounded-br-2xl'}`
              : `rounded-2xl ${groupStart ? 'rounded-tl-lg' : 'rounded-tl-2xl'} ${groupEnd ? 'rounded-bl-md' : 'rounded-bl-2xl'}`
          }`}
        >
          <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
          {groupEnd && (
            <span
              className={`flex items-center justify-end gap-1 text-[10px] mt-1 tabular-nums ${
                mine ? 'text-primary-content/55' : 'text-base-content/35'
              }`}
            >
              {formatTime(m.created_at)}
              {mine && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8.5l3 3 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { token, user } = useAuth();
  const { selectedChild } = useChild();
  const connected = useSocketConnected(token);

  const [activeStaffId, setActiveStaffId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef(null);
  const boxRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: threadsData, isLoading: threadsLoading, refetch: refetchThreads } = useChatThreads();
  const threads = threadsData?.data || [];
  const activeThread = threads.find((thread) => thread.id === activeStaffId) || null;
  const roomKey = activeStaffId && user?.id ? `dm:${activeStaffId}:${user.id}` : null;
  const roomInfo = ROOM_INFO;
  const { data, isLoading, error, refetch } = useChatMessages(roomKey);

  useEffect(() => {
    if (!activeStaffId && threads[0]?.id) setActiveStaffId(threads[0].id);
  }, [activeStaffId, threads]);

  useEffect(() => {
    if (data?.data?.messages) {
      setMessages(data.data.messages);
    }
  }, [data]);

  useEffect(() => {
    if (!roomKey || !token) return;
    api.chatMarkRead(token, roomKey).then(() => refetchThreads()).catch(() => {});
  }, [roomKey, token, refetchThreads]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    socketRef.current = s;
    return () => {};
  }, [token]);

  useEffect(() => {
    if (!socketRef.current || !roomKey) return;
    const s = socketRef.current;
    const event = 'chat:dm:message';
    const handler = (msg) => {
      if (msg.room_key !== roomKey) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.sender_id !== user?.id) {
        api.chatMarkRead(token, roomKey).then(() => refetchThreads()).catch(() => {});
      }
    };
    s.on(event, handler);
    return () => s.off(event, handler);
  }, [roomKey, token, user?.id, refetchThreads]);

  useEffect(() => {
    if (atBottom) {
      const box = boxRef.current;
      if (box) box.scrollTop = box.scrollHeight;
    }
  }, [messages, atBottom]);

  const onScroll = useCallback((e) => {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }, []);

  const scrollToBottom = () => {
    const box = boxRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  };

  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const mine = m.sender_id === user?.id;
        const sameAs = (other) =>
          other
          && other.sender_id === m.sender_id
          && Math.abs(new Date(m.created_at) - new Date(other.created_at)) < GROUP_WINDOW_MS;
        const newDay = !prev
          || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
        return {
          m,
          mine,
          newDay,
          groupStart: newDay || !sameAs(prev),
          groupEnd: !sameAs(next)
            || (next && new Date(next.created_at).toDateString() !== new Date(m.created_at).toDateString()),
        };
      }),
    [messages, user?.id],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current || sending) return;

    setSending(true);
    setSendError('');

    if (activeStaffId) {
      socketRef.current.emit('chat:dm:reply', { staffId: activeStaffId, body: text }, (res) => {
        setSending(false);
        if (res?.ok) {
          setInput('');
          setAtBottom(true);
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } else setSendError(res?.error || 'Сообщение не отправлено. Попробуйте ещё раз.');
      });
    } else setSending(false);
    textareaRef.current?.focus();
  }, [input, sending, activeStaffId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
  }, [input]);

  return (
    <div className="parent-chat-page flex min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-base-100 border-b border-base-200/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${roomInfo?.color}15` }}
          >
            <Icon name={roomInfo?.icon} className="w-5 h-5" style={{ color: roomInfo?.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">
              {activeThread ? `${activeThread.first_name || ''} ${activeThread.last_name || ''}`.trim() : roomInfo.label}
            </h1>
            <p className="text-xs opacity-40 truncate">
              {activeThread ? `Преподаватель${selectedChild?.first_name ? ` · ${selectedChild.first_name}` : ''}` : roomInfo.desc}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-error'}`} />
            <span className="text-[11px] opacity-40">{connected ? 'Онлайн' : 'Оффлайн'}</span>
          </div>
        </div>
      </div>

      {/* Mentor contacts */}
      <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2.5 bg-base-100/50 border-b border-base-200/40">
        {threadsLoading && <div className="skeleton h-9 w-40 rounded-xl" />}
        {!threadsLoading && threads.length === 0 && (
          <span className="py-2 text-xs text-base-content/50">У ребёнка пока нет назначенного преподавателя</span>
        )}
        {threads.map((r) => {
          const isActive = activeStaffId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => { setActiveStaffId(r.id); setMessages([]); setSendError(''); setAtBottom(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                  : 'bg-base-200/40 text-base-content/50 hover:bg-base-200/70 hover:text-base-content/70'
              }`}
            >
              <Avatar name={`${r.first_name || ''} ${r.last_name || ''}`} size={24} />
              <span>{r.first_name} {r.last_name}</span>
              {r.unread_count > 0 && <span className="badge badge-sm">{r.unread_count > 99 ? '99+' : r.unread_count}</span>}
            </button>
          );
        })}
      </div>

      {/* Connection Banner */}
      {!connected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/20 text-warning shrink-0">
          <Icon name="wifi-off" className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-medium">Соединение потеряно — переподключение...</span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={boxRef}
        onScroll={onScroll}
        className={`min-h-0 flex-1 px-3 sm:px-5 py-4 bg-base-200/15 ${rows.length > 0 ? 'overflow-y-auto' : 'overflow-y-hidden'}`}
        aria-live="polite"
      >
        {isLoading && rows.length === 0 && (
          <div className="space-y-4 py-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={i % 2 ? 'flex justify-end' : ''}>
                <div className="skeleton h-12 w-2/5 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && activeStaffId && rows.length === 0 && (
          <div className="h-full grid place-items-center">
            <EmptyState
              icon="chat"
              title="Пока нет сообщений"
              message="Напишите преподавателю — сообщение сразу появится у него в чате"
            />
          </div>
        )}

        {rows.map(({ m, mine, newDay, groupStart, groupEnd }) => {
          const showSender = groupStart && !mine;
          return (
            <div key={m.id}>
              {newDay && (
                <div className="flex justify-center my-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-base-content/40 bg-base-100 border border-base-200/50 rounded-full px-4 py-1.5 shadow-sm">
                    {formatDayLabel(m.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble m={m} mine={mine} groupStart={groupStart} groupEnd={groupEnd} showSender={showSender} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      {!atBottom && rows.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 btn btn-circle btn-sm bg-base-100 border-base-300 shadow-lg z-10 hover:scale-110 transition-transform"
          aria-label="К последнему сообщению"
        >
          <Icon name="chevron-down" className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-base-200/60 bg-base-100 px-3 pt-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        {sendError && <p className="mb-2 text-xs font-medium text-error">{sendError}</p>}
        <div className="flex items-end gap-2.5">
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              className="textarea textarea-bordered w-full resize-none min-h-[2.75rem] max-h-32 text-sm leading-relaxed py-2.5 pr-10 rounded-2xl bg-base-200/30 border-base-200/60 focus:border-primary focus:bg-base-100 transition-colors"
              placeholder={activeStaffId ? 'Напишите преподавателю...' : 'Преподаватель не назначен'}
              value={input}
              maxLength={4000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeStaffId || !connected}
            />
          </div>
          <button
            className={`btn btn-circle shrink-0 transition-all duration-200 ${
              input.trim() && !sending
                ? 'btn-primary shadow-md shadow-primary/25 hover:scale-105'
                : 'btn-disabled'
            }`}
            onClick={handleSend}
            disabled={!input.trim() || sending || !activeStaffId || !connected}
            aria-label="Отправить"
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Icon name="paperplane" className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
