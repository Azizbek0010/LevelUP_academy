import { useMemo } from 'react';
import { BookOpen, Users, Clock, CheckSquare, TrendingUp, Bell, Calendar, ArrowRight } from 'lucide-react';
import { useMentorGroups, useMentorAttendance } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Link } from 'react-router-dom';

function getLessonTime(g) {
  if (g.lesson_time) return g.lesson_time;
  return g.schedule?.[0]?.start || null;
}

function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100 transition-all hover:-translate-y-0.5">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">
            {title}
          </div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { data: groupsData, isLoading } = useMentorGroups();
  const groups = groupsData?.data || [];

  const totalStudents = groups.reduce((sum, g) => sum + (g.students || 0), 0);
  const totalHomework = groups.reduce((sum, g) => sum + (g.homework_count || 0), 0);

  // Find active lesson (current time matches a group's lesson time)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activeGroup = groups.find((g) => {
    const lt = getLessonTime(g);
    if (!lt) return false;
    const [h, m] = lt.split(':').map(Number);
    const lessonStart = h * 60 + m;
    const lessonEnd = lessonStart + 60; // 1 hour lesson
    return currentMinutes >= lessonStart && currentMinutes < lessonEnd;
  });

  // Check if attendance was already taken for the active group today
  const todayStr = now.toISOString().split('T')[0];
  const dateParam = useMemo(() => ({ date: todayStr }), [todayStr]);
  const { data: attData } = useMentorAttendance(activeGroup?.id, dateParam);
  // Banner shows when: active lesson exists AND (attendance hasn't been taken yet OR still loading)
  const attendanceTaken = attData?.data && attData.data.length > 0;
  const showBanner = activeGroup && !attendanceTaken;

  return (
    <div>
      <PageHeader title="Mentor paneli" subtitle="Mening guruhlarim va statistika" />

      {showBanner && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-5 py-3 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 grid place-items-center shrink-0">
              <Bell size={16} />
            </span>
            <div>
              <p className="text-sm font-bold text-red-700">
                {activeGroup.name} — dars boshlandi!
              </p>
              <p className="text-xs text-red-500">
                {activeGroup.subject} · Soat {getLessonTime(activeGroup)}
              </p>
            </div>
          </div>
          <Link
            to={`/attendance?groupId=${activeGroup.id}`}
            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none gap-1.5 shrink-0"
          >
            Davomatga o'tish →
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card bg-base-100"><div className="card-body p-5"><div className="skeleton h-20 w-full" /></div></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi Icon={BookOpen} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Guruhlar" value={groups.length} unit="faol" />
          <Kpi Icon={Users} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="O'quvchilar" value={totalStudents} unit="jami" />
          <Kpi Icon={Clock} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Darslar" value="—" unit="haftada" />
          <Kpi Icon={CheckSquare} tint={{ bg: '#FEF9C3', fg: '#854D0E' }} title="DZ lar" value={totalHomework} unit="jami" />
        </div>
      )}

      {/* ─── Today's Schedule Timeline ─── */}
      <div className="card bg-base-100 mt-6 overflow-hidden">
        <div className="card-body p-0">
          <div className="px-5 pt-4 pb-3 border-b border-base-200 flex items-center justify-between">
            <h2 className="card-title text-base flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Bugungi darslar
            </h2>
            <Link to="/attendance" className="btn btn-ghost btn-xs gap-1 text-primary">
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>
          <div className="px-5 py-4">
            {groups.length === 0 ? (
              <p className="text-sm text-base-content/40 py-4 text-center">Bugun darslar yo'q</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-base-200" />
                <div className="space-y-4">
                  {groups
                    .filter((g) => getLessonTime(g))
                    .sort((a, b) => {
                      const aT = getLessonTime(a) || '00:00';
                      const bT = getLessonTime(b) || '00:00';
                      return aT.localeCompare(bT);
                    })
                    .map((g, i) => {
                      const lessonTime = getLessonTime(g);
                      const now = new Date();
                      const currentMin = now.getHours() * 60 + now.getMinutes();
                      const [h, m] = (lessonTime || '00:00').split(':').map(Number);
                      const lessonMin = h * 60 + m;
                      const isNow = lessonMin <= currentMin && lessonMin + 60 > currentMin;
                      const isPast = lessonMin + 60 <= currentMin;
                      const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899'];
                      const color = colors[i % colors.length];
                      return (
                        <div key={g.id} className="relative flex items-start gap-4 group">
                          {/* Timeline dot */}
                          <div className="relative z-10 shrink-0 mt-1">
                            <div
                              className={`w-[15px] h-[15px] rounded-full border-2 transition-all duration-300 ${
                                isNow
                                  ? 'border-transparent animate-pulse'
                                  : isPast
                                  ? 'border-base-300 bg-base-100'
                                  : 'border-transparent'
                              }`}
                              style={{
                                background: isNow
                                  ? `${color}`
                                  : isPast
                                  ? 'transparent'
                                  : `${color}20`,
                                boxShadow: isNow
                                  ? `0 0 0 4px ${color}30`
                                  : 'none',
                              }}
                            />
                          </div>
                          {/* Card */}
                          <div
                            className={`flex-1 rounded-xl border transition-all duration-200 ${
                              isNow
                                ? 'border-l-4 shadow-sm bg-white'
                                : isPast
                                ? 'border-base-200 bg-base-100/50 opacity-60'
                                : 'border-base-200 bg-white hover:shadow-sm'
                            }`}
                            style={isNow ? { borderLeftColor: color } : {}}
                          >
                            <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`shrink-0 w-14 text-center text-sm font-bold py-1.5 rounded-lg ${
                                    isNow ? 'text-white' : 'bg-base-200/70 text-base-content/60'
                                  }`}
                                  style={isNow ? { background: color } : {}}
                                >
                                  {lessonTime}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-sm font-bold truncate">{g.name}</div>
                                  <div className="text-xs text-base-content/45">
                                    {g.subject || 'Fan'} · {g.students || 0} o'quvchi
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isNow && (
                                  <span className="badge badge-sm gap-1 text-white border-none" style={{ background: color }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Davom etmoqda
                                  </span>
                                )}
                                {isPast && (
                                  <span className="badge badge-ghost badge-sm text-base-content/40">Tugagan</span>
                                )}
                                <Link
                                  to={`/attendance?groupId=${g.id}`}
                                  className="btn btn-ghost btn-xs"
                                >
                                  Davomat
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Groups ─── */}
      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <h2 className="card-title text-base mb-3 flex items-center gap-2">
            <TrendingUp size={18} /> Mening guruhlarim
          </h2>

          {groups.length === 0 ? (
            <p className="text-base-content/40 text-sm py-6 text-center">
              Sizda hali guruhlar yo'q
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div key={g.id} className="rounded-xl border border-base-300 p-4 hover:bg-base-200/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm">{g.name}</h3>
                      <p className="text-xs text-base-content/50 mt-0.5">{g.subject}</p>
                    </div>
                    {g.is_archived && <span className="badge badge-ghost text-[10px]">Arxiv</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-base-content/60">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {g.students || 0} o'quvchi
                    </span>
                    {g.monthly_price && (
                      <span className="font-semibold text-base-content/80">
                        {Number(g.monthly_price).toLocaleString()} so'm
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/attendance?groupId=${g.id}`} className="btn btn-ghost btn-xs">Guruhlarim</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
