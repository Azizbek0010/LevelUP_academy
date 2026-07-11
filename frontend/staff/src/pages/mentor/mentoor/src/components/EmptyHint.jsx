import { Plus } from "lucide-react";

export default function EmptyHint({ text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-soft px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
        <Plus size={16} className="text-ink-faint" />
      </div>
      <p className="text-[13px] text-ink-faint">{text}</p>
    </div>
  );
}
