import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Plus, CalendarCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader.jsx';
import { useMentorGroups, useMentorGroupStudents, useMentorAttendance } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
];

export default function MentorAttendance() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: groupsData } = useMentorGroups();
  const groups = groupsData?.data || [];

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const { data: rosterData } = useMentorGroupStudents(selectedGroupId);
  const students = rosterData?.data || [];

  // Month navigation
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [saving, setSaving] = useState(false);

  // Generate 14 days for the calendar
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = Array.from({ length: Math.min(14, daysInMonth) }, (_, i) => i + 1);

  // Attendance data keyed by student_id + date
  const [attendanceMap, setAttendanceMap] = useState({});

  // Load attendance for the date range
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(DAYS[DAYS.length - 1]).padStart(2, '0')}`;
  const { data: attendanceData } = useMentorAttendance(selectedGroupId, { from, to });
  const attendance = attendanceData?.data || [];

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
    // Override with existing attendance from API.
    // Бэкенд отдаёт lesson_date как timestamp — берём локальные части даты (YYYY-MM-DD),
    // чтобы ключ совпал с сеткой (иначе метки не находятся).
    attendance.forEach((a) => {
      const raw = a.lesson_date || a.date;
      let dateKey = raw;
      if (raw) {
        const d = new Date(raw);
        dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      const key = `${a.student_id}_${dateKey}`;
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
      // Group records by date
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

  const getStatusStyle = (status) => {
    if (status === 'present') return 'bg-success/15 text-success border-success/30';
    if (status === 'absent') return 'bg-danger/15 text-danger border-danger/30';
    return 'border-base-300 text-base-content/30 hover:border-base-content/20';
  };

  const getStatusIcon = (status) => {
    if (status === 'present') return <Check size={14} className="text-success" />;
    if (status === 'absent') return <X size={14} className="text-danger" />;
    return <Plus size={12} className="text-base-content/30" />;
  };

  return (
    <div>
      <PageHeader title="Davomat" subtitle="Kunlik davomat jadvali">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            Keldi
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" />
            Kelmadi
          </span>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="form-control">
          <label className="label-text text-[11px] text-base-content/50 mb-1">Guruh</label>
          <select
            className="select select-bordered select-sm w-52"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">Guruhni tanlang</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label-text text-[11px] text-base-content/50 mb-1">Oy</label>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={prevMonth}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold min-w-[100px] text-center select-none">
              {MONTHS[month]} {year}
            </span>
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={nextMonth}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 overflow-hidden">
        <div className="overflow-x-auto">
          {!selectedGroupId ? (
            <div className="text-center py-16 text-base-content/40">
              <CalendarCheck size={48} className="mx-auto mb-3 opacity-30" />
              <p>Guruhni tanlang</p>
            </div>
          ) : students.length === 0 ? (
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
                    return (
                      <th
                        key={d}
                        className="w-10 px-2 py-3 text-center text-[10px] font-medium text-base-content/40 border-l border-base-200"
                      >
                        <div className="uppercase">{dayName}</div>
                        <div className="text-sm font-bold text-base-content/70 mt-0.5">{d}</div>
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
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </span>
                        <div>
                          <div className="text-[13px] font-medium">{s.firstName} {s.lastName}</div>
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
                            className={`mx-auto w-7 h-7 flex items-center justify-center rounded-md border transition-all hover:scale-110 ${getStatusStyle(status)}`}
                          >
                            {getStatusIcon(status)}
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
      </div>

      {selectedGroupId && students.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            className="btn btn-primary gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Check size={16} />}
            Saqlash
          </button>
        </div>
      )}
    </div>
  );
}
