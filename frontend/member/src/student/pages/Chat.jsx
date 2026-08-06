import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  Send, ChevronLeft, MessageSquare, Lock, WifiOff, ArrowDown, AlertCircle, Check, Search,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api, USING_MOCKS } from '../api.js';
import { getSocket } from '../../socket.js';
import { C, Avatar, EmptyState } from '../components/ui.jsx';

/**
 * Личная переписка ученика с менторами.
 *
 * Направление строго одно: первым пишет сотрудник, ученик отвечает в уже
 * существующую комнату `dm:<staffId>:<studentId>` (backend: sendDirectMessage /
 * chat.access.listMyThreads). Поэтому:
 *   · список диалогов — GET /api/chat/my-threads (только те, с кем уже писались);
 *   · отправка — сокет `chat:dm:reply` с { staffId, body };
 *   · история — GET /api/chat/:roomKey/messages; прочитано — POST .../read.
 *
 * В мок-режиме отправленное пишется в localStorage напрямую (как StaffChat):
 * сокет-сервера нет, а живущее только в state сообщение исчезало бы при
 * переходе в другой диалог или перезагрузке.
 */

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const MAX_LEN = 4000;

const fullName = (c) => `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Ментор';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

const clock = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/* ── Поле ввода ─────────────────────────────────────────────────────────
   Рендерится всегда, даже когда собеседник не выбран: человек сразу видит,
   где писать, и ему не нужно догадываться по пустому экрану. */
function Composer({ value, onChange, onSend, disabled, sending, placeholder }) {
  const ref = useRef(null);

  // Авто-высота: растёт под текст до потолка, дальше — свой скролл.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [value]);

  const nearLimit = value.length > MAX_LEN - 200;

  return (
    <footer className="shrink-0 px-3 pt-2.5 pb-3" style={{ borderTop: `1px solid ${C.line}` }}>
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          {/* text-base на мобильном — не косметика: Safari на iOS зумит страницу
              при фокусе в поле с шрифтом меньше 16px. */}
          <textarea
            ref={ref}
            rows={1}
            className="w-full resize-none min-h-[2.75rem] max-h-40 text-base sm:text-sm leading-relaxed py-2.5 px-3 rounded-xl outline-none disabled:opacity-60"
            style={{
              border: `1px solid ${C.line}`,
              background: C.bg,
              color: C.text,
            }}
            placeholder={placeholder}
            value={value}
            maxLength={MAX_LEN}
            disabled={disabled}
            aria-label="Текст сообщения"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          {nearLimit && (
            <div className="text-[10px] text-right mt-1 k-num" style={{ color: C.muted }}>
              {value.length} / {MAX_LEN}
            </div>
          )}
        </div>

        <button
          className="k-press shrink-0 grid place-items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ width: 44, height: 44, background: disabled || !value.trim() ? C.line : C.lime, color: '#fff' }}
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
          aria-label="Отправить"
          title="Enter — отправить, Shift+Enter — новая строка"
        >
          {sending ? (
            <span
              className="block rounded-full animate-spin"
              style={{ width: 16, height: 16, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: '#fff' }}
            />
          ) : (
            <Send size={18} strokeWidth={2.4} />
          )}
        </button>
      </div>
    </footer>
  );
}

export default function Chat() {
  const { token, user } = useAuth();
  const meId = user?.id;

  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]); // пришедшие по сокету
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [atBottom, setAtBottom] = useState(true);

  const messagesRef = useRef(null);
  const socketRef = useRef(null);

  const refreshThreads = useCallback(() => {
    api.chatThreads()
      .then((d) => setThreads(d.data))
      .catch(() => {})
      .finally(() => setThreadsLoading(false));
  }, []);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  const loadMessages = useCallback(async (roomKey) => {
    if (!roomKey) {
      setHistoryData(null);
      return;
    }
    setHistoryLoading(true);
    try {
      const d = await api.chatMessages(roomKey);
      setHistoryData(d);
    } catch {
      setHistoryData({ data: { messages: [] } });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;
  const roomKey = activeThread?.room_key ?? null;

  useEffect(() => {
    loadMessages(roomKey);
  }, [roomKey, loadMessages]);

  // История приходит новыми сверху — разворачиваем, живые дописываем в конец.
  const messages = useMemo(() => {
    const history = [...(historyData?.data?.messages ?? [])].reverse();
    const seen = new Set(history.map((m) => m.id));
    const live = liveMessages.filter((m) => m.room_key === roomKey && !seen.has(m.id));
    return [...history, ...live];
  }, [historyData, liveMessages, roomKey]);

  /* Разметка ленты: где новый день, где начало/конец «пачки» одного автора.
     «Своё» определяется по sender_id, а не по роли. */
  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const mine = m.sender_id === meId;
        const sameAs = (other) =>
          other
          && (other.sender_id === meId) === mine
          && Math.abs(new Date(m.created_at) - new Date(other.created_at)) < GROUP_WINDOW_MS;
        const newDay = !prev
          || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
        return {
          m,
          mine,
          newDay,
          groupStart: newDay || !sameAs(prev),
          groupEnd: !sameAs(next)
            || (next
              && new Date(next.created_at).toDateString()
                 !== new Date(m.created_at).toDateString()),
        };
      }),
    [messages, meId],
  );

  // --- сокет: подписка на входящие (режим без моков) ---
  useEffect(() => {
    if (!token || USING_MOCKS) return undefined;

    const s = getSocket(token);
    socketRef.current = s;

    const onMessage = (msg) => {
      setLiveMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      refreshThreads(); // превью и счётчик непрочитанных в списке слева
    };
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('chat:dm:message', onMessage);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    setConnected(s.connected);

    return () => {
      s.off('chat:dm:message', onMessage);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [token, refreshThreads]);

  // На широком экране сразу открываем первый диалог; на узком — мастер-детейл.
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setIsWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (activeId || threads.length === 0) return;
    if (!isWide) return;
    setActiveId(threads[0].id);
  }, [isWide, activeId, threads]);

  // --- отметить прочитанным при открытии диалога ---
  useEffect(() => {
    if (!roomKey) return;
    api.chatMarkRead(roomKey)
      .then(() => refreshThreads())
      .catch(() => {}); // не критично: счётчик непрочитанных — не данные
  }, [roomKey, refreshThreads]);

  // Прокручиваем сам контейнер сообщений, не scrollIntoView (тот дёргает родителей).
  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;
    if (atBottom) box.scrollTop = box.scrollHeight;
  }, [rows.length, roomKey, atBottom]);

  const onScroll = useCallback((e) => {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }, []);

  const scrollToBottom = () => {
    const box = messagesRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  };

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !activeThread || sending) return;

    setSending(true);
    setError('');

    // В мок-режиме сокет-сервера нет — пишем в localStorage, чтобы страницу
    // можно было смотреть без поднятого бэкенда.
    if (USING_MOCKS) {
      const message = {
        id: `local-${Date.now()}`,
        room_key: roomKey,
        sender_id: user?.id ?? 'mock-me',
        sender_role: 'student',
        body,
        created_at: new Date().toISOString(),
      };
      api.mockChatAppend(roomKey, message);
      setLiveMessages((prev) => [...prev, message]);
      refreshThreads();
      setDraft('');
      setAtBottom(true);
      setSending(false);
      return;
    }

    try {
      const s = socketRef.current ?? getSocket(token);
      const ack = await new Promise((resolve) => {
        let done = false;
        const timer = setTimeout(() => {
          if (!done) resolve({ ok: false, error: 'timeout' });
        }, 8000);
        s.emit('chat:dm:reply', { staffId: activeThread.id, body }, (res) => {
          done = true;
          clearTimeout(timer);
          resolve(res ?? { ok: false, error: 'no response' });
        });
      });

      if (!ack.ok) {
        setError(ack.error === 'timeout' ? 'Сервер не отвечает' : 'Сообщение не отправлено');
        return;
      }
      setDraft('');
      setAtBottom(true);
      // Эхо придёт в chat:dm:message, но страхуемся перечитыванием истории —
      // id совпадут, дубля не будет.
      if (ack.roomKey) loadMessages(ack.roomKey);
    } catch {
      setError('Сообщение не отправлено');
    } finally {
      setSending(false);
    }
  }, [draft, activeThread, sending, roomKey, token, user, refreshThreads, loadMessages]);

  const filtered = threads.filter((t) => {
    if (!search.trim()) return true;
    return fullName(t).toLowerCase().includes(search.toLowerCase());
  });
  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);

  return (
    <div
      className="k-card overflow-hidden flex flex-col h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-8.75rem)] min-h-[420px]"
      style={{ background: C.card }}
    >
      {!USING_MOCKS && !connected && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 shrink-0"
          style={{ background: `${C.amber}1c`, borderBottom: `1px solid ${C.amber}3d`, color: C.amber }}
        >
          <WifiOff size={14} className="shrink-0" />
          <span className="text-xs font-semibold">Соединение потеряно — переподключение...</span>
        </div>
      )}

      {/* overflow-hidden обязателен: без него строка грида растёт под контент
          и выдавливает поле ввода за нижний край. */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr]">

        {/* ═══════════ Список диалогов ═══════════ */}
        <aside
          className={`border-r min-w-0 min-h-0 flex-col ${activeId ? 'hidden lg:flex' : 'flex'}`}
          style={{ borderColor: C.line }}
        >
          <div className="px-3 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div className="flex items-baseline justify-between mb-2.5">
              <h1 className="text-[16px] font-extrabold" style={{ color: C.text }}>Сообщения</h1>
              {totalUnread > 0 && (
                <span
                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-full k-num"
                  style={{ background: C.lime, color: '#fff' }}
                >
                  {totalUnread} новых
                </span>
              )}
            </div>
            <div className="relative">
              <Search size={15} strokeWidth={2.4} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени..."
                aria-label="Поиск ментора"
                className="w-full h-9 pl-9 pr-3 rounded-xl text-[13.5px] font-semibold outline-none"
                style={{ background: C.bg, color: C.text, border: `1px solid ${C.line}` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="p-3 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full shrink-0 animate-pulse" style={{ background: C.line }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded animate-pulse" style={{ width: '60%', background: C.line }} />
                      <div className="h-2.5 rounded animate-pulse" style={{ width: '45%', background: C.line }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                hue="lime"
                title={search ? 'Никого не найдено' : 'Переписки пока нет'}
                text={search ? 'Попробуй другое имя.' : 'Когда ментор напишет тебе, диалог появится здесь.'}
              />
            ) : (
              <ul>
                {filtered.map((t) => {
                  const active = activeId === t.id;
                  const unread = t.unread_count ?? 0;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => { setActiveId(t.id); setError(''); setAtBottom(true); }}
                        aria-current={active ? 'true' : undefined}
                        className="k-press-sm w-full text-left px-3 py-3 flex items-start gap-3 transition-colors"
                        style={{
                          background: active ? `${C.lime}1c` : 'transparent',
                          borderLeft: `2px solid ${active ? C.lime : 'transparent'}`,
                        }}
                      >
                        <Avatar name={fullName(t)} size={42} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`text-[14px] truncate ${unread ? 'font-extrabold' : 'font-bold'}`} style={{ color: C.text }}>
                              {fullName(t)}
                            </span>
                            <span className="text-[10px] shrink-0 k-num" style={{ color: C.muted }}>
                              {formatTime(t.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: `${C.blue}14`, color: C.blue }}
                            >
                              Ментор
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className={`text-[12.5px] truncate ${unread ? 'font-semibold' : ''}`} style={{ color: unread ? C.text : C.muted }}>
                              {t.last_message || 'Переписка не начата'}
                            </span>
                            {unread > 0 && (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0 k-num" style={{ background: C.lime, color: '#fff' }}>
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ═══════════ Переписка ═══════════ */}
        <section className={`min-w-0 min-h-0 flex-col ${activeId ? 'flex' : 'hidden lg:flex'}`} style={{ background: C.bg }}>
          {/* Шапка диалога */}
          <header className="shrink-0 px-3 sm:px-4 py-2.5 flex items-center gap-3 min-h-[3.5rem]" style={{ borderBottom: `1px solid ${C.line}`, background: C.card }}>
            {activeThread ? (
              <>
                <button
                  className="k-press-sm lg:hidden shrink-0 grid place-items-center rounded-full"
                  style={{ width: 40, height: 40, background: C.bg, color: C.text }}
                  onClick={() => setActiveId(null)}
                  aria-label="Назад"
                >
                  <ChevronLeft size={22} />
                </button>
                <Avatar name={fullName(activeThread)} size={40} />
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold truncate" style={{ color: C.text }}>{fullName(activeThread)}</div>
                  <div className="text-[11.5px] font-semibold" style={{ color: C.muted }}>Ментор</div>
                </div>
                <span
                  className="ml-auto flex items-center gap-1 text-[11px] font-semibold shrink-0"
                  style={{ color: C.muted }}
                  title="Эту переписку видишь только ты и ментор."
                >
                  <Lock size={12} /> <span className="hidden sm:inline">Личное</span>
                </span>
              </>
            ) : (
              <span className="text-[14px] font-semibold" style={{ color: C.muted }}>Ментор не выбран</span>
            )}
          </header>

          {/* Лента */}
          <div className="relative flex-1 min-h-0">
            <div
              ref={messagesRef}
              onScroll={onScroll}
              className="absolute inset-0 overflow-y-auto px-3 sm:px-5 py-4"
              aria-live="polite"
            >
              {!activeThread ? (
                <div className="h-full grid place-items-center">
                  <EmptyState
                    icon={MessageSquare}
                    hue="lime"
                    title="Выбери диалог"
                    text="Нажми на ментора слева, чтобы открыть переписку."
                  />
                </div>
              ) : historyLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={i % 2 ? 'flex justify-end' : ''}>
                      <div className="animate-pulse h-10 w-2/5 rounded-2xl" style={{ background: C.line }} />
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="h-full grid place-items-center">
                  <EmptyState
                    icon={MessageSquare}
                    hue="lime"
                    title="Пока нет сообщений"
                    text="Ментор скоро напишет тебе."
                  />
                </div>
              ) : (
                rows.map(({ m, mine, newDay, groupStart, groupEnd }) => (
                  <div key={m.id}>
                    {newDay && (
                      <div className="flex justify-center my-4">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-3 py-1"
                          style={{ color: C.muted, background: C.card, border: `1px solid ${C.line}` }}
                        >
                          {formatDayLabel(m.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${mine ? 'justify-end' : 'justify-start'} ${groupEnd ? 'mb-2.5' : 'mb-0.5'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 shadow-sm ${
                          mine ? 'rounded-2xl' : 'rounded-2xl'
                        }`}
                        style={mine
                          ? { background: C.lime, color: '#fff' }
                          : { background: C.card, border: `1px solid ${C.line}`, color: C.text }}
                      >
                        <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">
                          {m.body}
                        </p>
                        {groupEnd && (
                          <span
                            className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 k-num ${
                              mine ? '' : ''
                            }`}
                            style={{ color: mine ? 'rgba(255,255,255,0.75)' : C.muted }}
                          >
                            {clock(m.created_at)}
                            {mine && <Check size={11} strokeWidth={2.6} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Кнопка «вниз» — появляется, только когда лента прокручена вверх */}
            {activeThread && !atBottom && rows.length > 0 && (
              <button
                onClick={scrollToBottom}
                className="k-press absolute bottom-4 right-4 grid place-items-center rounded-full"
                style={{ width: 38, height: 38, background: C.card, color: C.text, border: `1px solid ${C.line}`, boxShadow: '0 4px 12px rgba(18,25,14,0.12)' }}
                aria-label="К последнему сообщению"
              >
                <ArrowDown size={16} />
              </button>
            )}
          </div>

          {error && (
            <div
              className="shrink-0 flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold"
              style={{ color: '#C0392B', background: '#FFF2EF', borderTop: '1px solid #F0D3CC' }}
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Composer
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            disabled={!activeThread}
            sending={sending}
            placeholder={activeThread ? 'Напиши сообщение...' : 'Выбери ментора слева, чтобы написать'}
          />
        </section>
      </div>
    </div>
  );
}
