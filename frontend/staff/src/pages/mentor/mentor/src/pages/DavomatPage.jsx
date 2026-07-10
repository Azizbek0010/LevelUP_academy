import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Plus } from "lucide-react";
import TopBar from "../components/TopBar";
import StudentAvatar from "../components/StudentAvatar";
import { ATTENDANCE_STUDENTS } from "../mockData";

const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

export default function DavomatPage() {
  const [data, setData] = useState(
    ATTENDANCE_STUDENTS.map((s) => ({ ...s, status: [...s.status] }))
  );

  const toggle = (studentIdx, dayIdx) => {
    setData((prev) =>
      prev.map((s, i) => {
        if (i !== studentIdx) return s;
        const next = [...s.status];
        next[dayIdx] = next[dayIdx] === true ? false : next[dayIdx] === false ? null : true;
        return { ...s, status: next };
      })
    );
  };

  return (
    <div>
      <TopBar title="Davomat" />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="mb-1 text-[11px] text-ink-faint">Группа</div>
            <select className="rounded-lg border border-line bg-surface-card px-3 py-2 text-[13px] text-ink outline-none">
              <option>Frontend Development 202</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-[11px] text-ink-faint">Месяц</div>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-2 py-2">
              <ChevronLeft size={14} className="text-ink-faint" />
              <span className="text-[13px] text-ink">Июль 2026</span>
              <ChevronRight size={14} className="text-ink-faint" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-success" /> Был
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Не был
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="p-3 text-left text-[12px] font-medium text-ink-faint">Студент</th>
              {DAYS.map((d) => (
                <th key={d} className="w-9 p-2 text-center text-[11px] font-medium text-ink-faint">
                  ПН
                  <br />
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((student, sIdx) => (
              <tr key={student.name} className={sIdx !== data.length - 1 ? "border-b border-line" : ""}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <StudentAvatar src={student.img} name={student.name} size={28} ring={false} />
                    <span className="text-[13px] text-ink">{student.name}</span>
                  </div>
                </td>
                {student.status.map((val, dIdx) => (
                  <td key={dIdx} className="p-2 text-center">
                    <button
                      onClick={() => toggle(sIdx, dIdx)}
                      className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                        val === true ? "bg-success-soft" : val === false ? "bg-danger-soft" : "bg-surface"
                      }`}
                    >
                      {val === true && <Check size={13} className="text-success" />}
                      {val === false && <X size={13} className="text-danger" />}
                      {val === null && <Plus size={12} className="text-ink-faint" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-accent-ink shadow-sm transition-shadow hover:shadow-md">
          Сохранить изменения
        </button>
      </div>
    </div>
  );
}
