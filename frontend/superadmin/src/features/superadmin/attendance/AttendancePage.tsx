import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Filter } from 'lucide-react';
import clsx from 'clsx';
import { MOCK_LESSONS, type MockLesson } from '../../../dev/mockAttendance';
import { MOCK_GROUPS_LIST } from '../../../dev/mockGroups';

type PeriodPreset = '7d' | '14d' | '30d' | 'custom';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function daysBack(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateInput(d);
}

const PRESET_DAYS: Record<Exclude<PeriodPreset, 'custom'>, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
};

export default function AttendancePage(): React.ReactElement {
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [preset, setPreset] = useState<PeriodPreset>('14d');
  const [from, setFrom] = useState(daysBack(14));
  const [to, setTo] = useState(toDateInput(new Date()));

  const activeFrom = preset === 'custom' ? from : daysBack(PRESET_DAYS[preset]);
  const activeTo = preset === 'custom' ? to : toDateInput(new Date());

  const lessons = useMemo(() => {
    return MOCK_LESSONS.filter((l) => {
      const dateIso = l.startsAt.slice(0, 10);
      if (dateIso < activeFrom || dateIso > activeTo) return false;
      if (groupFilter !== 'all' && l.groupId !== groupFilter) return false;
      return true;
    });
  }, [groupFilter, activeFrom, activeTo]);

  const totalPresent = lessons.reduce((s, l) => s + l.present, 0);
  const totalAbsent = lessons.reduce((s, l) => s + l.absent, 0);
  const totalUnknown = lessons.reduce((s, l) => s + l.unknown, 0);
  const totalMarked = totalPresent + totalAbsent;
  const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Посещаемость</h1>
        <p className="text-base-content/60 text-sm mt-1">
          Журнал уроков за выбранный период
        </p>
      </div>

      {/* Period + group filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="join">
          {(['7d', '14d', '30d', 'custom'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={clsx(
                'join-item btn btn-sm',
                preset === v ? 'btn-primary' : 'btn-ghost',
              )}
              onClick={() => setPreset(v)}
            >
              {v === '7d' && '7 дней'}
              {v === '14d' && '14 дней'}
              {v === '30d' && '30 дней'}
              {v === 'custom' && (
                <>
                  <Calendar className="size-3.5" /> Свой период
                </>
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
          <Filter className="size-4 text-base-content/50" />
          <select
            className="select select-bordered select-sm max-w-xs"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">Все группы</option>
            {MOCK_GROUPS_LIST.filter((g) => g.status === 'active').map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Stat label="Уроков" value={String(lessons.length)} icon={Calendar} tone="neutral" />
        <Stat label="Присутствовало" value={String(totalPresent)} tone="success" />
        <Stat label="Пропустило" value={String(totalAbsent)} tone="error" />
        <Stat label="% посещаемости" value={`${attendanceRate}%`} tone="primary" />
      </div>

      {totalUnknown > 0 && (
        <div className="text-xs text-base-content/50">
          Не отмечено уроков: <span className="font-medium">{totalUnknown}</span>
        </div>
      )}

      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Дата · время</th>
                <th>Группа</th>
                <th className="text-right">Всего</th>
                <th>Присутствие</th>
                <th className="text-right w-32">Процент</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <LessonRow key={l.id} lesson={l} />
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-base-content/50">
                    Уроков в выбранном периоде не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: MockLesson }): React.ReactElement {
  const marked = lesson.present + lesson.absent;
  const pct = marked > 0 ? Math.round((lesson.present / marked) * 100) : 0;
  const barTone = pct >= 85 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-error';
  return (
    <tr className="hover:bg-base-200/40 cursor-pointer group">
      <td className="font-mono text-xs">
        <Link to={`/superadmin/attendance/${lesson.id}`} className="block">
          {formatDateTime(lesson.startsAt)}
        </Link>
      </td>
      <td>
        <Link
          to={`/superadmin/attendance/${lesson.id}`}
          className="block group-hover:text-primary"
        >
          {lesson.groupName}
        </Link>
      </td>
      <td className="text-right">{lesson.totalStudents}</td>
      <td>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-success font-medium">{lesson.present}</span>
          <span className="text-base-content/30">·</span>
          <span className="text-error">{lesson.absent}</span>
          {lesson.unknown > 0 && (
            <>
              <span className="text-base-content/30">·</span>
              <span className="text-base-content/50">? {lesson.unknown}</span>
            </>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2 justify-end">
          <div className="w-20 h-1.5 bg-base-200 rounded overflow-hidden">
            <div className={`h-full ${barTone} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium w-8 text-right">{pct}%</span>
          <ChevronRight className="size-3.5 text-base-content/30 group-hover:text-primary" />
        </div>
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: 'success' | 'error' | 'primary' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}): React.ReactElement {
  const toneCls =
    tone === 'success'
      ? 'text-success'
      : tone === 'error'
        ? 'text-error'
        : tone === 'primary'
          ? 'text-primary'
          : 'text-base-content';
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-3">
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          {Icon && <Icon className="size-3.5" />}
          {label}
        </div>
        <div className={`text-2xl font-semibold ${toneCls}`}>{value}</div>
      </div>
    </div>
  );
}
