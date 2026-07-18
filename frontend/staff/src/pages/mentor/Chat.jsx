import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  Send, ChevronLeft, MessageSquare, Lock, WifiOff, ArrowDown, AlertCircle, Check,
} from 'lucide-react';
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
 * с бэкенда уже отфильтрованным по правам, поэтому здесь ничего доп.
 * фильтровать не нужно.
 */

/** Подряд идущие сообщения одного автора в пределах этого окна — одна группа. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const MAX_LEN = 4000;

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

const clock = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/* ── Поле ввода ────────────────────────────────────────────────────────────
   Живёт отдельным компонентом и рендерится ВСЕГДА, даже когда собеседник не
   выбран. Раньше вся правая половина при `!activeContact` подменялась
   заглушкой — вместе с полем ввода. Человек открывал «Xabarlar», видел пустой
   экран и делал единственно возможный вывод: писать тут негде.
   Теперь поле на месте и само объясняет, чего не хватает. */
function Composer({ value, onChange, onSend, disabled, sending, placeholder }) {
  const ref = useRef(null);

  // Авто-высота: textarea растёт под текст до потолка, дальше — свой скролл.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const nearLimit = value.length > MAX_LEN - 200;

  return (
    <footer className="shrink-0 border-t border-base-200 bg-base-100 px-3 py-2.5">
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <textarea
            ref={ref}
            rows={1}
            className="textarea textarea-bordered w-full resize-none min-h-[2.75rem] max-h-40 text-sm leading-relaxed py-2.5 disabled:bg-base-200/60"
            placeholder={placeholder}
            value={value}
            maxLength={MAX_LEN}
            disabled={disabled}
            aria-label="Xabar matni"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          {nearLimit && (
            <div className="text-[10px] text-base-content/45 text-right mt-1 tabular-nums">
              {value.length} / {MAX_LEN}
            </div>
          )}
        </div>

        {/* Кнопка отправки.
            DaisyUI в `:disabled` красит и фон, и текст в один тон с alpha 0.2 —
            замерено на живой странице: `oklch(.231 .036 134 / .2)` против
            `oklch(.249 .026 131 / .2)`. Иконка сливалась с подложкой в ровный
            серый кружок, и вся панель ввода читалась как неактивная заглушка.
            Поэтому выключенное состояние переопределяем явно: подложка светлая,
            стрелка — различимо тёмная. */}
        <button
          className="btn btn-primary btn-circle shrink-0 disabled:!bg-base-200 disabled:!text-base-content/50 disabled:!border-base-300"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
          aria-label="Yuborish"
          title="Enter — yuborish, Shift+Enter — yangi qator"
        >
          {sending
            ? <span className="loading loading-spinner loading-xs" />
            : <Send size={17} />}
        </button>
      </div>
    </footer>
  );
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
  const [atBottom, setAtBottom] = useState(true);

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
  // Ссылка обязана быть стабильной: массив стоит в зависимостях эффекта
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

  /* Размечаем ленту один раз: где начинается новый день, где начинается и
     заканчивается «пачка» сообщений одного автора. Раньше каждое сообщение
     было отдельным пузырём с собственным временем — пять реплик подряд
     превращались в пять одинаковых меток и рваный столбик. */
  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const mine = m.sender_role !== 'parent';
        const sameAs = (other) =>
          other
          && (other.sender_role !== 'parent') === mine
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
    [messages],
  );

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
  // пустая заглушка, и страница выглядит так, будто писать негде.
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
    if (!box) return;
    // Не дёргаем ленту вниз, если человек читает старое выше: новое сообщение
    // в этот момент — повод показать кнопку, а не выдернуть страницу из рук.
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
      setDraft('');   // эхо от сервера придёт в chat:dm:message — руками не дописываем
      setAtBottom(true);
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
    <div className="flex-1 min-h-0 flex flex-col bg-base-100">
      {!USING_MOCKS && !connected && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-warning/10 border-b border-warning/25 text-warning shrink-0">
          <WifiOff size={14} className="shrink-0" />
          <span className="text-xs">Aloqa uzildi — qayta ulanmoqda...</span>
        </div>
      )}

      {/* overflow-hidden обязателен: без него строка грида растёт под контент
          и выдавливает поле ввода за нижний край экрана. */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr]">

        {/* ═══════════ Список собеседников ═══════════ */}
        {/* min-w-0 / min-h-0: у элемента грида это по умолчанию `auto`, то есть
            он отказывается сжиматься меньше своего содержимого. Одно длинное
            слово в сообщении или в имени — и колонка распирает страницу вбок. */}
        <aside
          className={`border-r border-base-200 min-w-0 min-h-0 flex-col bg-base-100 ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-3 py-3 border-b border-base-200 shrink-0">
            <div className="flex items-baseline justify-between mb-2.5">
              <h1 className="text-base font-bold">Xabarlar</h1>
              {totalUnread > 0 && (
                <span className="badge badge-primary badge-sm">{totalUnread} yangi</span>
              )}
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Ota-ona yoki o'quvchi..."
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="p-3 space-y-3">
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
                hint={
                  search
                    ? 'Boshqa ism bilan qidirib ko\'ring.'
                    : "Guruhingizdagi o'quvchilarning ota-onalari shu yerda paydo bo'ladi."
                }
              />
            ) : (
              <ul>
                {filtered.map((c) => {
                  const active = activeId === c.id;
                  const unread = c.unread_count ?? 0;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => { setActiveId(c.id); setError(''); setAtBottom(true); }}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors border-l-2 ${
                          active
                            ? 'bg-primary/8 border-primary'
                            : 'border-transparent hover:bg-base-200/60'
                        }`}
                      >
                        <Avatar name={fullName(c)} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`text-sm truncate ${unread ? 'font-bold' : 'font-semibold'}`}>
                              {fullName(c)}
                            </span>
                            <span className="text-[10px] text-base-content/40 shrink-0 tabular-nums">
                              {formatTime(c.last_message_at)}
                            </span>
                          </div>
                          {c.child_names && (
                            <div className="text-[11px] text-base-content/45 truncate mt-0.5">
                              {c.child_names}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2 mt-1">
                            {/* Непрочитанное — плотнее и темнее: список читают
                                боковым зрением, вес важнее цвета. */}
                            <span
                              className={`text-xs truncate ${
                                unread ? 'text-base-content font-medium' : 'text-base-content/50'
                              }`}
                            >
                              {c.last_message || 'Yozishmalar boshlanmagan'}
                            </span>
                            {unread > 0 && (
                              <span className="badge badge-primary badge-sm shrink-0 tabular-nums">
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
        <section
          className={`min-w-0 min-h-0 flex-col bg-base-200/25 ${activeId ? 'flex' : 'hidden md:flex'}`}
        >
          {/* Шапка диалога */}
          <header className="shrink-0 px-3 sm:px-4 py-2.5 border-b border-base-200 bg-base-100 flex items-center gap-3 min-h-[3.5rem]">
            {activeContact ? (
              <>
                <button
                  className="btn btn-ghost btn-sm btn-circle md:hidden shrink-0"
                  onClick={() => setActiveId(null)}
                  aria-label="Orqaga"
                >
                  <ChevronLeft size={18} />
                </button>
                <Avatar name={fullName(activeContact)} />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{fullName(activeContact)}</div>
                  {activeContact.child_names && (
                    <div className="text-[11px] text-base-content/45 truncate">
                      {activeContact.child_names}
                    </div>
                  )}
                </div>
                <span
                  className="ml-auto flex items-center gap-1 text-[11px] text-base-content/40 shrink-0"
                  title="Bu yozishmani faqat siz va ota-ona ko'radi. Administrator ham ko'ra olmaydi."
                >
                  <Lock size={12} /> <span className="hidden sm:inline">Shaxsiy</span>
                </span>
              </>
            ) : (
              <span className="text-sm text-base-content/40">Suhbatdosh tanlanmagan</span>
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
              {!activeContact ? (
                <div className="h-full grid place-items-center">
                  <EmptyState
                    icon={MessageSquare}
                    title="Ota-onani tanlang"
                    hint="Chapdagi ro'yxatdan suhbatdoshni tanlasangiz, yozishma shu yerda ochiladi."
                  />
                </div>
              ) : historyLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={i % 2 ? 'flex justify-end' : ''}>
                      <div className="skeleton h-10 w-2/5 rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="h-full grid place-items-center">
                  <EmptyState
                    icon={MessageSquare}
                    title="Hali xabar yo'q"
                    hint="Birinchi bo'lib yozing — ota-ona bildirishnoma oladi."
                  />
                </div>
              ) : (
                rows.map(({ m, mine, newDay, groupStart, groupEnd }) => (
                  <div key={m.id}>
                    {newDay && (
                      <div className="flex justify-center my-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/45 bg-base-100 border border-base-200 rounded-full px-3 py-1">
                          {formatDayLabel(m.created_at)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${mine ? 'justify-end' : 'justify-start'} ${
                        groupEnd ? 'mb-2.5' : 'mb-0.5'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2 shadow-sm ${
                          mine
                            ? 'bg-primary text-primary-content'
                            : 'bg-base-100 border border-base-200'
                        } ${
                          // «Хвостик» — только у последнего пузыря пачки: так
                          // видно, где реплика закончилась.
                          mine
                            ? `rounded-2xl ${groupStart ? 'rounded-tr-md' : 'rounded-tr-2xl'} ${groupEnd ? 'rounded-br-sm' : 'rounded-br-2xl'}`
                            : `rounded-2xl ${groupStart ? 'rounded-tl-md' : 'rounded-tl-2xl'} ${groupEnd ? 'rounded-bl-sm' : 'rounded-bl-2xl'}`
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {m.body}
                        </p>
                        {/* Время — раз на пачку, а не под каждой строкой. */}
                        {groupEnd && (
                          <span
                            className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 tabular-nums ${
                              mine ? 'text-primary-content/65' : 'text-base-content/40'
                            }`}
                          >
                            {clock(m.created_at)}
                            {mine && <Check size={11} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Кнопка «вниз» — появляется, только когда лента прокручена вверх */}
            {activeContact && !atBottom && rows.length > 0 && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 right-4 btn btn-circle btn-sm bg-base-100 border-base-300 shadow-md"
                aria-label="Oxirgi xabarga o'tish"
              >
                <ArrowDown size={16} />
              </button>
            )}
          </div>

          {error && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 text-xs text-error bg-error/10 border-t border-error/20">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Composer
            value={draft}
            onChange={setDraft}
            onSend={handleSend}
            disabled={!activeContact}
            sending={sending}
            placeholder={
              activeContact
                ? 'Xabar yozing...'
                : "Yozish uchun chapdan ota-onani tanlang"
            }
          />
        </section>
      </div>
    </div>
  );
}
