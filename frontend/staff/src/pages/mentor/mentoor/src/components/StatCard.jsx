export default function StatCard({ label, value, icon: Icon, footer, highlight }) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md ${
        highlight ? "bg-accent text-accent-ink" : "border border-line bg-surface-card text-ink"
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <span className={`text-[13px] font-medium ${highlight ? "text-accent-ink/80" : "text-ink-faint"}`}>
          {label}
        </span>
        {Icon && (
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              highlight ? "bg-accent-ink/15" : "bg-surface"
            }`}
          >
            <Icon size={14} className={highlight ? "text-accent-ink" : "text-ink-soft"} />
          </span>
        )}
      </div>
      <div className="mb-1 font-display text-[26px] font-bold leading-none">{value}</div>
      {footer && (
        <div className={`text-[11px] ${highlight ? "text-accent-ink/70" : "text-ink-faint"}`}>{footer}</div>
      )}
    </div>
  );
}
