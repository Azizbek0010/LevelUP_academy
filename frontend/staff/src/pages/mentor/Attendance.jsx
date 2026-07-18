import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Plus, CalendarCheck, Users, Search, Coins, Star, CheckCircle, XCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { useMentorGroups, useMentorGroupStudents, useMentorAttendance } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { useAttendanceLive } from '../../socket.js';

/* ─── Toast notification ─── */
function Toast({ message, type = 'success', visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 2800);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-toast-in">
      <style>{`
        @keyframes toastDrop {
          0% { opacity: 0; transform: translateY(-24px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastFade {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-12px) scale(0.95); }
        }
        .animate-toast-in {
          animation: toastDrop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        .animate-toast-out {
          animation: toastFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) 2.4s forwards !important;
        }
      `}</style>
      <div className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl min-w-[280px] animate-toast-out ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-200/50'
          : 'bg-red-50 border-red-200 text-red-800 shadow-red-200/50'
      }`}>
        <span className={`p-1 rounded-full ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
        </span>
        <span className="text-sm font-semibold tracking-tight">{message}</span>
      </div>
    </div>
  );
}

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function getLessonTime(g) {
  if (g.lesson_time) return g.lesson_time; // fallback for mock data
  return g.schedule?.[0]?.start || null;
}

const GROUP_COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316'];

function GroupCard({ g, isSelected, isActive, isPast, lessonTime, onClick, index }) {
  const color = GROUP_COLORS[index % GROUP_COLORS.length];
  return (
    <button
      onClick={onClick}
      style={{
        animation: `groupDrop 0.45s ${index * 0.06}s cubic-bezier(0.16,1,0.3,1) both`,
      }}
      className={`w-full text-left rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] ${
        isSelected
          ? 'bg-white shadow-md ring-2 scale-[1.02]'
          : isActive
          ? 'bg-white shadow-sm'
          : 'bg-white/80 hover:bg-white hover:shadow-sm'
      } ${isPast && !isSelected ? 'opacity-50' : ''}`}
    >
      <div className="relative px-3 py-2.5 pl-4">
        {/* Left accent bar */}
        <span
          style={{ background: color }}
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
        />
        <div className="flex items-center gap-2">
          <span className={`shrink-0 w-12 text-center text-[11px] font-bold py-1 rounded-lg ${
            isSelected
              ? 'text-white'
              : 'bg-base-200/70 text-base-content/60'
          }`} style={isSelected ? { background: color } : {}}>
            {lessonTime || '--:--'}
          </span>
          <span className={`text-sm font-bold truncate min-w-0 flex-1 ${isSelected ? '' : 'text-base-content/90'}`}
            style={isSelected ? { color } : {}}>
            {g.name}
          </span>
          {isActive && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
            </span>
          )}
        </div>
        <div className={`text-[11px] mt-1 ml-0.5 ${isSelected ? 'text-base-content/60' : 'text-base-content/40'}`}>
          {g.subject || 'Fan'} · {g.students_count ?? g.students ?? 0} o'quvchi
        </div>
      </div>
    </button>
  );
}

function GroupSidebar({ groups, selectedGroupId, onSelectGroup, searchQuery, onSearchChange, timeToMinutes, currentMinutes }) {
  const now = new Date();

  return (
    <div className="w-96 shrink-0 border-r border-base-300 bg-base-100 flex flex-col overflow-hidden">
      <style>{`
        @keyframes groupDrop {
          0% { opacity: 0; transform: translateY(-16px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="p-3 border-b border-base-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold flex items-center gap-1.5 text-base-content/80">
            <Users size={13} /> Guruhlarim
          </h3>
          <span className="badge badge-ghost badge-xs">{groups.length} ta</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-bordered input-xs w-full pl-7 text-[11px]"
          />
        </div>
      </div>

      {/* ─── Schedule: all groups inside Bugun + Ertaga ─── */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-2">
        {/* Bugun */}
        <div className="bg-white/60 rounded-xl px-3 pt-2.5 pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 text-blue-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Bugun — {now.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' })}
          </h4>
          <div className="space-y-1.5">
            {groups.length === 0 ? (
              <p className="text-[10px] text-base-content/30 px-1 py-2">Dars yo'q</p>
            ) : (
              groups.map((g, i) => {
                const lessonTime = getLessonTime(g);
                const hasTime = !!lessonTime;
                const lessonMin = hasTime ? timeToMinutes(lessonTime) : 9999;
                const isActive = hasTime && lessonMin > currentMinutes && lessonMin <= currentMinutes + 60;
                const isPast = hasTime && lessonMin < currentMinutes;
                const isSelected = selectedGroupId === g.id;
                return (
                  <GroupCard
                    key={g.id}
                    g={g}
                    isSelected={isSelected}
                    isActive={isActive}
                    isPast={isPast}
                    lessonTime={lessonTime}
                    onClick={() => onSelectGroup(g.id)}
                    index={i}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Ertaga */}
        <div className="bg-white/60 rounded-xl px-3 pt-2.5 pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Ertaga — {new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' })}
          </h4>
          <div className="space-y-1.5">
            {groups.length === 0 ? (
              <p className="text-[10px] text-base-content/30 px-1 py-2">Dars yo'q</p>
            ) : (
              groups.map((g, i) => (
                <GroupCard
                  key={g.id}
                  g={g}
                  isSelected={selectedGroupId === g.id}
                  isActive={false}
                  isPast={false}
                  lessonTime={getLessonTime(g)}
                  onClick={() => onSelectGroup(g.id)}
                  index={groups.length + i}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorAttendance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);
  const { data: groupsData } = useMentorGroups();
  // тоже в зависимостях эффекта ниже — держим ссылку стабильной
  const groups = useMemo(() => groupsData?.data || [], [groupsData]);

  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get('groupId');
  const [selectedGroupId, setSelectedGroupId] = useState(urlGroupId || groups[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: rosterData } = useMentorGroupStudents(selectedGroupId);
  // Backend returns camelCase (firstName, lastName, coinBalance), frontend uses snake_case.
  // Зависимость — САМ rosterData (стабилен из react-query), а не `rosterData?.data || []`:
  // литерал `[]` создаётся заново на каждый рендер, из-за чего useMemo пересчитывался
  // всегда, students получал новую ссылку, и эффект на строке ниже (setAttendanceMap)
  // уходил в бесконечный цикл «Maximum update depth exceeded».
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

  // Month navigation
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [saving, setSaving] = useState(false);

  // Generate 14 days for the calendar — start from today if viewing current month, else from 1st
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = (year === now.getFullYear() && month === now.getMonth()) ? now.getDate() : 1;
  const DAYS = Array.from({ length: Math.min(14, daysInMonth - startDay + 1) }, (_, i) => startDay + i);

  // Attendance data keyed by student_id + date
  const [attendanceMap, setAttendanceMap] = useState({});

  // Coin modal state
  const [coinStudent, setCoinStudent] = useState(null);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinSaving, setCoinSaving] = useState(false);

  // Load attendance for the date range
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(DAYS[DAYS.length - 1]).padStart(2, '0')}`;
  const { data: attendanceData } = useMentorAttendance(selectedGroupId, { from, to });
  // Тот же случай, что и со students: ссылка обязана быть стабильной — этот массив
  // стоит в зависимостях эффекта, который вызывает setAttendanceMap.
  const attendance = useMemo(() => attendanceData?.data || [], [attendanceData]);

  // Live: журнал этой группы отметили в другом месте (второй ментор, админ) —
  // перечитываем данные вместо ручного слияния, источник правды остаётся один.
  useAttendanceLive(token, selectedGroupId, useCallback(() => {
    qc.invalidateQueries({ queryKey: ['mentor-attendance'] });
    qc.invalidateQueries({ queryKey: ['mentor-group-students', selectedGroupId] });
  }, [qc, selectedGroupId]));

  // Filter groups by search
  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort groups by lesson_time: future lessons first (soonest first), then past lessons, then no-time groups
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const aTime = getLessonTime(a);
    const bTime = getLessonTime(b);

    // No lesson_time → go to bottom
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;

    const aMinutes = parseInt(aTime.split(':')[0]) * 60 + parseInt(aTime.split(':')[1]);
    const bMinutes = parseInt(bTime.split(':')[0]) * 60 + parseInt(bTime.split(':')[1]);

    const aIsFuture = aMinutes > currentMinutes;
    const bIsFuture = bMinutes > currentMinutes;

    // Future lessons first
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;

    // Both future or both past → sort by time ascending
    return aMinutes - bMinutes;
  });

  // Update selectedGroupId when groups first load
  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Clear map when group/month changes
  useEffect(() => {
    setAttendanceMap({});
  }, [selectedGroupId, month, year]);

  // Initialize attendance map: all students × all days = null, then override with API data
  useEffect(() => {
    const fullMap = {};
    students.forEach((s) => {
      DAYS.forEach((d) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        fullMap[`${s.id}_${dateKey}`] = null;
      });
    });
    attendance.forEach((a) => {
      // Backend returns 'lesson_date', mock has 'date'
      const attDate = a.date ?? a.lesson_date;
      if (!attDate) return;
      const key = `${a.student_id}_${attDate}`;
      if (fullMap[key] !== undefined) fullMap[key] = a.status;
    });
    setAttendanceMap(fullMap);
  }, [students, month, year, attendance]);

  const toggleDay = (studentId, day) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const key = `${studentId}_${dateKey}`;
    setAttendanceMap((prev) => {
      const current = prev[key];
      // null → present → absent → null
      const next = current === null ? 'present' : current === 'present' ? 'absent' : null;
      return { ...prev, [key]: next };
    });
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const handleSave = async () => {
    if (!selectedGroupId) return;
    setSaving(true);
    try {
      const byDate = {};
      Object.entries(attendanceMap).forEach(([key, status]) => {
        if (!status) return;
        const [sId, ...dateParts] = key.split('_');
        const dateStr = dateParts.join('_');
        if (!byDate[dateStr]) byDate[dateStr] = [];
        byDate[dateStr].push({ studentId: sId, status });
      });

      for (const [dateStr, records] of Object.entries(byDate)) {
        await api.mentorMarkAttendance(token, selectedGroupId, {
          lessonDate: dateStr,
          records,
        });
      }

      qc.invalidateQueries({ queryKey: ['mentor-attendance'] });
      qc.invalidateQueries({ queryKey: ['mentor-group-students'] });
      setToast({ message: 'Davomat saqlandi!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status, dateDay) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`;
    const isPast = dateStr < today;

    if (status === 'present') {
      // Past date = corrected entry -> yellow
      if (isPast) return 'bg-warning/20 text-warning border-warning/30';
      return 'bg-success/15 text-success border-success/30';
    }
    if (status === 'absent') return 'bg-danger/15 text-danger border-danger/30';
    return 'border-base-300 text-base-content/30 hover:border-base-content/20';
  };

  const getStatusIcon = (status, dateDay) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`;
    const isPast = dateStr < today;

    if (status === 'present') {
      if (isPast) return <Check size={18} className="text-warning" />;
      return <Check size={18} className="text-success" />;
    }
    if (status === 'absent') return <X size={18} className="text-danger" />;
    return <Plus size={16} className="text-base-content/30" />;
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const timeToMinutes = (t) => {
    if (!t) return 9999;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="-m-4 sm:-m-7 h-[calc(100vh-4rem)] flex overflow-hidden">
          {/* ─── LEFT: Groups sidebar ─── */}
          <GroupSidebar
            groups={sortedGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            timeToMinutes={timeToMinutes}
            currentMinutes={currentMinutes}
          />

          {/* ─── RIGHT: Attendance panel ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedGroupId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-base-content/40">
                <CalendarCheck size={48} className="opacity-30" />
                <p className="text-sm">Guruhni tanlang</p>
              </div>
            ) : (
              <div key={selectedGroupId} className="flex flex-col min-h-0 flex-1">
                {/* Top bar: Group info + month nav */}
                <div className="shrink-0 px-6 py-4 border-b border-base-200 flex items-center justify-between flex-wrap gap-3 bg-base-100/80">
                  <div>
                    <h3 className="text-base font-bold">{selectedGroup?.name || ''}</h3>
                    <p className="text-sm text-base-content/50">
                      {selectedGroup?.subject || ''} · {students.length} o'quvchi
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm btn-square" onClick={prevMonth}>
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-base font-bold min-w-[120px] text-center select-none">
                      {MONTHS[month]} {year}
                    </span>
                    <button className="btn btn-ghost btn-sm btn-square" onClick={nextMonth}>
                      <ChevronRight size={18} />
                    </button>
                    {(month !== now.getMonth() || year !== now.getFullYear()) && (
                      <button
                        className="btn btn-primary btn-sm ml-2"
                        onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
                      >
                        Bugun
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="shrink-0 px-6 py-3 border-b border-base-200 flex items-center justify-between bg-base-100/60">
                  <div className="text-sm text-base-content/50 font-medium">
                    {students.length} o'quvchi
                  </div>
                  {DAYS.includes(now.getDate()) && (
                    <button
                      className="btn btn-ghost btn-sm gap-1.5 text-success"
                      onClick={() => {
                        const todayDate = now.getDate();
                        setAttendanceMap((prev) => {
                          const next = { ...prev };
                          students.forEach((s) => {
                            const key = `${s.id}_${year}-${String(month + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
                            next[key] = 'present';
                          });
                          return next;
                        });
                      }}
                    >
                      <Check size={14} /> Hammasini keldi qilish
                    </button>
                  )}
                </div>

                {/* Attendance table */}
                <div className="overflow-x-auto flex-1">
                  {students.length === 0 ? (
                    <div className="text-center py-16 text-base-content/40">
                      <p>Bu guruhda o'quvchilar yo'q</p>
                    </div>
                  ) : (
                    <table className="table w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 bg-base-100 z-10 min-w-[200px] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-base-content/50">
                            O'quvchi
                          </th>
                          {DAYS.map((d) => {
                            const date = new Date(year, month, d);
                            const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const isPast = dateStr < today;
                            return (
                              <th
                                key={d}
                                className={`w-14 px-3 py-4 text-center text-xs font-medium border-l border-base-200 ${
                                  isPast ? 'text-warning/60' : 'text-base-content/40'
                                }`}
                              >
                                <div className="uppercase tracking-wider">{dayName}</div>
                                <div className={`text-base font-bold mt-1 ${isPast ? 'text-warning/70' : 'text-base-content/70'}`}>
                                  {d}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, sIdx) => (
                          <tr key={s.id} className={`hover:bg-base-200/40 ${sIdx !== students.length - 1 ? 'border-b border-base-200' : ''}`}>
                            <td className="sticky left-0 bg-base-100 z-10 px-5 py-3">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-primary/20 text-primary-content grid place-items-center text-sm font-bold shrink-0">
                                  {s.first_name?.[0]}{s.last_name?.[0]}
                                </span>
                                <div>
                                  <div className="text-sm font-semibold">{s.first_name} {s.last_name}</div>
                                  {s.status !== 'active' && (
                                    <span className="text-xs text-danger font-medium">
                                      {s.status === 'frozen' ? 'Muzlatilgan' : s.status}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-1">
                                  <span className="text-sm font-bold text-amber-500">{s.coin_balance ?? 0}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setCoinStudent(s); setCoinAmount(''); }}
                                    className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 grid place-items-center transition-colors"
                                    title="Coin berish"
                                  >
                                    <Coins size={14} />
                                  </button>
                                </div>
                              </div>
                            </td>
                            {DAYS.map((d) => {
                              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                              const status = attendanceMap[`${s.id}_${dateKey}`];
                              return (
                                <td key={d} className="px-3 py-3 text-center border-l border-base-200">
                                  <button
                                    onClick={() => toggleDay(s.id, d)}
                                    className={`mx-auto w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-110 hover:shadow-md ${getStatusStyle(status, d)}`}
                                  >
                                    {getStatusIcon(status, d)}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Save button */}
                {students.length > 0 && (
                  <div className="shrink-0 px-6 py-4 border-t border-base-200 flex justify-end bg-base-100/80">
                    <button
                      className="btn btn-primary gap-2 px-6"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <span className="loading loading-spinner loading-sm" /> : <Check size={18} />}
                      Saqlash
                    </button>
                  </div>
                )}

                {/* Coin modal */}
                {coinStudent && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
                    onClick={() => setCoinStudent(null)}
                  >
                    <div
                      className="bg-base-100 rounded-2xl shadow-xl p-5 w-72 mx-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 grid place-items-center text-sm font-bold">
                          <Coins size={18} />
                        </span>
                        <div>
                          <h3 className="font-bold text-sm">{coinStudent.first_name} {coinStudent.last_name}</h3>
                          <p className="text-xs text-base-content/50">Balans: <span className="font-semibold text-amber-500">{coinStudent.coin_balance ?? 0} 🪙</span></p>
                        </div>
                      </div>

                      {/* Qo'shish tugmalari */}
                      <p className="text-xs font-semibold text-green-600 mb-2">Qo'shish</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15, 20, 25, 30].map((val) => (
                          <button
                            key={val}
                            className="btn btn-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200 gap-0"
                            disabled={coinSaving}
                            onClick={async () => {
                              setCoinSaving(true);
                              try {
                                await api.mentorGrantCoins(token, {
                                  studentId: coinStudent.id,
                                  amount: val,
                                  reason: 'Coin',
                                });
                                qc.invalidateQueries({ queryKey: ['mentor-group-students', selectedGroupId] });
                                setCoinStudent(null);
                              } catch (err) {
                              setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
                            } finally {
                              setCoinSaving(false);
                            }
                            }}
                          >
                            +{val}
                          </button>
                        ))}
                      </div>

                      {/* O'rtada yozish inputi */}
                      <div className="my-3 flex items-center gap-2">
                        <input
                          type="number"
                          className="input input-bordered input-sm flex-1 text-center"
                          placeholder="Miqdor"
                          value={coinAmount}
                          onChange={(e) => setCoinAmount(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn btn-sm btn-primary gap-1"
                          disabled={coinSaving || !coinAmount}
                          onClick={async () => {
                            const val = Number(coinAmount);
                            if (!val || isNaN(val)) return;
                            setCoinSaving(true);
                            try {
                              await api.mentorGrantCoins(token, {
                                studentId: coinStudent.id,
                                amount: val,
                                reason: 'Coin',
                              });
                              qc.invalidateQueries({ queryKey: ['mentor-group-students', selectedGroupId] });
                              setCoinStudent(null);
                            } catch (err) {
                              setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
                            } finally {
                              setCoinSaving(false);
                            }
                          }}
                        >
                          <Star size={13} /> Berish
                        </button>
                      </div>

                      {/* Ayirish tugmalari */}
                      <p className="text-xs font-semibold text-red-600 mb-2">Ayirish</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15, 20, 25, 30].map((val) => (
                          <button
                            key={val}
                            className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-200 gap-0"
                            disabled={coinSaving}
                            onClick={async () => {
                              setCoinSaving(true);
                              try {
                                await api.mentorGrantCoins(token, {
                                  studentId: coinStudent.id,
                                  amount: -val,
                                  reason: 'Coin',
                                });
                                qc.invalidateQueries({ queryKey: ['mentor-group-students', selectedGroupId] });
                                setCoinStudent(null);
                              } catch (err) {
                              setToast({ message: err.message || 'Xatolik yuz berdi', type: 'error' });
                            } finally {
                              setCoinSaving(false);
                            }
                            }}
                          >
                            -{val}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4">
                        <button
                          className="btn btn-sm w-full"
                          onClick={() => setCoinStudent(null)}
                        >
                          Bekor qilish
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

      {/* Toast notification */}
      <Toast
        message={toast?.message}
        type={toast?.type || 'success'}
        visible={!!toast}
        onClose={closeToast}
      />
    </div>
  );
}
