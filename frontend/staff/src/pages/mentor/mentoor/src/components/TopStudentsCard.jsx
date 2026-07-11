import { Trophy } from "lucide-react";
import StudentAvatar from "./StudentAvatar";

export default function TopStudentsCard({ students }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Trophy size={14} className="text-accent-dark" />
        <h2 className="font-display text-[15px] font-semibold text-ink">Top Students</h2>
      </div>

      <div className="flex flex-col gap-3">
        {students.map((s, i) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="w-4 text-[11px] font-semibold text-ink-faint">{i + 1}</span>
            <StudentAvatar src={s.img} name={s.name} size={34} ring={false} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-ink">{s.name}</div>
              <div className="truncate text-[11px] text-ink-faint">{s.group}</div>
            </div>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
              {s.score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
