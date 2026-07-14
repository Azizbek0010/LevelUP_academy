import { LogOut, GraduationCap } from "lucide-react";
import { NAV_ITEMS } from "../nav";

export default function Sidebar({ active, setActive, user, onLogout }) {
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "M"
    : "М";

  const fullName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Ментор"
    : "Ментор";

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col justify-between bg-sidebar px-3 py-5 font-body">
      <div>
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-ink">
            <GraduationCap size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display text-[15px] font-bold leading-tight text-white">
              LevelUp
            </div>
            <div className="text-[9px] font-semibold leading-tight tracking-[0.12em] text-ink-faint">
              ACADEMY
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-[13px] transition-colors ${
                  isActive
                    ? "border-accent bg-sidebar-active text-accent"
                    : "border-transparent text-[#c7cbbd] hover:bg-sidebar-active/60"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="mb-3 h-px w-full bg-sidebar-soft" />
        <div className="flex items-center gap-2 px-2 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-ink">
            {initials}
          </div>
          <div>
            <div className="text-[12px] font-medium text-white">{fullName}</div>
            <div className="text-[10px] text-ink-faint">
              {user?.role === "mentor" ? "Ментор" : user?.role || "Ментор"}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#c7cbbd] hover:bg-sidebar-active/60"
        >
          <LogOut size={16} />
          Выход
        </button>
      </div>
    </aside>
  );
}
