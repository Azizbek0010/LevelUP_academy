import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Plus, Loader2 } from "lucide-react";
import TopBar from "../components/TopBar";
import StudentAvatar from "../components/StudentAvatar";
import EmptyHint from "../components/EmptyHint";
import { api, getToken } from "../api";

export default function DavomatPage({ token, user }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const isPastDate = selectedDate < today;

  // Load groups on mount
  useEffect(() => {
    const t = token || getToken();
    if (!t) return;
    api
      .getGroups(t)
      .then((res) => {
        const gs = res.data || [];
        setGroups(gs);
        if (gs.length > 0) {
          setSelectedGroupId(gs[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingGroups(false));
  }, [token]);

  // Load students + attendance when group or date changes
  useEffect(() => {
    const t = token || getToken();
    if (!t || !selectedGroupId) return;

    setLoadingAttendance(true);
    setError("");

    Promise.all([
      api.getGroupStudents(t, selectedGroupId),
      api.getAttendance(t, selectedGroupId, { date: selectedDate }),
    ])
      .then(([studentsRes, attendanceRes]) => {
        const studentList = studentsRes.data || [];
        const records = attendanceRes.data || [];

        // Build attendance map: student_id -> status
        const attMap = {};
        records.forEach((r) => {
          attMap[r.student_id] = r.status;
        });

        setStudents(studentList);
        setAttendance(attMap);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingAttendance(false));
  }, [token, selectedGroupId, selectedDate]);

  const toggleStatus = (studentId) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      // Cycle: undefined -> present -> absent -> late -> undefined
      let next;
      if (!current) next = "present";
      else if (current === "present") next = "absent";
      else if (current === "absent") next = "late";
      else next = undefined;
      return { ...prev, [studentId]: next };
    });
  };

  const handleSave = async () => {
    const t = token || getToken();
    if (!t || !selectedGroupId) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status,
    }));

    try {
      await api.markAttendance(t, selectedGroupId, {
        lessonDate: selectedDate,
        records,
      });
      setSuccessMsg("Davomat saqlandi!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = (status) => {
    if (status === "present") {
      // Past date = corrected entry -> show warning (yellow)
      if (isPastDate) return <Check size={13} className="text-warning" />;
      return <Check size={13} className="text-success" />;
    }
    if (status === "absent") return <X size={13} className="text-danger" />;
    if (status === "late") return <span className="text-[11px] font-semibold text-warning">L</span>;
    return <Plus size={12} className="text-ink-faint" />;
  };

  const statusBg = (status) => {
    if (status === "present") {
      // Past date = corrected entry -> show warning bg (yellow)
      if (isPastDate) return "bg-warning-soft";
      return "bg-success-soft";
    }
    if (status === "absent") return "bg-danger-soft";
    if (status === "late") return "bg-warning-soft";
    return "bg-surface";
  };

  // Navigate date
  const changeDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  return (
    <div>
      <TopBar title="Davomat" />

      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="mb-1 text-[11px] text-ink-faint">Guruh</div>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="rounded-lg border border-line bg-surface-card px-3 py-2 text-[13px] text-ink outline-none"
            >
              {groups.length === 0 && <option>Guruhlar topilmadi</option>}
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-ink-faint">Sana</div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-2 py-2">
              <button onClick={() => changeDate(-1)}>
                <ChevronLeft size={14} className="text-ink-faint" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[140px] bg-transparent text-[13px] text-ink outline-none"
              />
              <button onClick={() => changeDate(1)}>
                <ChevronRight size={14} className="text-ink-faint" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${isPastDate ? 'bg-warning' : 'bg-success'}`} />
            {isPastDate ? "Bor (keyin)" : "Bor"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Yo'q
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Kechikdi
          </span>
        </div>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-danger-soft px-4 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg bg-success-soft px-4 py-2 text-[13px] text-success">
          {successMsg}
        </div>
      )}

      {/* Attendance Table */}
      {loadingGroups || loadingAttendance ? (
        <div className="flex items-center justify-center py-20 text-ink-faint">
          Yuklanmoqda...
        </div>
      ) : students.length === 0 ? (
        <EmptyHint text="Bu guruhda hali studentlar yo'q yoki sana uchun davomat topilmadi" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="p-3 text-left text-[12px] font-medium text-ink-faint">
                  Student
                </th>
                <th className="w-28 p-2 text-center text-[12px] font-medium text-ink-faint">
                  Holati
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, sIdx) => {
                const status = attendance[s.id];
                return (
                  <tr
                    key={s.id}
                    className={sIdx !== students.length - 1 ? "border-b border-line" : ""}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <StudentAvatar
                          src={null}
                          name={`${s.first_name || ""} ${s.last_name || ""}`}
                          size={28}
                          ring={false}
                        />
                        <span className="text-[13px] text-ink">
                          {s.first_name || ""} {s.last_name || ""}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => toggleStatus(s.id)}
                        className={`mx-auto flex h-8 w-20 items-center justify-center gap-1.5 rounded-md text-[12px] transition-colors ${statusBg(
                          status
                        )}`}
                      >
                        {statusIcon(status)}
                        <span className="text-ink-faint">
                          {status === "present"
                            ? "Bor"
                            : status === "absent"
                            ? "Yo'q"
                            : status === "late"
                            ? "Kechikdi"
                            : "Belgilash"}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loadingGroups || loadingAttendance || students.length === 0}
          className="flex items-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            "Davomatni saqlash"
          )}
        </button>
      </div>
    </div>
  );
}
