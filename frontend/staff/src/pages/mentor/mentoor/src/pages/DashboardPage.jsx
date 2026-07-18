import { useEffect, useState } from "react";
import { Bell, Calendar, Users, ClipboardList, Wallet, Video, Plus } from "lucide-react";
import StatCard from "../components/StatCard";
import GroupCard from "../components/GroupCard";
import PendingTaskItem from "../components/PendingTaskItem";
import TopStudentsCard from "../components/TopStudentsCard";
import EmptyHint from "../components/EmptyHint";
import { api, getToken } from "../api";

export default function DashboardPage({ token, user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = token || getToken();
    if (!t) return;

    api
      .getGroups(t)
      .then((res) => {
        setGroups(res.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const totalStudents = groups.reduce((sum, g) => sum + (g.students_count || 0), 0);
  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-faint">
        Yuklanmoqda...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="rounded-lg bg-danger-soft px-6 py-4 text-[13px] text-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[22px] font-semibold text-ink">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-card shadow-sm">
            <Bell size={15} className="text-ink-soft" />
          </button>
          <div className="h-5 w-px bg-line" />
          <div className="flex items-center gap-2 text-[13px] text-ink-soft">
            <span>{today}</span>
            <Calendar size={15} className="text-ink-faint" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatCard
              label="Active Students"
              value={String(totalStudents)}
              icon={Users}
              footer={`${groups.length} ta guruh`}
            />
            <StatCard
              label="Homework to Grade"
              value="—"
              icon={ClipboardList}
              footer={
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium text-danger">
                  PRIORITY
                </span>
              }
            />
            <StatCard
              label="My Groups"
              value={String(groups.length)}
              icon={Wallet}
              footer="Barcha guruhlar"
              highlight
            />
          </div>

          {/* My Groups */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-semibold text-ink">My Groups</h2>
          </div>

          {groups.length === 0 ? (
            <EmptyHint text="Sizda hali guruhlar yo'q" />
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-4">
              {groups.slice(0, 4).map((g) => (
                <GroupCard
                  key={g.id}
                  icon="📚"
                  badge={g.subject || "Group"}
                  title={g.name}
                  meta={`${g.students_count || 0} Students`}
                  students={[]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sidebar py-3.5 text-[13px] font-medium text-white shadow-sm transition-shadow hover:shadow-md">
            Launch Virtual Classroom
            <Video size={14} />
          </button>

          {groups.length > 0 && <TopStudentsCard students={[]} />}

          <div className="rounded-2xl border border-line bg-surface-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="font-display text-[14px] font-semibold text-ink">Mening guruhlarim</h2>
            </div>
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-b-0"
              >
                <span className="text-ink">{g.name}</span>
                <span className="text-ink-faint">{g.students_count || 0} talaba</span>
              </div>
            ))}

            {groups.length === 0 && (
              <p className="py-4 text-center text-[12px] text-ink-faint">Guruhlar topilmadi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
