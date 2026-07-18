import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, ChevronLeft, MessageSquare, Lock, WifiOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth.jsx';
import { api, USING_MOCKS } from '../../api.js';
import { getSocket } from '../../socket.js';
import { useChatContacts, useChatHistory } from '../../queries.js';
import { Avatar, SearchInput, EmptyState } from './_ui.jsx';

/**
 * Личная переписка сотрудника с родителями учеников.
 *
 * Комната — пара `dm:<staffId>:<parentId>`: собеседников ровно двое, никакой
 * третий сотрудник (включая админа) её не видит. Отправка идёт по сокету
 * (`chat:dm:send`), история — обычным REST'ом; список собеседников приходит
 * с бэкенда уже отфильтрованным по правам, поэтому здесь ничего доп. фильтровать
 * не нужно.
 */

const fullName = (c) => `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Bugun';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' });
}

export default function MentorChat() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [liveMessages, setLiveMessages] = useState([]); // пришедшие по сокету
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const messagesRef = useRef(null);
  const socketRef = useRef(null);

  // На широком экране список и переписка видны одновременно, на узком — по
  // очереди (мастер-детейл).
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setIsWide(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { data: contactsData, isLoading: contactsLoading } = useChatContacts();
  // Ссылка обязана быть стабильной: этот массив стоит в зависимостях эффекта
  // авто-выбора ниже, а `?? []` создавал бы новый массив на каждый рендер.
  const contacts = useMemo(() => contactsData?.data ?? [], [contactsData]);

  const activeContact = contacts.find((c) => c.id === activeId) ?? null;
  const roomKey = activeContact?.room_key ?? null;

  const { data: historyData, isLoading: historyLoading } = useChatHistory(roomKey);

  // История приходит новыми сверху — разворачиваем, живые дописываем в конец.
  const messages = useMemo(() => {
    const history = [...(historyData?.data?.messages ?? [])].reverse();
    const seen = new Set(history.map((m) => m.id));
    const live = liveMessages.filter((m) => m.room_key === roomKey && !seen.has(m.id));
    return [...history, ...live];
  }, [historyData, liveMessages, roomKey]);

  // --- сокет: подписка на входящие ---
  useEffect(() => {
    if (!token || USING_MOCKS) return undefined;

    const s = getSocket(token);
    socketRef.current = s;

    const onMessage = (msg) => {
      setLiveMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // превью и счётчик непрочитанных в списке слева
      qc.invalidateQueries({ queryKey: ['chat-contacts'] });
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
  }, [token, qc]);

  // На широком экране сразу открываем первый диалог: иначе правая половина —
  // пустая заглушка без поля ввода, и страница выглядит так, будто писать негде.
  // На узком не трогаем: там сначала список, это осознанный мастер-детейл.
  useEffect(() => {
    if (!isWide || activeId || contacts.length === 0) return;
    setActiveId(contacts[0].id);
  }, [isWide, activeId, contacts]);

  // --- отметить прочитанным при открытии диалога ---
  useEffect(() => {
    if (!roomKey || !token) return;
    api.chatMarkRead(token, roomKey)
      .then(() => qc.invalidateQueries({ queryKey: ['chat-contacts'] }))
      .catch(() => {}); // не критично: счётчик непрочитанных — не данные
  }, [roomKey, token, qc]);

  // Прокручиваем САМ контейнер сообщений, а не через scrollIntoView: тот тянет
  // за собой всех родителей, из-за чего карточка уезжала вверх и шапка диалога
  // с полем поиска оказывались обрезанными.
  useEffect(() => {
    const box = messagesRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length, roomKey]);

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return fullName(c).toLowerCase().includes(q)
      || (c.child_names ?? '').toLowerCase().includes(q);
  });

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !activeContact || sending) return;

    setSending(true);
    setError('');

    // В мок-режиме сокет-сервера нет — показываем локально, чтобы страницу
    // можно было смотреть без поднятого бэкенда.
    if (USING_MOCKS) {
      setLiveMessages((prev) => [...prev, {
        id: `local-${Date.now()}`,
        room_key: roomKey,
        sender_id: user?.id ?? 'mock-me',
        body,
        created_at: new Date().toISOString(),
        sender_role: user?.role ?? 'mentor',
      }]);
      setDraft('');
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
        s.emit('chat:dm:send', { parentId: activeContact.id, body }, (res) => {
          done = true;
          clearTimeout(timer);
          resolve(res ?? { ok: false, error: 'no response' });
        });
      });

      if (!ack.ok) {
        setError(ack.error === 'timeout' ? 'Server javob bermadi' : 'Xabar yuborilmadi');
        return;
      }
      setDraft(''); // эхо от сервера придёт в chat:dm:message — руками не дописываем
    } catch {
      setError('Xabar yuborilmadi');
    } finally {
      setSending(false);
    }
  }, [draft, activeContact, sending, roomKey, token, user]);

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    // Маршрут /chat помечен в Layout как full-page (FULL_PAGE_ROUTES): контейнер
    // отдаёт всю область под верхней панелью и сам задаёт высоту. Поэтому нет ни
    // заголовка страницы, ни отступов — мессенджер занимает экран целиком.
    // Про приватность сообщает замок «Shaxsiy» в шапке диалога.
    <div className="flex-1 min-h-0 flex flex-col bg-base-100">
      {!USING_MOCKS && !connected && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-warning/10 border-b border-warning/25 text-warning shrink-0">
          <WifiOff size={14} className="shrink-0" />
          <span className="text-xs">Aloqa uzildi — qayta ulanmoqda...</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full">

          {/* ---------- Список собеседников ---------- */}
          <aside
            className={`md:col-span-1 border-r border-base-200 min-h-0 flex-col ${
              activeId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3 border-b border-base-200">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Ota-ona yoki o'quvchi..."
              />
              {totalUnread > 0 && (
                <p className="text-[11px] text-base-content/50 mt-2">
                  {totalUnread} ta o'qilmagan xabar
                </p>
              )}
              {/* На узком экране правая панель скрыта, поэтому подсказка «выберите
                  собеседника» оттуда не видна — дублируем её здесь. */}
              {!isWide && contacts.length > 0 && (
                <p className="text-[11px] text-base-content/50 mt-2 md:hidden">
                  Yozish uchun ota-onani tanlang
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {contactsLoading ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton w-11 h-11 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="skeleton h-3 w-2/3" />
                        <div className="skeleton h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={search ? 'Hech kim topilmadi' : "Hozircha ota-onalar yo'q"}
                />
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveId(c.id); setError(''); }}
                    className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors border-b border-base-200/60 ${
                      activeId === c.id ? 'bg-primary/10' : 'hover:bg-base-200/60'
                    }`}
                  >
                    <Avatar name={fullName(c)} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold truncate">{fullName(c)}</span>
                        <span className="text-[10px] text-base-content/40 shrink-0">
                          {formatTime(c.last_message_at)}
                        </span>
                      </div>
                      {c.child_names && (
                        <div className="text-[11px] text-base-content/45 truncate">{c.child_names}</div>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-base-content/55 truncate">
                          {c.last_message || 'Yozishmalar boshlanmagan'}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="badge badge-primary badge-sm shrink-0">{c.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* ---------- Переписка ---------- */}
          <section
            className={`md:col-span-2 lg:col-span-3 min-h-0 flex-col ${
              activeId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {!activeContact ? (
              <div className="flex-1 grid place-items-center">
                <EmptyState
                  icon={MessageSquare}
                  title="Ota-onani tanlang"
                  hint="Yozishmani boshlash uchun chapdagi ro'yxatdan tanlang."
                />
              </div>
            ) : (
              <>
                <header className="px-4 py-3 border-b border-base-200 flex items-center gap-3">
                  <button
                    className="btn btn-ghost btn-sm btn-circle md:hidden"
                    onClick={() => setActiveId(null)}
                    aria-label="Orqaga"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <Avatar name={fullName(activeContact)} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{fullName(activeContact)}</div>
                    {activeContact.child_names && (
                      <div className="text-[11px] text-base-content/45 truncate">
                        {activeContact.child_names}
                      </div>
                    )}
                  </div>
                  <span
                    className="ml-auto flex items-center gap-1 text-[11px] text-base-content/40"
                    title="Bu yozishmani faqat siz va ota-ona ko'radi"
                  >
                    <Lock size={12} /> Shaxsiy
                  </span>
                </header>

                {/* min-h-0 обязателен: у флекс-элемента min-height по умолчанию
                    `auto`, поэтому лента сообщений отказывалась сжиматься и
                    выдавливала футер с полем ввода за границу карточки, где его
                    срезал overflow-hidden. */}
                <div ref={messagesRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 bg-base-200/30">
                  {historyLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={i % 2 ? 'flex justify-end' : ''}>
                          <div className="skeleton h-10 w-2/5 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-base-content/40 text-center">
                      <div>
                        <MessageSquare size={36} className="mx-auto mb-2 opacity-25" />
                        <p className="text-sm">Hali xabar yo'q — birinchi bo'lib yozing</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m, i) => {
                      const mine = m.sender_role !== 'parent';
                      const prev = messages[i - 1];
                      const showDay = !prev
                        || new Date(prev.created_at).toDateString()
                           !== new Date(m.created_at).toDateString();
                      return (
                        <div key={m.id}>
                          {showDay && (
                            <div className="text-center my-3">
                              <span className="text-[10px] uppercase tracking-wide text-base-content/40 bg-base-100 rounded-full px-3 py-1">
                                {formatDayLabel(m.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex mb-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                                mine
                                  ? 'bg-primary text-primary-content rounded-br-sm'
                                  : 'bg-base-100 border border-base-200 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                              <span
                                className={`block text-[10px] mt-0.5 text-right ${
                                  mine ? 'text-primary-content/60' : 'text-base-content/40'
                                }`}
                              >
                                {new Date(m.created_at).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {error && (
                  <div className="px-4 py-2 text-xs text-error bg-error/10 border-t border-error/20">
                    {error}
                  </div>
                )}

                <footer className="p-3 border-t border-base-200 flex items-end gap-2">
                  <textarea
                    rows={1}
                    className="textarea textarea-bordered flex-1 resize-none min-h-[2.75rem] max-h-32 text-sm"
                    placeholder="Xabar yozing..."
                    value={draft}
                    maxLength={4000}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary btn-circle"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                    aria-label="Yuborish"
                  >
                    {sending
                      ? <span className="loading loading-spinner loading-xs" />
                      : <Send size={16} />}
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
