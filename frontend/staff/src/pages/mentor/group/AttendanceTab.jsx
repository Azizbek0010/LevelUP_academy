import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Check, X, Minus, Users, Coins, CheckCircle, XCircle, Cloud, CloudOff, Loader2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useMentorGroupStudents, useMentorAttendance, useMentorCoinBudget } from '../../../queries.js';
import { useAuth } from '../../../auth.jsx';
import { api } from '../../../api.js';
import { useAttendanceLive, markAttendanceSocket } from '../../../socket.js';
import { USING_MOCKS } from '../../../api.js';
import { Avatar, EmptyState } from '../_ui.jsx';

/**
 * Журнал одной группы: дни занятий по горизонтали, ученики по вертикали.
 *
 * Кнопки «Сохранить» нет — отметка уходит на сервер сама, пачкой, через
 * короткую паузу после последнего клика. Ментор отмечает журнал во время
 * урока, и заставлять его помнить про сохранение — верный способ потерять
 * данные: ушёл со страницы, не нажав, и работы как не бывало.
 *
 * Клетка переключается keldi ⇄ kelmadi. Вернуть её в «не отмечено» нельзя:
 * бэкенд принимает только present/absent/late/excused и не умеет удалять
 * запись (DELETE-эндпоинта нет). Раньше третий клик очищал клетку локально —
 * выглядело как снятие отметки, но на сервер это не уезжало и после
 * перезагрузки отметка возвращалась.
 */

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

/** Пауза после последнего клика, по истечении которой уходит пачка. */
const AUTOSAVE_DELAY = 700;

const WEEKDAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const pad = (n) => String(n).padStart(2, '0');

/** «Emirxan Ergashev» → «Emirxan.E»: в колонку шириной 68px имя целиком не лезет. */
function shortName(full) {
  if (!full) return '';
  const [first, last] = full.split(' ');
  return last ? `${first}.${last[0]}` : first;
}

/* Полоса месяцев: полгода назад и три вперёд от текущего. Прошлые нужны для
   правок задним числом, будущие — чтобы заранее открыть журнал. */
function buildMonthStrip(base) {
  const list = [];
  for (let offset = -6; offset <= 3; offset += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    list.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return list;
}

function Toast({ message, type = 'success', visible, onClose }) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;
  const ok = type === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-slide-up"
    >
      <div
        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg border min-w-[240px] ${
          ok ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'
        }`}
      >
        {ok ? <CheckCircle size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  );
}

/* ── Состояние автосохранения ─────────────────────────────────────────────
   Ошибка — единственное состояние, требующее внимания, поэтому только она
   заметна и кликабельна. Остальные тихие: сохранение не событие, а фон. */
function SaveIndicator({ state, onRetry }) {
  if (state === 'idle') return null;

  if (state === 'error') {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-semibold text-error hover:underline"
      >
        <CloudOff size={14} /> Saqlanmadi — qayta urinish
      </button>
    );
  }

  const view = {
    pending: { Icon: Loader2, text: 'Saqlanmoqda...', spin: true },
    saving: { Icon: Loader2, text: 'Saqlanmoqda...', spin: true },
    saved: { Icon: Cloud, text: 'Saqlandi', spin: false },
  }[state];

  return (
    <span className="flex items-center gap-1.5 text-xs text-base-content/45">
      <view.Icon size={13} className={view.spin ? 'animate-spin' : ''} />
      {view.text}
    </span>
  );
}

export default function AttendanceTab({ groupId, group }) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const now = useMemo(() => new Date(), []);
  const today = now.toISOString().split('T')[0];

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [coinDrafts, setCoinDrafts] = useState({});   // studentId -> строка из инпута
  const [coinBusyId, setCoinBusyId] = useState(null);

  // idle | pending | saving | saved | error — состояние автосохранения
  const [saveState, setSaveState] = useState('idle');
  const pendingRef = useRef(new Map());   // dateKey -> Map(studentId -> status)
  const flushTimer = useRef(null);
  // Синхронное зеркало attendanceMap — нужно обработчику клика, см. toggleDay.
  const mapRef = useRef({});

  const monthStrip = useMemo(() => buildMonthStrip(now), [now]);

  const { data: rosterData, isLoading: rosterLoading } = useMentorGroupStudents(groupId);
  // Зависимость — САМ rosterData (он стабилен из react-query). Литерал `?? []`
  // пересоздавался бы каждый рендер, и эффект с setAttendanceMap ниже уходил
  // в бесконечный цикл «Maximum update depth exceeded».
  const students = useMemo(
    () =>
      (rosterData?.data || []).map((s) => ({
        ...s,
        first_name: s.first_name ?? s.firstName,
        last_name: s.last_name ?? s.lastName,
        coin_balance: s.coin_balance ?? s.coinBalance ?? 0,
        coins_today: s.coins_today ?? s.coinsToday ?? 0,
      })),
    [rosterData],
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  /* Только дни, когда у группы есть занятие.
     Показывать все 31 число было и бессмысленно (в 22 из них урока нет), и
     вредно: колонки не помещались на экран и загоняли таблицу в
     горизонтальную прокрутку. У English B1, например, занятия по пн и ср —
     это 9 колонок вместо 31, и они спокойно влезают.
     Если расписания у группы нет, показываем месяц целиком — иначе журнал
     оказался бы пустым и отметить было бы нечего. */
  const lessonWeekdays = useMemo(() => {
    const days = (group?.schedule ?? [])
      .map((s) => WEEKDAY_INDEX[String(s.day).toLowerCase()])
      .filter((d) => d !== undefined);
    return days.length ? new Set(days) : null;
  }, [group]);

  const DAYS = useMemo(() => {
    const all = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    if (!lessonWeekdays) return all;
    return all.filter((d) => lessonWeekdays.has(new Date(year, month, d).getDay()));
  }, [daysInMonth, lessonWeekdays, year, month]);

  const from = `${year}-${pad(month + 1)}-01`;
  const to = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`;
  const { data: attendanceData } = useMentorAttendance(groupId, { from, to });
  const attendance = useMemo(() => attendanceData?.data || [], [attendanceData]);

  const { data: budgetData } = useMentorCoinBudget(groupId);
  const budget = budgetData?.data ?? null;

  /* Кто отметил каждый день. Берём первую запись за дату: журнал заполняет
     один человек за урок, а если подменял другой — важен сам факт, что это
     не постоянный преподаватель, а не поимённый разбор по ученикам. */
  const markedByByDate = useMemo(() => {
    const map = {};
    attendance.forEach((r) => {
      const day = String(r.lesson_date ?? '').slice(0, 10);
      if (!day || map[day]) return;
      const name = `${r.marked_by_first_name ?? ''} ${r.marked_by_last_name ?? ''}`.trim();
      if (name) map[day] = name;
    });
    return map;
  }, [attendance]);

  const markedByFor = useCallback((dateKey) => markedByByDate[dateKey] ?? '', [markedByByDate]);

  /* Живые обновления: журнал этой группы отметили в другом месте — второй
     ментор, админ или тот же ментор со второго устройства.

     Событие уже несёт сохранённые записи, поэтому применяем их прямо в
     таблицу. Раньше здесь стоял invalidateQueries: событие приходило С
     ДАННЫМИ, а клиент всё равно шёл за теми же данными по HTTP — лишний круг
     и заметная пауза между «коллега отметил» и «я это увидел». */
  useAttendanceLive(token, groupId, useCallback((payload) => {
    const incoming = payload?.records ?? [];
    if (incoming.length === 0) return;

    const patch = {};
    incoming.forEach((r) => {
      const raw = r.lesson_date ?? r.date ?? payload.lessonDate;
      if (!raw) return;
      // lesson_date из Postgres приходит ISO-строкой с временем — берём дату
      const dayKey = String(raw).slice(0, 10);
      patch[`${r.student_id ?? r.studentId}_${dayKey}`] = r.status;
    });
    if (Object.keys(patch).length === 0) return;

    const next = { ...mapRef.current, ...patch };
    mapRef.current = next;
    setAttendanceMap(next);

    /* Ростер здесь НЕ перезапрашивается, и это важно.
       Раньше стоял invalidateQueries по ученикам группы — «вдруг коины
       изменились». Отметка посещаемости коины не трогает (их меняет отдельная
       кнопка со своей инвалидацией), зато новый ответ ростера менял ссылку на
       `students`, из-за чего эффект инициализации пересобирал карту из
       СТАРОГО кэша attendance и стирал только что применённый патч.
       Проверено на живом бэкенде: событие доходило, колбэк срабатывал, а
       клетка оставалась пустой. */
  }, []));

  useEffect(() => {
    setAttendanceMap({});
  }, [groupId, month, year]);

  useEffect(() => {
    const fullMap = {};
    students.forEach((s) => {
      DAYS.forEach((d) => {
        fullMap[`${s.id}_${year}-${pad(month + 1)}-${pad(d)}`] = null;
      });
    });
    attendance.forEach((a) => {
      const attDate = a.date ?? a.lesson_date; // бэкенд: lesson_date, моки: date
      if (!attDate) return;
      const key = `${a.student_id}_${attDate}`;
      if (fullMap[key] !== undefined) fullMap[key] = a.status;
    });
    setAttendanceMap(fullMap);
    mapRef.current = fullMap;   // держим зеркало в согласии с данными сервера
  }, [students, month, year, attendance, DAYS]);

  const dateKeyFor = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  /* Отправка накопленного. Копим в ref, а не в state: между кликом и отправкой
     не должно быть лишних перерисовок, а пачка обязана пережить их все.
     Группируем по дате — контракт бэкенда принимает одну дату за запрос. */
  const flush = useCallback(async () => {
    const batch = pendingRef.current;
    if (batch.size === 0) return;
    pendingRef.current = new Map();

    setSaveState('saving');
    try {
      for (const [lessonDate, byStudent] of batch) {
        const records = [...byStudent].map(([studentId, status]) => ({ studentId, status }));

        /* Основной канал — сокет: соединение уже открыто, отметка уходит одним
           кадром, и тем же действием сервер рассылает её остальным.
           HTTP остаётся запасным путём. Ментор отмечает журнал во время урока —
           потерять отметку из-за оборванного вебсокета недопустимо, поэтому
           «полностью на сокете» здесь означает «сокет первым», а не «только
           сокет и будь что будет». */
        try {
          if (USING_MOCKS) throw new Error('mocks');   // в мок-режиме сокет-сервера нет
          await markAttendanceSocket(token, { groupId, lessonDate, records });
        } catch (socketErr) {
          await api.mentorMarkAttendance(token, groupId, { lessonDate, records });
        }
      }
      setSaveState('saved');
      // Через пару секунд гасим отметку — постоянная «Saqlandi» превращается
      // в фоновый шум и перестаёт значить что-либо.
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch (err) {
      // Возвращаем неотправленное в очередь: следующий клик или повтор
      // попробуют снова, отметки не пропадут молча.
      for (const [date, byStudent] of batch) {
        const existing = pendingRef.current.get(date) ?? new Map();
        byStudent.forEach((v, k) => existing.set(k, v));
        pendingRef.current.set(date, existing);
      }
      setSaveState('error');
      setToast({ message: err.message || 'Saqlanmadi — internetni tekshiring', type: 'error' });
    }
  }, [token, groupId, qc]);

  const queueSave = useCallback((lessonDate, studentId, status) => {
    const byStudent = pendingRef.current.get(lessonDate) ?? new Map();
    byStudent.set(studentId, status);
    pendingRef.current.set(lessonDate, byStudent);

    setSaveState('pending');
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, AUTOSAVE_DELAY);
  }, [flush]);

  // Уход со страницы не должен съедать последние отметки: то, что ещё не
  // улетело, отправляем немедленно при размонтировании.
  useEffect(() => () => {
    clearTimeout(flushTimer.current);
    flush();
  }, [flush]);

  /* Клик по клетке: keldi ⇄ kelmadi. Третьего состояния нет — см. комментарий
     в шапке файла: снять отметку на бэкенде нечем.

     Текущий статус читаем из ref, а не из state: два быстрых клика подряд
     попадают в один цикл рендера, state внутри обработчика ещё старый, и
     второй клик вычислял тот же самый статус — клетка залипала на «keldi».
     Ref обновляем синхронно, поэтому каждый клик видит результат предыдущего. */
  const toggleDay = (studentId, day) => {
    const dateKey = dateKeyFor(day);
    const key = `${studentId}_${dateKey}`;
    const next = mapRef.current[key] === 'present' ? 'absent' : 'present';
    mapRef.current = { ...mapRef.current, [key]: next };
    setAttendanceMap(mapRef.current);
    queueSave(dateKey, studentId, next);
  };

  const markAllPresentToday = () => {
    const dateKey = dateKeyFor(now.getDate());
    const next = { ...mapRef.current };
    students.forEach((s) => { next[`${s.id}_${dateKey}`] = 'present'; });
    mapRef.current = next;
    setAttendanceMap(next);
    students.forEach((s) => queueSave(dateKey, s.id, 'present'));
  };

  // Начисление прямо из строки журнала. Минус разрешён: «-5» спишет коины,
  // отдельная кнопка «отнять» тут только загромождала бы строку.
  const submitCoins = async (student) => {
    const raw = coinDrafts[student.id];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount === 0 || coinBusyId) return;

    setCoinBusyId(student.id);
    try {
      /* groupId обязателен, когда ученик состоит в двух группах этого ментора:
         сервер иначе не знает, из какого месячного лимита списывать. */
      await api.mentorGrantCoins(token, {
        studentId: student.id, amount, reason: 'Dars', groupId,
      });
      qc.invalidateQueries({ queryKey: ['mentor-group-students', groupId] });
      qc.invalidateQueries({ queryKey: ['mentor-coin-budget', groupId] });
      setCoinDrafts((prev) => ({ ...prev, [student.id]: '' }));
      setToast({ message: `${student.first_name}: ${amount > 0 ? '+' : ''}${amount} coin`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setCoinBusyId(null);
    }
  };

  /* Прошедшая дата, отмеченная как «был», — правка задним числом: она жёлтая,
     чтобы отличаться от отметки в день урока. Раньше здесь стояли классы
     `text-danger`/`bg-danger/15`, которых в конфиге Tailwind не существовало, —
     «kelmadi» рисовался вообще без красного. */
  const cellStyle = (status, day) => {
    const isPast = dateKeyFor(day) < today;
    if (status === 'present') {
      return isPast
        ? 'bg-warning/15 text-warning border-warning/40'
        : 'bg-success/15 text-success border-success/40';
    }
    if (status === 'absent') return 'bg-error/15 text-error border-error/40';
    return 'border-base-300 text-base-content/25 hover:border-base-content/30 hover:bg-base-200/60';
  };

  const cellIcon = (status) => {
    if (status === 'present') return <Check size={16} />;
    if (status === 'absent') return <X size={16} />;
    return <Minus size={13} />;
  };

  const statusLabel = (status) => {
    if (status === 'present') return 'keldi';
    if (status === 'absent') return 'kelmadi';
    return 'belgilanmagan';
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* ── Полоса месяцев ── */}
      <div className="shrink-0 border-b border-base-200 px-3 py-2 overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          {monthStrip.map(({ year: y, month: m }) => {
            const active = y === year && m === month;
            const isThis = y === now.getFullYear() && m === now.getMonth();
            return (
              <button
                key={`${y}-${m}`}
                onClick={() => { setYear(y); setMonth(m); }}
                aria-current={active ? 'true' : undefined}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-primary-content'
                    : isThis
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-base-content/55 hover:bg-base-200'
                }`}
              >
                {MONTHS[m].slice(0, 3)}{' '}
                <span className={active ? 'opacity-70' : 'opacity-50'}>{String(y).slice(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Легенда + массовая отметка ── */}
      <div className="shrink-0 px-4 py-2 border-b border-base-200 flex items-center justify-between gap-3 flex-wrap">
        <ul className="flex items-center gap-3 text-[11px] text-base-content/50 flex-wrap">
          <li className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-success/40 bg-success/15" /> keldi
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-error/40 bg-error/15" /> kelmadi
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border border-warning/40 bg-warning/15" /> keyin tuzatilgan
          </li>
        </ul>
        <div className="flex items-center gap-3">
          {/* Индикатор вместо кнопки: раз сохранение происходит само,
              единственное, что ментору нужно знать, — дошло ли оно. */}
          <SaveIndicator state={saveState} onRetry={flush} />
          {isCurrentMonth && students.length > 0 && DAYS.includes(now.getDate()) && (
            <button className="btn btn-ghost btn-sm gap-1.5 text-success" onClick={markAllPresentToday}>
              <Check size={14} /> Bugun hammasi keldi
            </button>
          )}
        </div>
      </div>

      {/* ── Сетка ── */}
      {/* Таблица ниже — `min-w-max`, а не `w-full`: колонки держат свою ширину,
          и журнал за месяц (12–14 дней) уезжает под горизонтальную прокрутку
          вместо того, чтобы ужимать дни до нечитаемых полосок. Имя ученика и
          коины закреплены по краям, поэтому при прокрутке видно, чью строку
          смотришь и сколько у него коинов. */}
      <div className="overflow-auto flex-1 min-h-0">
        {rosterLoading ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="Bu guruhda o'quvchilar yo'q" />
        ) : (
          <table className="table min-w-max border-collapse">
            <thead>
              <tr>
                {/* Ширина задана жёстко, а не через min-width: в таблице
                    `w-full` свободное место доставалось именно этой колонке, и
                    между именами и первым днём зияла пустая полоса в пол-экрана.
                    Остаток теперь забирает колонка коинов (ниже, `w-full`). */}
                <th className="sticky left-0 top-0 z-20 bg-base-100 w-[160px] sm:w-[240px] min-w-[160px] sm:min-w-[240px] px-3 sm:px-4 py-3 text-left">
                  O'quvchi
                </th>
                {DAYS.map((d) => {
                  const key = dateKeyFor(d);
                  const isPast = key < today;
                  const isToday = key === today;
                  const weekday = new Date(year, month, d).getDay();
                  const isWeekend = weekday === 0;
                  // Фон и цвет — инлайном, а не классами: в index.css есть
                  // `.table thead th { background; color }`, и по специфичности
                  // (0,2,1 против 0,1,0) оно перебивало любые bg-*/text-*
                  // утилиты — «сегодня» и воскресенья не подсвечивались вовсе.
                  return (
                    <th
                      key={d}
                      className="sticky top-0 z-10 w-[68px] min-w-[68px] px-1.5 py-2.5 text-center border-l border-base-200"
                      style={{
                        background: isToday
                          ? 'var(--green-bg)'
                          : isWeekend
                          ? '#eef3e7'
                          : 'var(--surface)',
                        color: isToday
                          ? 'var(--green)'
                          : isPast
                          ? 'var(--text-muted)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {/* Полная дата, а не одно число: журнал за месяц — это
                          12–14 колонок, и «3» посреди ленты не сказать от
                          какого месяца, когда листаешь соседние. */}
                      <div className="text-[11px] font-bold tabular-nums leading-tight">
                        {pad(d)}.{pad(month + 1)}
                      </div>
                      <div className="text-[8px] uppercase mt-0.5 opacity-70">
                        {new Date(year, month, d).toLocaleDateString('uz-UZ', { weekday: 'short' })}
                      </div>
                      {/* Кто вёл этот урок. У группы бывает подменный
                          преподаватель — по колонке видно, чья это отметка. */}
                      <div className="text-[8px] mt-0.5 truncate opacity-55" title={markedByFor(key)}>
                        {shortName(markedByFor(key))}
                      </div>
                    </th>
                  );
                })}
                {/* Липнет к правому краю только начиная с sm: на телефоне это
                    вторая неподвижная колонка, и дни оказывались зажаты между
                    ними в ноль. Там она просто уезжает в конец таблицы. */}
                {/* Фиксированная ширина, не `w-full`. Пока колонка добирала всё
                    свободное место, при 12–14 днях месяца именно она забирала
                    ширину, а дни сплющивались в нечитаемые полоски. Теперь
                    лишнюю ширину забирает лента дней, а не коины. */}
                <th className="sm:sticky sm:right-0 top-0 z-20 bg-base-100 w-[250px] min-w-[250px] px-4 py-3 border-l border-base-200">
                  {/* Подписи стоят ровно над своими числами в строках ниже:
                      «сегодня» и «всего» — разные величины, и без заголовков
                      два числа подряд читаются как одно составное. */}
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-11 text-center">Bugun</span>
                    <span className="w-12 text-center">Jami</span>
                    {/* Остаток месячного лимита. Стоит именно здесь, над самой
                        кнопкой выдачи: ментор видит, сколько ему ещё можно
                        раздать, ровно в тот момент, когда собирается это
                        сделать, — а не после отказа сервера.

                        Без плашки: подложка в шапке спорила с числами коинов в
                        строках и притягивала взгляд сильнее, чем сами данные
                        журнала.

                        Цвет — брендовый зелёный, а не warning, которым по всему
                        проекту обозначен БАЛАНС УЧЕНИКА (Students, StudentDetail,
                        строки ниже). Это разные величины: там сколько у ребёнка,
                        здесь сколько ментору ещё можно раздать, и одинаковый
                        оранжевый их смешивал. Ноль — красным: выдавать нельзя. */}
                    <span className="w-[100px] flex justify-end">
                      {budget && (
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-extrabold tabular-nums ${
                            budget.remaining === 0 ? 'text-error' : 'text-primary'
                          }`}
                          title={`Bu oy uchun: ${budget.allocated} coin (${budget.students} o'quvchi × ${budget.coinsPerStudent}). Sarflandi: ${budget.spent}`}
                        >
                          {/* Только остаток. Дробь «97/110» заставляла вычитать
                              в уме, чтобы ответить на единственный интересующий
                              вопрос — сколько ещё можно раздать. Из чего
                              сложился лимит, видно в подсказке. */}
                          <Coins size={14} />
                          {budget.remaining}
                        </span>
                      )}
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} className="border-b border-base-200 last:border-0">
                  <td className="sticky left-0 z-10 bg-base-100 px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-base-content/35 tabular-nums w-5 shrink-0">
                        {idx + 1}.
                      </span>
                      <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {s.first_name} {s.last_name}
                        </div>
                        {s.status && s.status !== 'active' && (
                          <span className="text-[11px] text-error font-medium">
                            {s.status === 'frozen' ? 'Muzlatilgan' : s.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {DAYS.map((d) => {
                    const status = attendanceMap[`${s.id}_${dateKeyFor(d)}`];
                    const isWeekend = new Date(year, month, d).getDay() === 0;
                    return (
                      <td
                        key={d}
                        className={`px-1.5 py-2.5 text-center border-l border-base-200 ${
                          isWeekend ? 'bg-base-200/40' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleDay(s.id, d)}
                          aria-label={`${s.first_name} ${s.last_name}, ${d}-kun: ${statusLabel(status)}`}
                          className={`mx-auto w-8 h-8 grid place-items-center rounded-lg border transition-colors ${cellStyle(status, d)}`}
                        >
                          {cellIcon(status)}
                        </button>
                      </td>
                    );
                  })}

                  {/* Коины прямо в строке: баланс + быстрое начисление */}
                  <td className="sm:sticky sm:right-0 z-10 bg-base-100 px-3 py-2.5 border-l border-base-200">
                    <div className="flex items-center justify-end gap-2">
                      {/* Сегодня: сколько начислено за текущий день. Ноль —
                          приглушённый, чтобы взгляд цеплялся за тех, кому уже
                          дали коины, а не пересчитывал нули. */}
                      <span
                        className={`w-11 text-center text-sm font-bold tabular-nums ${
                          (s.coins_today ?? 0) > 0 ? 'text-success'
                            : (s.coins_today ?? 0) < 0 ? 'text-error'
                            : 'text-base-content/30'
                        }`}
                        title="Bugun berilgan coinlar"
                      >
                        {(s.coins_today ?? 0) > 0 ? '+' : ''}{s.coins_today ?? 0}
                      </span>
                      {/* Всего: накопленный баланс */}
                      <span
                        className="w-12 flex items-center justify-center gap-1 text-sm font-bold text-warning tabular-nums"
                        title="Jami balans"
                      >
                        <Coins size={12} /> {s.coin_balance ?? 0}
                      </span>
                      <input
                        type="number"
                        value={coinDrafts[s.id] ?? ''}
                        onChange={(e) => setCoinDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitCoins(s); }}
                        placeholder="0"
                        aria-label={`${s.first_name} uchun coin miqdori`}
                        className="input input-bordered input-xs w-14 text-center tabular-nums"
                      />
                      <button
                        onClick={() => submitCoins(s)}
                        disabled={coinBusyId === s.id || !Number(coinDrafts[s.id])}
                        className="btn btn-xs btn-primary"
                      >
                        {coinBusyId === s.id
                          ? <span className="loading loading-spinner loading-xs" />
                          : 'Coin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast
        message={toast?.message}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={closeToast}
      />
    </div>
  );
}
