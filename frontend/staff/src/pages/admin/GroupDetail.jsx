import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, X, Users, KeyRound, Phone,
  CalendarDays, Check, Minus, Clock, CreditCard,
  BookOpen, Plus, Star, MessageSquare, Send, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth.jsx';
import {
  useAdminGroupDetail, useAdminStudents,
  useAdminGroupHomework, useAdminGroupFeedback,
} from '../../queries.js';
import { api, USING_MOCKS } from '../../api.js';
import { getSocket } from '../../socket.js';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, RowSkeleton, EmptyState, Modal } from '../mentor/_ui.jsx';

/* ─── helpers ─── */
const fullName = (s) => s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

/* Короткие ярлыки дней для строки расписания в шапке группы. */
const DAY_LABEL = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

function scheduleText(group) {
  let sched = group?.schedule;
  if (typeof sched === 'string') { try { sched = JSON.parse(sched); } catch { sched = []; } }
  if (!Array.isArray(sched) || sched.length === 0) return null;
  const days = sched.map((s) => DAY_LABEL[String(s.day).toLowerCase()] || s.day).join(', ');
  const start = group.startTime || sched[0]?.start;
  const end = group.endTime || sched[0]?.end;
  const time = start ? (end ? `${start}–${end}` : start) : null;
  return time ? `${days} · ${time}` : days;
}

/* Компактный показатель для мета-строки шапки. */
function Meta({ Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-base-content/45 leading-none">{label}</div>
        <div className="text-[14px] font-extrabold text-base-content tabular-nums mt-1 truncate leading-none">{value}</div>
      </div>
    </div>
  );
}
const pad = (n) => String(n).padStart(2, '0');
const WEEKDAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function buildMonthStrip(base) {
  const list = [];
  for (let offset = -6; offset <= 3; offset += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    list.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return list;
}

/* ═══════════════ AttendanceTab — Calendar Table ═══════════════ */
function AttendanceTab({ groupId, token }) {
  const now = useMemo(() => new Date(), []);
  const todayStr = now.toLocaleDateString('en-CA');

  // ── localStorage restore/persist ──
  const LS_ATT = 'admin-attendance-state';
  const restoreAtt = () => {
    try { return JSON.parse(localStorage.getItem(LS_ATT)) || {}; } catch { return {}; }
  };
  const persistAtt = (val) => {
    try { localStorage.setItem(LS_ATT, JSON.stringify(val)); } catch { /* noop */ }
  };

  const [year, setYear] = useState(() => restoreAtt().year ?? now.getFullYear());
  const [month, setMonth] = useState(() => restoreAtt().month ?? now.getMonth());
  const [attendanceMap, setAttendanceMap] = useState({});
  // Параллельная карта: у каких клеток отметку поставил/исправил администратор.
  // Ключи те же, что у attendanceMap (`${studentId}_${date}`).
  const [correctedMap, setCorrectedMap] = useState({});
  const [saveState, setSaveState] = useState('idle');
  const pendingRef = useRef(new Map());
  const flushTimer = useRef(null);
  const mapRef = useRef({});
  const correctedRef = useRef({});
  const qc = useQueryClient();
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const hoverTimerRef = useRef(null);
  const [slideDir, setSlideDir] = useState(null); // 'left' | 'right' for nav transition

  const showPopup = useCallback((s, e) => {
    clearTimeout(hoverTimerRef.current);
    const rect = e.currentTarget.closest('td').getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 4, left: Math.max(8, rect.left) });
    setHoveredStudent(s);
  }, []);

  const hidePopup = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredStudent(null), 150);
  }, []);

  const keepPopup = useCallback(() => {
    clearTimeout(hoverTimerRef.current);
  }, []);

  const monthStrip = useMemo(() => buildMonthStrip(now), [now]);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fetch students from group detail
  const { data: groupDetailData } = useAdminGroupDetail(groupId);
  const groupRaw = groupDetailData?.data || groupDetailData || {};
  const group = groupRaw.group || groupRaw;
  const students = group.students || [];

  // Determine lesson weekdays from group schedule
  // schedule may come as JSON string from DB — force parse to array
  const scheduleArray = useMemo(() => {
    const raw = group?.schedule;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
    return [];
  }, [group]);

  const lessonWeekdays = useMemo(() => {
    const days = scheduleArray
      .map((s) => WEEKDAY_INDEX[String(s.day).toLowerCase()])
      .filter((d) => d !== undefined);
    return days.length ? new Set(days) : null;
  }, [scheduleArray]);

  // Lesson days only (filtered by schedule if available)
  const DAYS = useMemo(() => {
    const all = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    if (!lessonWeekdays) return all;
    return all.filter((d) => lessonWeekdays.has(new Date(year, month, d).getDay()));
  }, [daysInMonth, lessonWeekdays, year, month]);

  // Paginate into chunks of 15
  const CHUNK_SIZE = 15;
  const [pageIndex, setPageIndex] = useState(() => restoreAtt().pageIndex ?? 0);
  const chunks = useMemo(() => {
    const result = [];
    for (let i = 0; i < DAYS.length; i += CHUNK_SIZE) result.push(DAYS.slice(i, i + CHUNK_SIZE));
    return result;
  }, [DAYS]);
  const currentChunk = chunks[pageIndex] || [];
  const totalPages = chunks.length;

  // Reset page on month change
  useEffect(() => { setPageIndex(0); }, [year, month]);

  // Persist attendance state on change
  useEffect(() => {
    persistAtt({ year, month, pageIndex });
  }, [year, month, pageIndex]);

  // Build per-day attendance queries dynamically (useQueries — rules-of-hooks safe)
  const attendanceQueries = useMemo(() => DAYS.map((d) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    return {
      queryKey: ['admin-group-attendance', groupId, dateStr],
      queryFn: () => api.adminGroupAttendance(token, groupId, dateStr),
      enabled: !!groupId && !!dateStr,
    };
  }), [DAYS, year, month, groupId, token]);

  const dayResults = useQueries({ queries: attendanceQueries });

  /* Стабильная подпись серверных данных: меняется ТОЛЬКО когда какой-то день
     реально перезагрузился (`dataUpdatedAt` обновляется на успешный ответ), а не
     на каждый ре-рендер. Раньше эффект ниже зависел от идентичности массива
     `dayResults`, а useQueries отдаёт новую ссылку на многих ре-рендерах — из-за
     чего build-эффект срабатывал на каждый клик и пересобирал карту из серверных
     данных, ЗАТИРАЯ оптимистичную отметку. Клетка меняла цвет только через ~1с,
     когда приходил ответ сохранения. Теперь эффект срабатывает лишь на свежих
     данных, оптимистичное изменение видно сразу, а перезапрос (с тем же
     значением) уже ничего не «дёргает». */
  const dayResultsRef = useRef(dayResults);
  dayResultsRef.current = dayResults;
  const dataSignature = dayResults.map((r) => r.dataUpdatedAt ?? 0).join(',');

  // Build attendance map from all day results
  useEffect(() => {
    const dr = dayResultsRef.current;
    const fullMap = {};
    // Initialize empty
    students.forEach((s) => {
      DAYS.forEach((d) => {
        const sid = s.id || s.studentId;
        fullMap[`${sid}_${year}-${pad(month + 1)}-${pad(d)}`] = null;
      });
    });
    const corrected = { ...correctedRef.current };
    // Fill from API data
    DAYS.forEach((d, idx) => {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const result = dr[idx];
      const records = result?.data?.data || result?.data || [];
      records.forEach((r) => {
        const sid = r.studentId || r.student_id;
        const status = r.status;
        if (sid && status) {
          fullMap[`${sid}_${dateStr}`] = status;
          if (r.correctedByAdmin) corrected[`${sid}_${dateStr}`] = true;
        }
      });
    });
    setAttendanceMap(fullMap);
    mapRef.current = fullMap;
    setCorrectedMap(corrected);
    correctedRef.current = corrected;
  }, [groupId, month, year, students, DAYS, dataSignature]);

  // Reset on month/groupId change
  useEffect(() => {
    setAttendanceMap({});
    mapRef.current = {};
    setCorrectedMap({});
    correctedRef.current = {};
  }, [groupId, month, year]);

  // Живое обновление журнала. Перечитываем ТОЛЬКО затронутый день (1 запрос, а
  // не все ~14 — из-за этого раньше правка тормозила). Свои правки тоже
  // перечитываем: пометку «исправлено админом» подтверждает сервер
  // (correctedByAdmin по marked_by), и один быстрый запрос надёжнее, чем
  // полагаться только на оптимистику.
  useEffect(() => {
    if (!token || USING_MOCKS || !groupId) return undefined;
    const s = getSocket(token);
    const onUpdate = (payload) => {
      if (payload?.groupId && payload.groupId !== groupId) return;
      const day = payload?.lessonDate;
      qc.invalidateQueries({
        queryKey: day
          ? ['admin-group-attendance', groupId, day]
          : ['admin-group-attendance', groupId],
      });
    };
    s.emit('attendance:subscribe', { groupId });
    s.on('attendance:updated', onUpdate);
    return () => {
      s.off('attendance:updated', onUpdate);
      s.emit('attendance:unsubscribe', { groupId });
    };
  }, [token, groupId, qc]);

  const dateKeyFor = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  /* ── Toggle cell: absent → present → late → absent.
     Прошлое и сегодня — можно, будущее — нельзя: отмечать посещаемость ещё не
     состоявшегося урока бессмысленно (и бэкенд его всё равно отклоняет 422). ── */
  const toggleDay = useCallback((studentId, day) => {
    const dateKey = dateKeyFor(day);
    if (dateKey > todayStr) return; // будущий урок — не трогаем
    const key = `${studentId}_${dateKey}`;
    const cycle = { absent: 'present', present: 'late', late: 'absent' };
    const next = cycle[mapRef.current[key]] || 'present';
    mapRef.current = { ...mapRef.current, [key]: next };
    setAttendanceMap({ ...mapRef.current });
    // Правит админ → клетка сразу помечается как исправленная администратором
    // (не дожидаясь перечитывания с сервера).
    correctedRef.current = { ...correctedRef.current, [key]: true };
    setCorrectedMap({ ...correctedRef.current });
    queueSave(dateKey, studentId, next);
  }, [year, month, groupId, token]);

  /* ── Auto-save with debounce ── */
  const flush = useCallback(async () => {
    const batch = pendingRef.current;
    if (batch.size === 0) return;
    pendingRef.current = new Map();

    setSaveState('saving');
    try {
      for (const [lessonDate, byStudent] of batch) {
        const records = [...byStudent].map(([studentId, status]) => ({ studentId, status }));
        await api.adminMarkGroupAttendance(token, groupId, { lessonDate, records });
      }
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2500);
    } catch (err) {
      for (const [date, byStudent] of batch) {
        const existing = pendingRef.current.get(date) ?? new Map();
        byStudent.forEach((v, k) => existing.set(k, v));
        pendingRef.current.set(date, existing);
      }
      setSaveState('error');
    }
  }, [token, groupId]);

  const queueSave = useCallback((lessonDate, studentId, status) => {
    const byStudent = pendingRef.current.get(lessonDate) ?? new Map();
    byStudent.set(studentId, status);
    pendingRef.current.set(lessonDate, byStudent);

    setSaveState('pending');
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 700);
  }, [flush]);

  // Flush on unmount
  useEffect(() => () => { clearTimeout(flushTimer.current); flush(); }, [flush]);

  /* ── Cell styles (all days editable) ── */
  const cellStyle = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200';
    if (status === 'late') return 'bg-amber-200 text-amber-800 border-amber-400 hover:bg-amber-300';
    if (status === 'absent') return 'bg-red-500 text-white border-red-500 hover:bg-red-600';
    return 'border-gray-200 text-gray-300 hover:border-primary/50 hover:bg-primary/[0.05]';
  };

  const cellIcon = (status) => {
    if (status === 'present') return <Check size={16} strokeWidth={3} />;
    if (status === 'late') return <Clock size={14} strokeWidth={2.5} />;
    if (status === 'absent') return <X size={16} strokeWidth={3} />;
    return <Minus size={13} />;
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 animate-fade-in">
      {/* ── Slide animation keyframes ── */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-24px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(24px);  opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .animate-slide-left  { animation: slideInLeft  0.25s ease-out; }
        .animate-slide-right { animation: slideInRight 0.25s ease-out; }
      `}</style>
      {/* ── Month strip ── */}
      <div className="shrink-0 border-b border-base-300 px-3 py-2 overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          {monthStrip.map(({ year: y, month: m }) => {
            const active = y === year && m === month;
            const isThis = y === now.getFullYear() && m === now.getMonth();
            return (
              <button
                key={`${y}-${m}`}
                onClick={() => { setYear(y); setMonth(m); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-white'
                    : isThis
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-base-content/45 hover:bg-base-100'
                }`}
              >
                {MONTHS[m].slice(0, 3)}{' '}
                <span className={active ? 'opacity-70' : 'opacity-50'}>{String(y).slice(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="shrink-0 px-4 py-2 border-b border-base-300 flex items-center justify-between gap-3 flex-wrap">
        <ul className="flex items-center gap-4 text-[11px] font-medium text-base-content/45 flex-wrap">
          <li className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg border grid place-items-center bg-emerald-100 text-emerald-700 border-emerald-300">
              <Check size={13} strokeWidth={3} />
            </span>
            Пришёл
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg border grid place-items-center bg-amber-200 text-amber-800 border-amber-400">
              <Clock size={13} strokeWidth={2.5} />
            </span>
            Опоздал
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg border grid place-items-center bg-red-500 text-white border-red-500">
              <X size={13} strokeWidth={3} />
            </span>
            Не пришёл
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg border border-gray-200 grid place-items-center text-gray-300">
              <Minus size={13} />
            </span>
            Не отмечен
          </li>
          <li className="flex items-center gap-1.5">
            <span className="relative w-6 h-6 rounded-lg border border-base-300 grid place-items-center ring-2 ring-indigo-500 ring-offset-1">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-base-100" />
            </span>
            Исправлено админом
          </li>
        </ul>
        <span className="flex items-center gap-1.5 text-xs text-base-content/45">
          {saveState === 'saving' && <><Loader2 size={13} className="animate-spin" /> Сохранение...</>}
          {saveState === 'saved' && <>Сохранено</>}
          {saveState === 'error' && (
            <button onClick={flush} className="text-red-500 hover:underline">
              Не сохранено — повторить
            </button>
          )}
        </span>
      </div>

      {/* ── Page navigation (15 days per page) with smooth slide ── */}
      {totalPages > 1 && (
        <div className="shrink-0 px-4 py-2 border-b border-base-300 flex items-center justify-center gap-4">
          <button
            onClick={() => { setSlideDir('right'); setPageIndex((p) => Math.max(0, p - 1)); }}
            disabled={pageIndex === 0}
            className="w-8 h-8 rounded-xl border border-base-300 grid place-items-center text-base-content/45 hover:bg-base-100 hover:text-base-content disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
            aria-label="Oldingi sahifa"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-bold text-base-content/45 tabular-nums min-w-[3rem] text-center">
            {pageIndex + 1} / {totalPages}
          </span>
          <button
            onClick={() => { setSlideDir('left'); setPageIndex((p) => Math.min(totalPages - 1, p + 1)); }}
            disabled={pageIndex >= totalPages - 1}
            className="w-8 h-8 rounded-xl border border-base-300 grid place-items-center text-base-content/45 hover:bg-base-100 hover:text-base-content disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-90"
            aria-label="Keyingi sahifa"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Calendar table ── */}
      <div className="overflow-auto flex-1 min-h-0">
        {students.length === 0 ? (
          <EmptyState icon={Users} title="В этой группе нет учеников" />
        ) : (
          <div
            className={slideDir ? `animate-slide-${slideDir}` : ''}
            onAnimationEnd={() => setSlideDir(null)}
          >
          <table className="table min-w-max border-collapse">
            <thead>
              <tr>
                {/* Sticky student name column */}
                <th className="sticky left-0 top-0 z-20 bg-base-100 w-[160px] sm:w-[240px] min-w-[160px] sm:min-w-[240px] px-3 sm:px-4 py-3 text-left text-[13px] font-bold text-base-content">
                  Ученик
                </th>
                {/* Day columns (current 15-day chunk) */}
                {currentChunk.map((d) => {
                  const key = dateKeyFor(d);
                  const isToday = key === todayStr;
                  return (
                    <th
                      key={d}
                      className="sticky top-0 z-10 w-[68px] min-w-[68px] px-1.5 py-2.5 text-center border-l border-base-300"
                      style={{
                        background: isToday ? 'var(--green-bg)' : 'var(--surface)',
                        color: isToday ? 'var(--green)' : 'var(--text-muted)',
                      }}
                    >
                      <div className="text-[11px] font-bold tabular-nums leading-tight">
                        {pad(d)}.{pad(month + 1)}
                      </div>
                      <div className="text-[8px] uppercase mt-0.5 opacity-70">
                        {new Date(year, month, d).toLocaleDateString('ru-RU', { weekday: 'short' })}
                      </div>
                    </th>
                  );
                })}
                {/* Summary column */}
                <th className="sticky right-0 top-0 z-20 bg-base-100 w-[80px] min-w-[80px] px-4 py-3 text-center border-l border-base-300 text-[13px] font-bold text-base-content">
                  Jami
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const sid = s.id || s.studentId;
                const firstName = s.firstName || s.first_name || '';
                const lastName = s.lastName || s.last_name || '';
                const studentFullName = fullName(s);
                // Count present days
                let presentCount = 0;
                DAYS.forEach((d) => {
                  if (attendanceMap[`${sid}_${dateKeyFor(d)}`] === 'present') presentCount++;
                });

                return (
                  <tr key={sid} className="border-b border-base-300 last:border-0">
                    {/* Sticky name cell */}
                    <td
                      className="sticky left-0 z-10 bg-base-100 px-3 sm:px-4 py-2.5 cursor-pointer"
                      onMouseEnter={(e) => showPopup(s, e)}
                      onMouseLeave={hidePopup}
                    >
                      <Link to={`/students/${sid}`} className="flex items-center gap-3 group">
                        <span className="text-xs text-primary/40 tabular-nums w-5 shrink-0">
                          {idx + 1}.
                        </span>
                        <Avatar name={studentFullName} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate text-base-content group-hover:text-primary transition-colors">
                            {firstName} {lastName}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Day cells (current 15-day chunk) */}
                    {currentChunk.map((d) => {
                      const dateKey = dateKeyFor(d);
                      const cellKey = `${sid}_${dateKey}`;
                      const status = attendanceMap[cellKey];
                      const corrected = correctedMap[cellKey];
                      // Будущий урок — не редактируется (как и у ментора).
                      const future = dateKey > todayStr;
                      return (
                        <td
                          key={d}
                          className="px-1.5 py-2.5 text-center border-l border-base-300"
                        >
                          <button
                            onClick={() => toggleDay(sid, d)}
                            disabled={future}
                            title={
                              future ? 'Будущий урок — отметить нельзя'
                                : corrected ? 'Исправлено администратором' : undefined
                            }
                            className={`relative mx-auto w-8 h-8 grid place-items-center rounded-lg border transition-colors ${cellStyle(status)} ${corrected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''} ${future ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                          >
                            {cellIcon(status)}
                            {/* Отметка «исправлено администратором»: клетка держит
                                цвет статуса, а угловая точка (не статусный цвет)
                                сообщает, что правку внёс админ. */}
                            {corrected && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-base-100" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* Summary */}
                    <td className="sticky right-0 z-10 bg-base-100 px-4 py-2.5 border-l border-base-300 text-center">
                      <span className="text-[13px] font-bold tabular-nums text-base-content/70">
                        {presentCount}/{DAYS.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Hover popup ── */}
      {hoveredStudent && (() => {
        const hs = hoveredStudent;
        const hsName = fullName(hs);
        const hsPhone = hs.phone || hs.phoneNumber || '—';
        const hsCode = hs.login_code || hs.loginCode || '—';
        const hsStatus = hs.status || 'active';
        const hsDebt = hs.totalDebt ?? hs.debt ?? 0;
        const statusLabel = hsStatus === 'active' ? 'Активен' : hsStatus === 'frozen' ? 'Заморожен' : hsStatus;
        const statusColor = hsStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
        return (
          <div
            className="fixed z-[9999] w-64 bg-white shadow-xl rounded-2xl border border-base-300 p-4 animate-fade-in pointer-events-auto"
            style={{ top: popupPos.top, left: popupPos.left }}
            onMouseEnter={keepPopup}
            onMouseLeave={hidePopup}
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={hsName} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-base-content truncate">{hsName}</div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-[12px] text-base-content/45">
              {hsPhone !== '—' && (
                <div className="flex items-center gap-2">
                  <Phone size={11} className="shrink-0" />
                  <span dir="auto">{hsPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <KeyRound size={11} className="shrink-0" />
                <span className="font-mono">{hsCode}</span>
              </div>
              {hsDebt > 0 && (
                <div className="flex items-center gap-2 text-red-500 font-semibold">
                  <span>Qarz: {hsDebt.toLocaleString()} so'm</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ═══════════════ HomeworkTab ═══════════════ */
function HomeworkTab({ groupId }) {
  const { data: hwData, refetch } = useAdminGroupHomework(groupId);
  const hw = hwData?.data || hwData || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [hwSearch, setHwSearch] = useState('');

  const statusBadge = (s) => {
    if (s === 'active') return 'bg-emerald-100 text-emerald-700';
    if (s === 'completed') return 'bg-blue-100 text-blue-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };
  const statusLabel = (s) => s === 'active' ? 'Активна' : s === 'completed' ? 'Выполнено' : s === 'overdue' ? 'Просрочено' : s;

  const filteredHw = hw.filter((h) => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false;
    if (hwSearch && !h.title.toLowerCase().includes(hwSearch.toLowerCase())) return false;
    return true;
  });

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.adminCreateGroupHomework(null, groupId, form);
      setForm({ title: '', description: '', dueDate: '' });
      setShowAdd(false);
      refetch();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar: count + search + filter + add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[13px] font-bold text-base-content/70 whitespace-nowrap">
            Домашние задания ({filteredHw.length})
          </span>
          <input
            type="search"
            placeholder="Поиск..."
            value={hwSearch}
            onChange={(e) => setHwSearch(e.target.value)}
            className="input input-bordered input-xs w-32 sm:w-40 rounded-lg text-[12px]"
          />
        </div>
        <button className="btn btn-primary btn-sm gap-1 shrink-0" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Добавить
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2">
        {['all', 'active', 'completed', 'overdue'].map((f) => (
          <button
            key={f}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              statusFilter === f
                ? 'bg-primary text-white'
                : 'bg-base-100 text-base-content/45 border border-base-300 hover:bg-primary/10'
            }`}
            onClick={() => setStatusFilter(f)}
          >
            {f === 'all' ? 'Все' : statusLabel(f)}
          </button>
        ))}
      </div>

      {filteredHw.length === 0 ? (
        <div className="text-center py-12 text-base-content/45 text-[13px]">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          {hw.length === 0 ? "Пока нет заданий" : "Ничего не найдено"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHw.map((h) => (
            <div key={h.id} className="p-4 rounded-[14px] border border-base-300 bg-base-100 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-base-content truncate">{h.title}</h4>
                  {h.description && <p className="text-[12px] text-base-content/45 mt-1 line-clamp-2">{h.description}</p>}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(h.status)}`}>
                  {statusLabel(h.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-base-content/45">
                {h.dueDate && <span>Muddat: {h.dueDate}</span>}
                <span>{h.submissions || 0} / {h.totalStudents || 0} topshirilgan</span>
              </div>
              {h.totalStudents > 0 && (
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.round(((h.submissions || 0) / h.totalStudents) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Добавить задание"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Бекор қилиш</button>
            <button className="btn btn-primary gap-1" onClick={handleAdd} disabled={!form.title.trim() || submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Добавить
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            className="input input-bordered w-full"
            placeholder="Заголовок"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Описание (необязательно)"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="date"
            className="input input-bordered w-full"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ FeedbackTab ═══════════════ */
function FeedbackTab({ groupId }) {
  const { data: fbData, refetch } = useAdminGroupFeedback(groupId);
  const fb = fbData?.data || fbData || [];
  const [filter, setFilter] = useState('all');
  const [fbSearch, setFbSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'student', authorName: '', content: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const filtered = fb.filter((f) => {
    if (filter !== 'all' && f.type !== filter) return false;
    if (fbSearch) {
      const q = fbSearch.toLowerCase();
      const matchesContent = f.content?.toLowerCase().includes(q);
      const matchesAuthor = f.authorName?.toLowerCase().includes(q);
      if (!matchesContent && !matchesAuthor) return false;
    }
    return true;
  });

  const handleAdd = async () => {
    if (!form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.adminCreateGroupFeedback(null, groupId, form);
      setForm({ type: 'student', authorName: '', content: '', rating: 5 });
      setShowAdd(false);
      refetch();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const renderStars = (count) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= count ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {['all', 'student', 'teacher'].map((f) => (
            <button
              key={f}
              className={`text-[12px] font-bold px-3 py-1 rounded-full transition-all ${
                filter === f ? 'bg-primary text-white' : 'bg-base-100 text-base-content/45 border border-base-300'
              }`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Все' : f === 'student' ? 'Ученик' : 'Ментор'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Добавить
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-base-content/45 text-[13px]">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          Ҳали фикр-мулоҳоза йўқ
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="p-4 rounded-[14px] border border-base-300 bg-base-100">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    f.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {f.type === 'student' ? 'О' : 'М'}
                  </div>
                  <span className="text-[13px] font-bold text-base-content">{f.authorName || 'Аноним'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    f.type === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {f.type === 'student' ? 'Ученик' : 'Ментор'}
                  </span>
                </div>
                {renderStars(f.rating)}
              </div>
              <p className="text-[13px] text-base-content leading-relaxed">{f.content}</p>
              <div className="mt-2 text-[11px] text-base-content/45">{f.createdAt?.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Добавить отзыв"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Бекор қилиш</button>
            <button className="btn btn-primary gap-1" onClick={handleAdd} disabled={!form.content.trim() || submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Отправить
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            {['student', 'teacher'].map((t) => (
              <button
                key={t}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-bold transition-all ${
                  form.type === t ? 'bg-primary text-white' : 'bg-base-100 border border-base-300 text-base-content/45'
                }`}
                onClick={() => setForm({ ...form, type: t })}
              >
                {t === 'student' ? 'Ученик' : 'Ментор'}
              </button>
            ))}
          </div>
          <input
            className="input input-bordered w-full"
            placeholder="Имя автора"
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
          />
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Текст отзыва..."
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          <div>
            <label className="text-[12px] font-bold text-base-content/70 mb-1 block">Баҳо</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setForm({ ...form, rating: i })}
                  className="p-1"
                >
                  <Star size={20} className={i <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ Main GroupDetail ═══════════════ */
const TABS = [
  { key: 'attendance', label: 'Посещаемость', icon: CalendarDays },
  { key: 'homework', label: 'Домашние задания', icon: BookOpen },
  { key: 'feedback', label: 'Отзывы', icon: MessageSquare },
];

export default function AdminGroupDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminGroupDetail(id);
  const { data: studentsData } = useAdminStudents();
  const [activeTab, setActiveTab] = useState('attendance');
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');

  const raw = data?.data || data || {};
  const group = raw.group || raw;
  const students = group.students || raw.students || [];
  const totalDebt = students.reduce((sum, s) => sum + Number(s.totalDebt ?? s.total_debt ?? 0), 0);
  const allStudents = (studentsData?.data || studentsData || {}).students || [];
  const candidates = allStudents.filter((s) => !students.some((gs) => gs.id === s.id));

  const add = async () => {
    if (!pick) return;
    try { await api.adminAddStudentToGroup(token, id, pick); setPick(''); setAdding(false); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const remove = async (sid) => {
    if (!confirm('Убрать студента из группы?')) return;
    try { await api.adminRemoveStudentFromGroup(token, id, sid); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="mt-6"><RowSkeleton count={2} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="alert alert-error mt-6">Ошибка: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back link */}
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-base-content/45 hover:text-primary transition-colors animate-fade-in">
        <ArrowLeft size={16} /> К группам
      </Link>

      <PageHeader title={group.name || 'Группа'} subtitle={group.mentorName ? `Ментор: ${group.mentorName}` : group.mentor?.name ? `Ментор: ${group.mentor.name}` : undefined}>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Добавить
        </button>
      </PageHeader>

      {/* Мета-строка группы. Раньше здесь была почти пустая карточка с двумя
          элементами: числом учеников и ментором — причём ментор повторял то,
          что уже написано в подзаголовке шапки. Теперь компактная лента
          реальных данных группы, без дубля: ученики, направление, расписание,
          цена и суммарный долг (последнее важно именно админу). */}
      <div className="card bg-base-100 px-4 py-3.5 animate-fade-in stagger-1">
        <div className="flex items-center gap-x-8 gap-y-3 flex-wrap">
          <Meta Icon={Users} label="Ученики" value={students.length} />
          {group.subject && <Meta Icon={BookOpen} label="Направление" value={group.subject} />}
          {scheduleText(group) && <Meta Icon={CalendarDays} label="Расписание" value={scheduleText(group)} />}
          {group.monthlyPrice > 0 && <Meta Icon={CreditCard} label="Оплата/мес" value={money(group.monthlyPrice)} />}
          {totalDebt > 0 && <Meta Icon={Clock} label="Общий долг" value={money(totalDebt)} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-[14px] bg-base-100 border border-base-300 animate-fade-in stagger-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 ${
              activeTab === key
                ? 'bg-primary text-white shadow-md'
                : 'text-base-content/45 hover:text-base-content hover:bg-primary/10'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card bg-base-100 p-5 animate-fade-in stagger-3">
        {activeTab === 'attendance' && <AttendanceTab groupId={id} token={token} />}
        {activeTab === 'homework' && <HomeworkTab groupId={id} />}
        {activeTab === 'feedback' && <FeedbackTab groupId={id} />}
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Добавить ученика"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Бекор қилиш</button>
            <button className="btn btn-primary" onClick={add} disabled={!pick}>Добавить</button>
          </>
        }
      >
        <select className="select select-bordered w-full" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">О'кувчини танланг...</option>
          {candidates.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
        </select>
      </Modal>
    </div>
  );
}
