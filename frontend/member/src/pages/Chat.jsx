import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { ArrowLeft, MessageSquare, Send, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { useChatThreads, useChatMessages } from '../queries.js';
import { getSocket, useSocketConnected } from '../socket.js';
import { playChatSound } from '../chatSound.js';
import { useI18n, t, getLang } from '../i18n.jsx';
import { Avatar, C, IconTile, EmptyState } from '../student/components/ui.jsx';

/**
 * Чат родителя (2026-08-10, v2). Общий чат убран совсем — родитель общается
 * только в диалогах с сотрудниками центра (менторы/админы), которые ему уже
 * открыли переписку. Сам начать диалог он не может (my-threads).
 */

const GROUP_WINDOW_MS = 5 * 60 * 1000;

const STAFF_ROLE_LABELS = { mentor: 'chat.role.mentor', admin: 'chat.role.admin', superadmin: 'chat.role.superadmin' };

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return t('chat.today');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t('chat.yesterday');
  return d.toLocaleDateString(getLang(), { day: '2-digit', month: 'long', year: 'numeric' });
}

function MessageBubble({ m, mine, groupStart, groupEnd, showSender }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${groupEnd ? 'mb-3' : 'mb-0.5'}`}>
      {!mine && (
        <div className="w-8 shrink-0 mr-2 self-end">
          {groupEnd ? <Avatar name={`${m.sender_first_name || ''} ${m.sender_last_name || ''}`} size={32} /> : null}
        </div>
      )}
      <div className={`max-w-[82%] sm:max-w-[72%] ${mine ? 'items-end' : 'items-start'}`}>
        {showSender && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-[11px] font-semibold" style={{ color: C.muted }}>
              {m.sender_first_name} {m.sender_last_name}
            </span>
          </div>
        )}
        <div
          className={`px-4 py-2.5 ${
            mine
              ? 'shadow-md'
              : 'border border-base-200/60 shadow-sm'
          } ${
            mine
              ? `rounded-2xl ${groupStart ? 'rounded-tr-lg' : 'rounded-tr-2xl'} ${groupEnd ? 'rounded-br-md' : 'rounded-br-2xl'}`
              : `rounded-2xl ${groupStart ? 'rounded-tl-lg' : 'rounded-tl-2xl'} ${groupEnd ? 'rounded-bl-md' : 'rounded-bl-2xl'}`
          }`}
          style={mine ? { background: C.lime, color: '#fff' } : { background: C.card }}
        >
          <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
          {groupEnd && (
            <span
              className={`flex items-center justify-end gap-1 text-[10px] mt-1 tabular-nums ${
                mine ? 'text-white/60' : 'text-base-content/35'
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
  const { t } = useI18n();
  const { token, user } = useAuth();
  const connected = useSocketConnected(token);

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const bottomRef = useRef(null);
  const boxRef = useRef(null);
  const socketRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: threadsData, isLoading: threadsLoading } = useChatThreads();
  const threads = useMemo(() => threadsData?.data || [], [threadsData]);
  const activeThread = useMemo(
    () => threads.find((th) => th.id === activeThreadId) || null,
    [threads, activeThreadId],
  );
  const roomKey = activeThread?.room_key || null;
  const { data, isLoading, error, refetch } = useChatMessages(roomKey);

  useEffect(() => {
    if (data?.data?.messages) setMessages(data.data.messages);
  }, [data]);

  useEffect(() => {
    if (!token) return;
    socketRef.current = getSocket(token);
  }, [token]);

  useEffect(() => {
    if (!socketRef.current || !roomKey) return;
    const s = socketRef.current;
    const handler = (msg) => {
      if (msg.room_key !== roomKey) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (msg.sender_id !== user?.id) playChatSound();
        return [...prev, msg];
      });
    };
    s.on('chat:dm:message', handler);
    return () => s.off('chat:dm:message', handler);
  }, [roomKey, user?.id]);

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
    if (!text || !socketRef.current || !activeThread || sending) return;
    setSending(true);
    socketRef.current.emit('chat:dm:reply', { staffId: activeThread.id, body: text }, (res) => {
      setSending(false);
      if (res?.ok) {
        setInput('');
        setAtBottom(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    });
    textareaRef.current?.focus();
  }, [input, sending, activeThread]);

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

  const backToList = () => {
    setActiveThreadId(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-5rem)] lg:max-w-3xl lg:mx-auto">
      {/* ── Список диалогов ── */}
      {!activeThread ? (
        <>
          <div className="flex items-center gap-3 mb-4">
            <IconTile icon={MessageSquare} hue="violet" size={42} />
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-extrabold leading-none tracking-[-0.02em]" style={{ color: C.text }}>
                {t('chat.mentors')}
              </h1>
              <p className="text-[13px] font-semibold mt-1.5" style={{ color: C.muted }}>{t('chat.mentorsDesc')}</p>
            </div>
          </div>

          <div className="k-card overflow-hidden">
            {threadsLoading ? (
              <div className="p-5 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse" style={{ background: C.line, borderRadius: 12 }} />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <EmptyState
                icon={Users}
                hue="violet"
                title={t('chat.noThreads')}
                text={t('chat.noThreadsMsg')}
              />
            ) : (
              <div className="divide-y" style={{ borderColor: C.line }}>
                {threads.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => { setActiveThreadId(th.id); setMessages([]); setAtBottom(true); }}
                    className="k-press w-full flex items-center gap-3 p-4 text-left hover:bg-black/[0.02]"
                  >
                    <Avatar name={`${th.first_name} ${th.last_name}`} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14.5px] font-extrabold truncate" style={{ color: C.text }}>
                          {th.first_name} {th.last_name}
                        </p>
                        {th.last_message_at && (
                          <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: C.muted }}>
                            {formatTime(th.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] font-semibold truncate mt-0.5" style={{ color: C.muted }}>
                        {th.last_message || t('chat.noMessagesThread')}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1"
                        style={{ background: `${C.violet}1c`, color: C.violet }}
                      >
                        {t(STAFF_ROLE_LABELS[th.staff_role] || 'chat.role.staff')}
                      </span>
                    </div>
                    {th.unread_count > 0 && (
                      <span
                        className="text-[11px] font-extrabold px-2 py-1 rounded-full shrink-0"
                        style={{ background: C.lime, color: '#fff' }}
                      >
                        {th.unread_count}
                      </span>
                    )}
                    <ChevronRight size={16} strokeWidth={2.4} style={{ color: C.muted }} className="shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Открытый диалог ── */
        <>
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 pb-3 mb-1" style={{ borderBottom: `1px solid ${C.line}` }}>
            <button
              onClick={backToList}
              className="k-press-sm w-10 h-10 rounded-xl grid place-items-center shrink-0"
              style={{ background: C.card, color: C.text }}
              aria-label={t('common.back')}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
            <Avatar name={`${activeThread.first_name} ${activeThread.last_name}`} size={40} />
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-extrabold truncate" style={{ color: C.text }}>
                {activeThread.first_name} {activeThread.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-semibold" style={{ color: C.muted }}>
                  {t(STAFF_ROLE_LABELS[activeThread.staff_role] || 'chat.role.staff')}
                </span>
                <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: connected ? '#1F7A3D' : '#C0392B' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#1F7A3D' : '#C0392B' }} />
                  {connected ? t('common.online') : t('common.offline')}
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={boxRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto px-1 py-4"
            aria-live="polite"
          >
            {isLoading && rows.length === 0 && (
              <div className="space-y-4 py-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={i % 2 ? 'flex justify-end' : ''}>
                    <div className="animate-pulse h-12 w-2/5 rounded-2xl" style={{ background: C.line }} />
                  </div>
                ))}
              </div>
            )}

            {error && !isLoading && (
              <div className="h-full grid place-items-center">
                <EmptyState icon={MessageSquare} hue="coral" title={t('common.error')} text={error.message} />
              </div>
            )}

            {!isLoading && !error && rows.length === 0 && (
              <div className="h-full grid place-items-center">
                <EmptyState icon={MessageSquare} hue="blue" title={t('chat.noMessages')} text={t('chat.startDm')} />
              </div>
            )}

            {rows.map(({ m, mine, newDay, groupStart, groupEnd }) => {
              const showSender = groupStart && !mine;
              return (
                <div key={m.id}>
                  {newDay && (
                    <div className="flex justify-center my-5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full"
                        style={{ color: C.muted, background: C.bg, border: `1px solid ${C.line}` }}
                      >
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

          {!atBottom && rows.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-4 btn btn-circle btn-sm bg-base-100 border-base-300 shadow-lg z-10 hover:scale-110 transition-transform"
              aria-label={t('chat.toLast')}
            >
              <ChevronRight size={16} className="rotate-90" />
            </button>
          )}

          {/* Input */}
          <div
            className="shrink-0 border-t px-1 pt-3"
            style={{ borderColor: C.line, paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-end gap-2.5">
              <div className="flex-1 min-w-0 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="w-full resize-none min-h-[2.75rem] max-h-32 text-sm leading-relaxed py-2.5 px-4 rounded-2xl focus:outline-none"
                  style={{ background: C.card, border: `1px solid ${C.line}`, color: C.text }}
                  placeholder={t('chat.placeholderDm')}
                  value={input}
                  maxLength={4000}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button
                className={`k-press w-12 h-12 rounded-2xl grid place-items-center shrink-0 transition-all duration-200 ${
                  input.trim() && !sending ? '' : 'opacity-40'
                }`}
                style={input.trim() && !sending ? { background: C.lime, color: '#fff' } : { background: C.line, color: C.muted }}
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label={t('common.send')}
              >
                {sending ? <span className="loading loading-spinner loading-sm" /> : <Send size={20} strokeWidth={2.4} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
