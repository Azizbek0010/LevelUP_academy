import { useMemo, useState } from 'react';
import { Calendar, ChevronRight, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';

function toDateInput(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBack(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const PRESET_DAYS = { '7d': 7, '14d': 14, '30d': 30 };

function useAttendanceQuery() {
  const { token, logout } = useAuth();
  const q = useQuery({
    queryKey: ['super-attendance'],
    queryFn: () => api.superAttendance(token),
    enabled: !!token,
  });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

function useGroupsQuery() {
  const { token, logout } = useAuth();
  const q = useQuery({
    queryKey: ['super-groups'],
    queryFn: () => api.superGroups(token),
    enabled: !!token,
  });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

function StatCard({ label, value, tone }) {
  const color =
    tone === 'success' ? 'text-success'
    : tone === 'error' ? 'text-error'
    : tone === 'primary' ? 'text-primary'
    : 'text-base-content';
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-3 px-4">
        <div className="text-xs text-base-content/50">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function LessonRow({ lesson }) {
  const marked = lesson.present + lesson.absent;
  const pct = marked > 0 ? Math.round((lesson.present / marked) * 100) : 0;
  const barColor = pct >= 85 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-error';

  return (
    <tr className="hover">
      <td className="font-mono text-xs">{formatDateTime(lesson.startsAt)}</td>
      <td className="font-medium">{lesson.groupName}</td>
      <td className="text-right">{lesson.totalStudents}</td>
      <td>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-success font-semibold">{lesson.present}</span>
          <span className="text-base-content/30">·</span>
          <span className="text-error">{lesson.absent}</span>
          {lesson.unknown > 0 && (
            <>
              <span className="text-base-content/30">·</span>
              <span className="text-base-content/50">?{lesson.unknown}</span>
            </>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2 justify-end">
          <div className="w-20 h-1.5 bg-base-200 rounded overflow-hidden">
            <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium w-8 text-right">{pct}%</span>
          <ChevronRight size={14} className="text-base-content/30" />
        </div>
      </td>
    </tr>
  );
}

export default function SuperAttendance() {
  const [groupFilter, setGroupFilter] = useState('all');
  const [preset, setPreset] = useState('14d');
  const [from, setFrom] = useState(daysBack(14));
  const [to, setTo] = useState(toDateInput(new Date()));

  const { data: attData, isLoading, error } = useAttendanceQuery();
  const { data: groupsData } = useGroupsQuery();

  const lessons = attData?.lessons || [];
  const groups = groupsData?.groups || [];
  const activeGroups = groups.filter((g) => !g.isArchived);

  const activeFrom = preset === 'custom' ? from : daysBack(PRESET_DAYS[preset]);
  const activeTo = preset === 'custom' ? to : toDateInput(new Date());

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const dateIso = l.startsAt.slice(0, 10);
      if (dateIso < activeFrom || dateIso > activeTo) return false;
      if (groupFilter !== 'all' && l.groupId !== groupFilter) return false;
      return true;
    });
  }, [lessons, groupFilter, activeFrom, activeTo]);

  const totalPresent = filtered.reduce((s, l) => s + (l.present || 0), 0);
  const totalAbsent = filtered.reduce((s, l) => s + (l.absent || 0), 0);
  const totalUnknown = filtered.reduce((s, l) => s + (l.unknown || 0), 0);
  const totalMarked = totalPresent + totalAbsent;
  const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader title="Посещаемость" subtitle="Журнал уроков за выбранный период" />

      {error && error.status !== 401 && (
        <div className="alert alert-error text-sm"><span>{error.message}</span></div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="join">
          {['7d', '14d', '30d', 'custom'].map((v) => (
            <button
              key={v}
              type="button"
              className={`join-item btn btn-sm ${preset === v ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPreset(v)}
            >
              {v === '7d' && '7 дней'}
              {v === '14d' && '14 дней'}
              {v === '30d' && '30 дней'}
              {v === 'custom' && (
                <span className="flex items-center gap-1"><Calendar size={13} /> Период</span>
              )}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 bg-base-100 border border-base-300 rounded-lg px-2 py-1">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="input input-xs bg-transparent border-0 focus:outline-none w-32"
            />
            <span className="text-base-content/40 text-xs">→</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="input input-xs bg-transparent border-0 focus:outline-none w-32"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Filter size={15} className="text-base-content/50" />
          <select
            className="select select-bordered select-sm"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">Все группы</option>
            {activeGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Уроков" value={String(filtered.length)} tone="neutral" />
        <StatCard label="Присутствовало" value={String(totalPresent)} tone="success" />
        <StatCard label="Пропустило" value={String(totalAbsent)} tone="error" />
        <StatCard label="% посещаемости" value={`${attendanceRate}%`} tone="primary" />
      </div>

      {totalUnknown > 0 && (
        <p className="text-xs text-base-content/50">
          Не отмечено: <span className="font-medium">{totalUnknown}</span>
        </p>
      )}

      {/* Table */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-base-content/40 text-sm">Загрузка…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-base-content/40 text-sm">
              Уроков в выбранном периоде не найдено
            </div>
          ) : (
            <table className="table table-sm">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Дата · время</th>
                  <th>Группа</th>
                  <th className="text-right">Всего</th>
                  <th>Присутствие</th>
                  <th className="text-right w-36">Процент</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <LessonRow key={l.id} lesson={l} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
