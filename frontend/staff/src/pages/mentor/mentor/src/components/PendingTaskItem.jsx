export default function PendingTaskItem({ label, tag, tagTone = "danger", isLast }) {
  const tagClass = tagTone === "danger" ? "bg-danger-soft text-danger" : "bg-surface text-ink-faint";
  return (
    <div className={`flex items-center justify-between py-2.5 ${!isLast ? "border-b border-line" : ""}`}>
      <span className="text-[12px] text-ink">{label}</span>
      {tag && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagClass}`}>{tag}</span>}
    </div>
  );
}
