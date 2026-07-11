import { Coins } from "lucide-react";
import StudentAvatar from "./StudentAvatar";

export default function StudentCoinRow({ img, name, id, balance, active }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border bg-surface-card p-4 shadow-sm transition-colors ${
        active ? "border-accent" : "border-line"
      }`}
    >
      <div className="flex items-center gap-3">
        <StudentAvatar src={img} name={name} size={36} ring={false} />
        <div>
          <div className="text-[13px] font-medium text-ink">{name}</div>
          <div className="text-[11px] text-ink-faint">ID: #{id}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-ink-faint">Текущий баланс</div>
        <div className="flex items-center justify-end gap-1 text-[15px] font-semibold text-ink">
          {balance} <Coins size={13} className="text-accent-dark" />
        </div>
      </div>
    </div>
  );
}
