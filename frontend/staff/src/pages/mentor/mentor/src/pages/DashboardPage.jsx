import { Bell, Calendar, Users, ClipboardList, Wallet, Video, Clock, Plus } from "lucide-react";
import StatCard from "../components/StatCard";
import GroupCard from "../components/GroupCard";
import PendingTaskItem from "../components/PendingTaskItem";
import TopStudentsCard from "../components/TopStudentsCard";
import { STUDENTS, TOP_STUDENTS } from "../mockData";

export default function DashboardPage() {
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
            <span>Today, 24 Oct</span>
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
              value="124"
              icon={Users}
              footer="↗ +12% from last month"
            />
            <StatCard
              label="Homework to Grade"
              value="18"
              icon={ClipboardList}
              footer={
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium text-danger">
                  PRIORITY
                </span>
              }
            />
            <StatCard
              label="Salary this Month"
              value="$2,450"
              icon={Wallet}
              footer="Paid via Bank Transfer"
              highlight
            />
          </div>

          {/* My Groups */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[16px] font-semibold text-ink">My Groups</h2>
            <button className="flex items-center gap-1 text-[12px] font-medium text-ink-soft">
              View All →
            </button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <GroupCard
              icon="🅰️"
              badge="Advanced"
              title="Advanced English A1"
              meta="24 Students • Mon, Wed, Fri"
              students={STUDENTS.slice(0, 3)}
              extraCount={21}
            />
            <GroupCard
              icon="🤖"
              badge="Beginner"
              badgeTone="violet"
              title="Robotics Beginners"
              meta="12 Students • Tue, Thu"
              students={STUDENTS.slice(3, 5)}
              extraCount={10}
            />
          </div>

          <GroupCard
            wide
            icon="Σ"
            title="Math Grade 10"
            meta="38 Students • Daily (Mon-Fri)"
            badge="Standard"
            students={STUDENTS.slice(1, 4)}
            extraCount={35}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sidebar py-3.5 text-[13px] font-medium text-white shadow-sm transition-shadow hover:shadow-md">
            Launch Virtual Classroom
            <Video size={14} />
          </button>

          <TopStudentsCard students={TOP_STUDENTS} />

          <div className="rounded-2xl border border-line bg-surface-card p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Clock size={14} className="text-ink-soft" />
              <h2 className="font-display text-[14px] font-semibold text-ink">Pending Tasks</h2>
            </div>
            <PendingTaskItem label="Robotics Quiz Upload" tag="LATE" />
            <PendingTaskItem label="Monthly Progress Report" isLast />

            <button className="mt-3 flex h-9 w-9 items-center justify-center self-end rounded-full bg-sidebar text-white transition-transform hover:scale-105">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
