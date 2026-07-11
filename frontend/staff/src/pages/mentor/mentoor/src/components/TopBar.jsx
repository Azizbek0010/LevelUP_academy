import { Search, Bell, HelpCircle } from "lucide-react";

export default function TopBar({ title, right }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="font-display text-[22px] font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        {right}
        <div className="flex h-[38px] items-center gap-2 rounded-lg border border-line bg-surface-card px-3">
          <Search size={15} className="text-ink-faint" />
          <input
            placeholder="Поиск студентов..."
            className="w-40 bg-transparent text-[13px] text-ink outline-none placeholder:text-[13px] placeholder:text-ink-faint"
          />
        </div>
        <button className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-line bg-surface-card">
          <Bell size={16} className="text-ink-soft" />
        </button>
        <button className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-line bg-surface-card">
          <HelpCircle size={16} className="text-ink-soft" />
        </button>
      </div>
    </div>
  );
}
