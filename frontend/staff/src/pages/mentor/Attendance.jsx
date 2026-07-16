import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Plus, CalendarCheck, Users, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader.jsx';
import { useMentorGroups, useMentorGroupStudents, useMentorAttendance } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

function GroupSidebar({ groups, selectedGroupId, onSelectGroup, searchQuery, onSearchChange }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-64 shrink-0 border-r border-base-300 bg-base-100 flex flex-col rounded-l-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-base-200">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Users size={15} /> Guruhlar
          </h3>
          <span className="badge badge-ghost badge-xs">{groups.length} ta</span>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input input-bordered input-xs w-full pl-8 text-xs"
          />
        </div>
      </div>

      {/* Group list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {groups.length === 0 ? (
          <div className="text-center py-10 text-base-content/40 text-xs">
            Guruhlar topilmadi
          </div>
        ) : (
          <div className="space-y-0.5 px-1.5">
            {groups.map((g) => {
              const isActive = selectedGroupId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                    isActive
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'hover:bg-base-200 text-base-content'
                  }`}
                >
                  {/* Avatar */}
                  <span className={`w-9 h-9 rounded-xl grid place-items-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-primary-content/20 text-primary-content'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {(g.name?.[0] || '?').toUpperCase()}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${isActive ? 'text-primary-content' : ''}`}>
                      {g.name}
                    </div>
                    <div className={`text-[11px] mt-0.5 truncate ${
                      isActive ? 'text-primary-content/60' : 'text-base-content/40'
                    }`}>
                      {g.subject || 'Fan'} · {g.students?.length || g.students_count || 0} o'quvchi
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MentorAttendance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: groupsData } = useMentorGroups();
  const groups = groupsData?.data || [];

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: rosterData } = useMentorGroupStudents(selectedGroupId);
  const students = rosterData?.data || [];

  // Month navigation
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [saving, setSaving] = useState(false);

  // Generate 14 days for the calendar
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = Array.from({ length: Math.min(14, daysInMonth) }, (_, i) => i + 1);

  // Attendance data keyed by student_id + date
  const [attendanceMap, setAttendanceMap] = useState({});

  // Load attendance for the date range
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(DAYS[DAYS.length - 1]).padStart(2, '0')}`;
  const { data: attendanceData } = useMentorAttendance(selectedGroupId, { from, to });
  const attendance = attendanceData?.data || [];

  // Filter groups by search
  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      const key = `${a.student_id}_${a.date}`;
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
      alert('Davomat saqlandi!');
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
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
      if (isPast) return <Check size={14} className="text-warning" />;
      return <Check size={14} className="text-success" />;
    }
    if (status === 'absent') return <X size={14} className="text-danger" />;
    return <Plus size={12} className="text-base-content/30" />;
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div>
      <PageHeader title="Davomat" subtitle="Kunlik davomat jadvali">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            Keldi
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            Keldi (keyin)
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" />
            Kelmadi
          </span>
        </div>
      </PageHeader>

      <div className="card bg-base-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* ─── LEFT: Groups sidebar ─── */}
          <GroupSidebar
            groups={filteredGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* ─── RIGHT: Attendance panel ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedGroupId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-base-content/40">
                <CalendarCheck size={48} className="opacity-30" />
                <p className="text-sm">Guruhni tanlang</p>
              </div>
            ) : (
              <>
                {/* Top bar: Group info + month nav */}
                <div className="shrink-0 px-5 py-3 border-b border-base-200 flex items-center justify-between flex-wrap gap-2 bg-base-100/80">
                  <div>
                    <h3 className="text-sm font-bold">{selectedGroup?.name || ''}</h3>
                    <p className="text-xs text-base-content/50">
                      {selectedGroup?.subject || ''} · {students.length} o'quvchi
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-xs btn-square" onClick={prevMonth}>
                      <ChevronLeft size={15} />
                    </button>
                    <span className="text-sm font-semibold min-w-[100px] text-center select-none">
                      {MONTHS[month]} {year}
                    </span>
                    <button className="btn btn-ghost btn-xs btn-square" onClick={nextMonth}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
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
                          <th className="sticky left-0 bg-base-100 z-10 min-w-[160px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-base-content/50">
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
                                className={`w-10 px-2 py-3 text-center text-[10px] font-medium border-l border-base-200 ${
                                  isPast ? 'text-warning/60' : 'text-base-content/40'
                                }`}
                              >
                                <div className="uppercase">{dayName}</div>
                                <div className={`text-sm font-bold mt-0.5 ${isPast ? 'text-warning/70' : 'text-base-content/70'}`}>
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
                            <td className="sticky left-0 bg-base-100 z-10 px-4 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary-content grid place-items-center text-xs font-bold shrink-0">
                                  {s.first_name?.[0]}{s.last_name?.[0]}
                                </span>
                                <div>
                                  <div className="text-[13px] font-medium">{s.first_name} {s.last_name}</div>
                                  {s.status !== 'active' && (
                                    <span className="text-[10px] text-danger font-medium">
                                      {s.status === 'frozen' ? 'Muzlatilgan' : s.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {DAYS.map((d) => {
                              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                              const status = attendanceMap[`${s.id}_${dateKey}`];
                              return (
                                <td key={d} className="px-2 py-2 text-center border-l border-base-200">
                                  <button
                                    onClick={() => toggleDay(s.id, d)}
                                    className={`mx-auto w-7 h-7 flex items-center justify-center rounded-md border transition-all hover:scale-110 ${getStatusStyle(status, d)}`}
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
                  <div className="shrink-0 px-5 py-3 border-t border-base-200 flex justify-end bg-base-100/80">
                    <button
                      className="btn btn-primary btn-sm gap-2"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? <span className="loading loading-spinner loading-sm" /> : <Check size={16} />}
                      Saqlash
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
