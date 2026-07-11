import { ChevronRight, Play } from "lucide-react";
import StudentAvatar from "./StudentAvatar";

export default function GroupCard({
  icon,
  badge,
  badgeTone = "accent",
  title,
  meta,
  students = [],
  extraCount,
  wide,
}) {
  const badgeClass =
    badgeTone === "accent"
      ? "bg-accent text-accent-ink"
      : badgeTone === "violet"
      ? "bg-[#e7e2fb] text-[#6c53d1]"
      : "bg-surface text-ink-soft";

  return (
    <div
      className={`rounded-2xl border border-line bg-surface-card p-4 shadow-sm transition-shadow hover:shadow-md ${
        wide ? "flex items-center justify-between" : ""
      }`}
    >
      <div className={wide ? "flex items-center gap-3" : ""}>
        <div className={`flex items-center ${wide ? "" : "mb-4 justify-between"}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-[16px]">
            {icon}
          </span>
          {!wide && badge && (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${badgeClass}`}>{badge}</span>
          )}
        </div>
        <div>
          <div className="font-display text-[15px] font-semibold text-ink">{title}</div>
          <div className="text-[12px] text-ink-faint">{meta}</div>
        </div>
      </div>

      {wide ? (
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {students.map((s) => (
              <StudentAvatar key={s.name} src={s.img} name={s.name} size={28} />
            ))}
            {extraCount && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[9px] font-semibold text-ink-soft ring-2 ring-surface-card">
                +{extraCount}
              </span>
            )}
          </div>
          {badge && (
            <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium text-ink-soft">
              {badge}
            </span>
          )}
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-white transition-transform hover:scale-105">
            <Play size={12} fill="currentColor" />
          </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {students.map((s) => (
              <StudentAvatar key={s.name} src={s.img} name={s.name} size={24} />
            ))}
            {extraCount && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-[9px] font-semibold text-ink-soft ring-2 ring-surface-card">
                +{extraCount}
              </span>
            )}
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-white transition-transform hover:scale-105">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
