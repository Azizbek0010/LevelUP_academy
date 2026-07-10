export default function HistoryFeed({ entries }) {
  return (
    <div className="rounded-xl border border-line bg-surface-card p-4">
      <div className="mb-3 font-display text-[13px] font-semibold text-ink">История операций</div>
      {entries.map((e, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 py-3 ${
            i < entries.length - 1 ? "border-b border-line" : ""
          }`}
        >
          <span
            className={`mt-1 h-2 w-2 rounded-full ${e.positive ? "bg-success" : "bg-danger"}`}
          />
          <div>
            <div className="text-[12px] font-medium text-ink">{e.title}</div>
            <div className="text-[11px] text-ink-faint">{e.by}</div>
          </div>
          <span className="ml-auto text-[11px] text-ink-faint">{e.when}</span>
        </div>
      ))}
      {entries.length === 0 && (
        <p className="pt-1 text-center text-[12px] text-ink-faint">Новых операций пока нет</p>
      )}
    </div>
  );
}
