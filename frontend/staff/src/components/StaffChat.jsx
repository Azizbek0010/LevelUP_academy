import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  Send, ChevronLeft, MessageSquare, Lock, WifiOff, ArrowDown, AlertCircle, Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth.jsx';
import { api, USING_MOCKS } from '../api.js';
import { getSocket } from '../socket.js';
import { useChatContacts, useChatHistory } from '../queries.js';
import { Avatar, SearchInput, EmptyState } from '../pages/mentor/_ui.jsx';

/**
 * Личная переписка сотрудника с учениками и их родителями.
 *
 * Комната — пара `dm:<staffId>:<peerId>`: собеседников ровно двое, никакой
 * третий сотрудник её не видит. Отправка идёт по сокету (`chat:dm:send`),
 * история — обычным REST'ом; список собеседников приходит с бэкенда уже
 * отфильтрованным по правам, поэтому здесь ничего доп. фильтровать не нужно.
 *
 * Один компонент на две панели. Ментор и админ отличаются ТОЛЬКО охватом
 * (ментор видит свои группы, админ — весь филиал) и подписями — а охват
 * считает бэкенд (`listStaffContacts`: `g.mentor_id = ...` против
 * `sp.branch_id = ...`). Клиентского различия нет, поэтому и кода два раза
 * быть не должно: в админке он уже жил отдельной копией на 1275 строк, где
 * контакты были выдуманы руками, сокет не подключён вовсе, а «своё/чужое»
 * сообщение определялось не по `sender_id`.
 */

/** Подряд идущие сообщения одного автора в пределах этого окна — одна группа. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const MAX_LEN = 4000;

/* Разница между панелями — только в словах. Держим её одним объектом, чтобы
   не разводить `if (role === 'admin')` по всей разметке. */
const COPY = {
  mentor: {
    searchPlaceholder: "Родитель или ученик...",
    emptyTitle: "Пока нет контактов",
    emptyHint: "Родители учеников вашей группы появятся здесь.",
    pickTitle: 'Выберите собеседника',
    pickHint: "Выберите собеседника из списка слева, чтобы открыть переписку.",
    composerIdle: "Выберите собеседника слева для начала переписки",
    privacyTitle: "Эту переписку видите только вы и собеседник. Администратор не имеет доступа.",
  },
  admin: {
    searchPlaceholder: 'Поиск по имени...',
    emptyTitle: "Пока нет контактов",
    emptyHint: "Менторы, родители и ученики филиала появятся здесь.",
    pickTitle: 'Выберите собеседника',
    pickHint: "Выберите ментора, родителя или ученика из списка слева, чтобы открыть переписку.",
    composerIdle: "Выберите собеседника слева для начала переписки",
    privacyTitle: "Эту переписку видите только вы и собеседник.",
  },
};

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

/* ── Поле ввода ────────────────────────────────────────────────────────────
   Живёт отдельным компонентом и рендерится ВСЕГДА, даже когда собеседник не
   выбран. Раньше вся правая половина при `!activeContact` подменялась
   заглушкой — вместе с полем ввода. Человек открывал «Xabarlar», видел пустой
   экран и делал единственно возможный вывод: писать тут негде.
   Теперь поле на месте и само объясняет, чего не хватает. */
function Composer({ value, onChange, onSend, disabled, sending, placeholder }) {
  const ref = useRef(null);

  // Авто-высота: textarea растёт под текст до потолка, дальше — свой скролл.
  // Полосу прокрутки включаем только по достижении потолка: иначе Chrome
  // рисовал стрелки скролла даже в пустом поле — высота совпадала со
  // scrollHeight ровно, и браузер считал содержимое «переполненным».
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
    // pb с safe-area: на айфонах нижнюю полосу занимает индикатор «домой»,
    // и поле ввода упиралось прямо в него.
    <footer
      className="shrink-0 border-t border-base-200 bg-base-100 px-3 pt-2.5"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          {/* text-base на мобильном — не косметика: Safari на iOS
              принудительно зумит страницу при фокусе в поле с размером
              шрифта меньше 16px, и выйти из этого зума потом нельзя. */}
          <textarea
            ref={ref}
            rows={1}
            className="textarea textarea-bordered w-full resize-none min-h-[2.75rem] max-h-40 text-base sm:text-sm leading-relaxed py-2.5 disabled:bg-base-200/60"
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
            <div className="text-[10px] text-base-content/45 text-right mt-1 tabular-nums">
              {value.length} / {MAX_LEN}
            </div>
          )}
        </div>

        {/* Кнопка отправки.
            DaisyUI в `:disabled` красит и фон, и текст в один тон с alpha 0.2 —
            иконка сливалась с подложкой в ровный серый кружок, и вся панель
            ввода читалась как неактивная заглушка. Поэтому выключенное
            состояние переопределяем явно. */}
        <button
          className="btn btn-primary btn-circle shrink-0 disabled:!bg-base-200 disabled:!text-base-content/50 disabled:!border-base-300"
          onClick={onSend}
          disabled={disabled || sending || !value.trim()}
          aria-label="Отправить"
          title="Enter — отправить, Shift+Enter — новая строка"
        >
          {sending
            ? <span className="loading loading-spinner loading-xs" />
            : <Send size={17} />}
        </button>
      </div>
    </footer>
  );
}

export default function StaffChat({ variant = 'mentor' }) {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const copy = COPY[variant] ?? COPY.mentor;

  /* Идентификатор собеседника из строки запроса: приход из списка учеников
     (`?peer=`) или из карточки контакта в шапке (`?with=`). Именно id, а не
     имя: поиск по имени открывал чужой диалог при тёзках и не находил ничего
     при ином написании. */
  const params = new URLSearchParams(window.location.search);
  const requestedPeerId = params.get('peer') ?? params.get('with');

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
     превращались в пять одинаковых меток и рваный столбик.

     «Своё» определяется по `sender_id`, а не по роли: в админской копии для
     этого использовался индекс сообщения в массиве, и после любой вставки
     реплики съезжали на чужую сторону. */
  const meId = user?.id;
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

  // --- сокет: подписка на входящие ---
  useEffect(() => {
    if (!token || USING_MOCKS) return undefined;

    const s = getSocket(token);
    socketRef.current = s;

    const onMessage = (msg) => {
      setLiveMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      // превью и счётчик непрочитанных в списке слева
      qc.invalidateQueries({ queryKey: ['chat-contacts'] });
      /* И перечитать саму переписку. Дублирует live-состояние намеренно:
         `liveMessages` живёт в компоненте и теряется от любого его пересоздания
         (переподписка, hot-reload, размонтирование при переходе), а сообщение
         после этого всплывало только при следующей загрузке истории — со
         стороны выглядит как «отправил, а видно лишь после перезагрузки».
         Кэш-запрос переживает пересоздание компонента, поэтому показ больше не
         зависит от эфемерного состояния. */
      if (msg?.room_key) {
        qc.invalidateQueries({ queryKey: ['chat-history', msg.room_key] });
      }
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
    if (activeId || contacts.length === 0) return;

    /* Пришли с ?peer=/?with= — открываем именно его, в том числе на телефоне:
       намерение «написать этому человеку» уже выражено, показывать вместо
       диалога список незачем. */
    if (requestedPeerId) {
      const match = contacts.find((c) => c.id === requestedPeerId);
      if (match) { setActiveId(match.id); return; }
    }

    if (!isWide) return;
    setActiveId(contacts[0].id);
  }, [isWide, activeId, contacts, requestedPeerId]);

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

  /* Группировка по типу для отрисовки секций: Менторы → Родители → Ученики.
     В режиме ментора секции не нужны — там только родители и ученики. */
  const groupedSections = useMemo(() => {
    if (variant !== 'admin') return [{ label: null, items: filtered }];
    const order = ['mentor', 'parent', 'student'];
    const labels = { mentor: 'Менторы', parent: 'Родители', student: 'Ученики' };
    const groups = new Map(order.map((t) => [t, []]));
    filtered.forEach((c) => {
      const bucket = groups.get(c.peer_type);
      if (bucket) bucket.push(c);
    });
    return order
      .filter((t) => groups.get(t).length > 0)
      .map((t) => ({ label: labels[t], items: groups.get(t) }));
  }, [filtered, variant]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !activeContact || sending) return;

    setSending(true);
    setError('');

    // В мок-режиме сокет-сервера нет — пишем в localStorage, чтобы страницу
    // можно было смотреть без поднятого бэкенда. Именно localStorage, а не
    // только state: иначе отправленное живёт в памяти компонента и исчезает
    // при переходе на другой чат или перезагрузке.
    if (USING_MOCKS) {
      const message = {
        id: `local-${Date.now()}`,
        room_key: roomKey,
        sender_id: user?.id ?? 'mock-me',
        body,
        created_at: new Date().toISOString(),
        sender_role: user?.role ?? variant,
      };
      api.mockChatAppend(roomKey, message);
      setLiveMessages((prev) => [...prev, message]);
      // Карточка контакта показывает превью последнего сообщения — без этого
      // она до перезагрузки твердит «Yozishmalar boshlanmagan» у диалога, в
      // который только что написали.
      qc.invalidateQueries({ queryKey: ['chat-contacts'] });
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
        s.emit('chat:dm:send', { peerId: activeContact.id, body }, (res) => {
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
      /* Эхо от сервера придёт в chat:dm:message и допишет пузырь, но полагаться
         только на него нельзя: если событие потеряется (обрыв, переподписка),
         своё же сообщение не появится до перезагрузки. Перечитывание истории
         страхует этот случай — id совпадут, дубля не будет. */
      if (ack.roomKey) {
        qc.invalidateQueries({ queryKey: ['chat-history', ack.roomKey] });
      }
    } catch {
      setError('Сообщение не отправлено');
    } finally {
      setSending(false);
    }
  }, [draft, activeContact, sending, roomKey, token, user, qc, variant]);

  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    // Маршрут /chat помечен в Layout как full-page: контейнер отдаёт всю область
    // под верхней панелью и сам задаёт высоту. Поэтому нет ни заголовка
    // страницы, ни отступов — мессенджер занимает экран целиком.
    <div className="flex-1 min-h-0 flex flex-col bg-base-100">
      {!USING_MOCKS && !connected && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-warning/10 border-b border-warning/25 text-warning shrink-0">
          <WifiOff size={14} className="shrink-0" />
          <span className="text-xs">Соединение потеряно — переподключение...</span>
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
              <h1 className="text-base font-bold">Сообщения</h1>
              {totalUnread > 0 && (
                <span className="badge badge-primary badge-sm">{totalUnread} новых</span>
              )}
            </div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={copy.searchPlaceholder}
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
                title={search ? 'Никого не найдено' : copy.emptyTitle}
                hint={search ? "Попробуйте другое имя." : copy.emptyHint}
              />
            ) : (
              <ul>
                {groupedSections.map((section) => (
                  <li key={section.label ?? '__all__'} role="presentation">
                    {/* Заголовок секции — только когда есть label
                        (т.е. admin-режим с несколькими типами). */}
                    {section.label && (
                      <div className="px-3 pt-3 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40">
                          {section.label}
                        </span>
                      </div>
                    )}
                    <ul>
                      {section.items.map((c) => {
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
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                      c.peer_type === 'mentor'
                                        ? 'bg-accent/10 text-accent'
                                        : c.peer_type === 'student'
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-base-200 text-base-content/55'
                                    }`}
                                  >
                                    {c.peer_type === 'mentor' ? 'Ментор' : c.peer_type === 'student' ? 'Ученик' : 'Родитель'}
                                  </span>
                                  {c.child_names && (
                                    <span className="text-[11px] text-base-content/45 truncate">
                                      {c.child_names}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <span
                                    className={`text-xs truncate ${
                                      unread ? 'text-base-content font-medium' : 'text-base-content/50'
                                    }`}
                                  >
                                    {c.last_message || "Переписка не начата"}
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
                  </li>
                ))}
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
                {/* На телефоне это основная кнопка навигации — btn-sm давал
                    32px, вдвое меньше пальца. Комфортный минимум — 44px. */}
                <button
                  className="btn btn-ghost btn-circle md:hidden shrink-0 -ml-1"
                  onClick={() => setActiveId(null)}
                  aria-label="Назад"
                >
                  <ChevronLeft size={22} />
                </button>
                <Avatar name={fullName(activeContact)} />
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{fullName(activeContact)}</div>
                  {activeContact.child_names && (
                    <div className="text-[11px] text-base-content/45 truncate">
                      {activeContact.peer_type === 'mentor'
                        ? activeContact.child_names
                        : activeContact.child_names}
                    </div>
                  )}
                </div>
                <span
                  className="ml-auto flex items-center gap-1 text-[11px] text-base-content/40 shrink-0"
                  title={copy.privacyTitle}
                >
                  <Lock size={12} /> <span className="hidden sm:inline">Личное</span>
                </span>
              </>
            ) : (
              <span className="text-sm text-base-content/40">Собеседник не выбран</span>
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
                    title={copy.pickTitle}
                    hint={copy.pickHint}
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
                    title="Пока нет сообщений"
                    hint="Напишите первым — собеседник получит уведомление."
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
                aria-label="К последнему сообщению"
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
            placeholder={activeContact ? 'Напишите сообщение...' : copy.composerIdle}
          />
        </section>
      </div>
    </div>
  );
}
