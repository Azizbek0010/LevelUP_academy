export default function SubmissionCard({ initials, name, group, time, task, file }) {
  return (
    <div className="rounded-xl border border-accent bg-surface-card p-3">
      <div className="mb-1.5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-ink-soft">
            {initials}
          </div>
          <div>
            <div className="text-[13px] font-medium text-ink">{name}</div>
            <div className="text-[11px] text-ink-faint">{group}</div>
          </div>
        </div>
        <span className="text-[11px] text-ink-faint">{time}</span>
      </div>
      <div className="mb-2 text-[13px] font-medium text-ink">{task}</div>
      <span className="inline-block rounded-md bg-surface px-2 py-0.5 text-[11px] text-ink-soft">
        {file}
      </span>
    </div>
  );
}
