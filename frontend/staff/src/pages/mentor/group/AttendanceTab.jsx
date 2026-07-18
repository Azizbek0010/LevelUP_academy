import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, X, Minus, Users, Coins, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useMentorGroupStudents, useMentorAttendance } from '../../../queries.js';
import { useAuth } from '../../../auth.jsx';
import { api } from '../../../api.js';
import { useAttendanceLive } from '../../../socket.js';
import { Avatar, EmptyState } from '../_ui.jsx';

/**
 * Журнал одной группы: месяц по горизонтали, ученики по вертикали.
 *
 * Клетка перебирает три состояния: не отмечен → keldi → kelmadi → не отмечен.
 * Справа у каждого ученика — баланс коинов и поле быстрого начисления: коины
 * ставятся не выходя из журнала (именно так ментор и работает во время урока).
 */

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

const pad = (n) => String(n).padStart(2, '0');

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

export default function AttendanceTab({ groupId }) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  const now = useMemo(() => new Date(), []);
  const today = now.toISOString().split('T')[0];

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [saving, setSaving] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [coinDrafts, setCoinDrafts] = useState({});   // studentId -> строка из инпута
  const [coinBusyId, setCoinBusyId] = useState(null);

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
      })),
    [rosterData],
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  const from = `${year}-${pad(month + 1)}-01`;
  const to = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`;
  const { data: attendanceData } = useMentorAttendance(groupId, { from, to });
  const attendance = useMemo(() => attendanceData?.data || [], [attendanceData]);

  // Журнал могли отметить в другом месте (второй ментор, админ) — перечитываем
  // данные, а не сливаем руками: источник правды остаётся один.
  useAttendanceLive(token, groupId, useCallback(() => {
    qc.invalidateQueries({ queryKey: ['mentor-attendance'] });
    qc.invalidateQueries({ queryKey: ['mentor-group-students', groupId] });
  }, [qc, groupId]));

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
  }, [students, month, year, attendance, DAYS]);

  const dateKeyFor = (day) => `${year}-${pad(month + 1)}-${pad(day)}`;

  const toggleDay = (studentId, day) => {
    const key = `${studentId}_${dateKeyFor(day)}`;
    setAttendanceMap((prev) => {
      const current = prev[key];
      const next = current === null || current === undefined
        ? 'present'
        : current === 'present' ? 'absent' : null;
      return { ...prev, [key]: next };
    });
  };

  const markAllPresentToday = () => {
    const key = dateKeyFor(now.getDate());
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => { next[`${s.id}_${key}`] = 'present'; });
      return next;
    });
  };

  const handleSave = async () => {
    if (!groupId || saving) return;
    setSaving(true);
    try {
      const byDate = {};
      Object.entries(attendanceMap).forEach(([key, status]) => {
        if (!status) return;
        const [sId, ...dateParts] = key.split('_');
        (byDate[dateParts.join('_')] ||= []).push({ studentId: sId, status });
      });

      for (const [lessonDate, records] of Object.entries(byDate)) {
        await api.mentorMarkAttendance(token, groupId, { lessonDate, records });
      }

      qc.invalidateQueries({ queryKey: ['mentor-attendance'] });
      qc.invalidateQueries({ queryKey: ['mentor-group-students'] });
      setToast({ message: 'Davomat saqlandi', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Начисление прямо из строки журнала. Минус разрешён: «-5» спишет коины,
  // отдельная кнопка «отнять» тут только загромождала бы строку.
  const submitCoins = async (student) => {
    const raw = coinDrafts[student.id];
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount === 0 || coinBusyId) return;

    setCoinBusyId(student.id);
    try {
      await api.mentorGrantCoins(token, { studentId: student.id, amount, reason: 'Dars' });
      qc.invalidateQueries({ queryKey: ['mentor-group-students', groupId] });
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
        {isCurrentMonth && students.length > 0 && (
          <button className="btn btn-ghost btn-sm gap-1.5 text-success" onClick={markAllPresentToday}>
            <Check size={14} /> Bugun hammasi keldi
          </button>
        )}
      </div>

      {/* ── Сетка ── */}
      <div className="overflow-auto flex-1 min-h-0">
        {rosterLoading ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="Bu guruhda o'quvchilar yo'q" />
        ) : (
          <table className="table w-full border-collapse">
            <thead>
              <tr>
                {/* На телефоне колонка имени ужимается: при 230px вместе с
                    липкой колонкой коинов на дни не оставалось ни пикселя. */}
                <th className="sticky left-0 top-0 z-20 bg-base-100 min-w-[160px] sm:min-w-[230px] px-3 sm:px-4 py-3 text-left">
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
                      className="sticky top-0 z-10 w-12 px-1.5 py-3 text-center border-l border-base-200"
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
                      <div className="text-[9px] uppercase">
                        {new Date(year, month, d).toLocaleDateString('uz-UZ', { weekday: 'short' })}
                      </div>
                      <div className="text-sm font-bold mt-0.5 tabular-nums">{d}</div>
                    </th>
                  );
                })}
                {/* Липнет к правому краю только начиная с sm: на телефоне это
                    вторая неподвижная колонка, и дни оказывались зажаты между
                    ними в ноль. Там она просто уезжает в конец таблицы. */}
                <th className="sm:sticky sm:right-0 top-0 z-20 bg-base-100 min-w-[190px] px-4 py-3 text-right border-l border-base-200">
                  Koinlar
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
                      <span className="flex items-center gap-1 text-sm font-bold text-warning tabular-nums">
                        <Coins size={13} /> {s.coin_balance ?? 0}
                      </span>
                      <input
                        type="number"
                        value={coinDrafts[s.id] ?? ''}
                        onChange={(e) => setCoinDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitCoins(s); }}
                        placeholder="0"
                        aria-label={`${s.first_name} uchun coin miqdori`}
                        className="input input-bordered input-xs w-16 text-center tabular-nums"
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

      {students.length > 0 && (
        <footer className="shrink-0 px-4 py-3 border-t border-base-200 bg-base-100 flex justify-end">
          <button className="btn btn-primary gap-2 px-6" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Check size={17} />}
            Saqlash
          </button>
        </footer>
      )}

      <Toast
        message={toast?.message}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={closeToast}
      />
    </div>
  );
}
