import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Save,
  Users2,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import {
  MOCK_LESSONS,
  getLessonRoster,
  setLessonMark,
  type LessonStudentMark,
} from '../../../dev/mockAttendance';
import { Badge } from '../../../shared/ui/Badge';
import { toast } from '../../../shared/ui/Toast';

const REASON_PRESETS = [
  'Болен',
  'Семейные обстоятельства',
  'Уехал',
  'Не предупредил',
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function LessonDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const lesson = MOCK_LESSONS.find((l) => l.id === id);

  const initialRoster = useMemo(() => (id ? getLessonRoster(id) : []), [id]);
  const [roster, setRoster] = useState<LessonStudentMark[]>(initialRoster);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRoster(initialRoster);
    setDirty(false);
  }, [initialRoster]);

  if (!lesson || !id) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>Урок не найден</span>
        </div>
      </div>
    );
  }

  const present = roster.filter((r) => r.status === 'present').length;
  const absent = roster.filter((r) => r.status === 'absent').length;
  const unknown = roster.filter((r) => r.status === 'unknown').length;
  const marked = present + absent;
  const rate = marked > 0 ? Math.round((present / marked) * 100) : 0;

  function updateStudent(
    studentId: string,
    patch: Partial<Pick<LessonStudentMark, 'status' | 'absenceReason'>>,
  ) {
    setRoster((r) =>
      r.map((m) =>
        m.studentId === studentId
          ? {
              ...m,
              ...patch,
              absenceReason:
                patch.status === 'present' || patch.status === 'unknown'
                  ? null
                  : patch.absenceReason !== undefined
                    ? patch.absenceReason
                    : m.absenceReason,
            }
          : m,
      ),
    );
    setDirty(true);
  }

  function saveAll() {
    const lessonId = id;
    if (!lessonId) return;
    for (const m of roster) {
      setLessonMark(lessonId, m.studentId, m.status, m.absenceReason);
    }
    setDirty(false);
    toast.success('Перекличка сохранена');
  }

  function markAllPresent() {
    setRoster((r) => r.map((m) => ({ ...m, status: 'present', absenceReason: null })));
    setDirty(true);
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <Link to="/superadmin/attendance" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft className="size-4" /> К журналу
        </Link>
        {dirty && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-warning">Есть несохранённые изменения</span>
            <button className="btn btn-primary btn-sm gap-2" onClick={saveAll}>
              <Save className="size-4" /> Сохранить перекличку
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="card bg-base-100 border border-base-300 chart-rise">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-base-content/50 uppercase tracking-wider">Урок</div>
              <h1 className="text-2xl font-semibold mt-1">{lesson.groupName}</h1>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <Meta icon={Calendar} label="Дата" value={formatDate(lesson.startsAt)} />
                <Meta
                  icon={Clock}
                  label="Время"
                  value={`${formatTime(lesson.startsAt)} — ${formatTime(lesson.endsAt)}`}
                />
                <Meta icon={Users2} label="Всего студентов" value={String(roster.length)} />
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-base-content/50">Посещаемость</div>
              <div
                className={`text-4xl font-bold transition-colors ${
                  rate >= 85 ? 'text-success' : rate >= 70 ? 'text-warning' : 'text-error'
                }`}
              >
                {rate}%
              </div>
              <button
                type="button"
                className="btn btn-xs btn-ghost mt-2"
                onClick={markAllPresent}
              >
                Все пришли
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 chart-rise chart-rise-delay-1">
        <StatCard label="Пришли" value={present} tone="success" icon={CheckCircle2} />
        <StatCard label="Не пришли" value={absent} tone="error" icon={XCircle} />
        <StatCard label="Не отмечено" value={unknown} tone="neutral" icon={HelpCircle} />
      </div>

      {/* Roster — interactive */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden chart-rise chart-rise-delay-2">
        <div className="card-body pb-0">
          <h2 className="text-lg font-medium">Перекличка</h2>
          <p className="text-xs text-base-content/60">
            Клик по статусу — отметить студента. Причина отсутствия — из списка.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Студент</th>
                <th>Телефон родителя</th>
                <th className="w-72">Статус</th>
                <th className="w-56">Причина</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.studentId} className="hover:bg-base-200/40">
                  <td>
                    <Link
                      to={`/superadmin/students/${r.studentId}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {r.studentName}
                    </Link>
                  </td>
                  <td className="font-mono text-xs">{r.parentPhone}</td>
                  <td>
                    <div className="join">
                      <StatusButton
                        active={r.status === 'present'}
                        tone="success"
                        icon={CheckCircle2}
                        label="Пришёл"
                        onClick={() => updateStudent(r.studentId, { status: 'present' })}
                      />
                      <StatusButton
                        active={r.status === 'absent'}
                        tone="error"
                        icon={XCircle}
                        label="Не пришёл"
                        onClick={() => updateStudent(r.studentId, { status: 'absent' })}
                      />
                      <StatusButton
                        active={r.status === 'unknown'}
                        tone="neutral"
                        icon={HelpCircle}
                        label="—"
                        onClick={() => updateStudent(r.studentId, { status: 'unknown' })}
                      />
                    </div>
                  </td>
                  <td>
                    {r.status === 'absent' ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          list={`reasons-${r.studentId}`}
                          className="input input-bordered input-xs w-full"
                          placeholder="Своя причина..."
                          value={r.absenceReason ?? ''}
                          onChange={(e) =>
                            updateStudent(r.studentId, {
                              absenceReason: e.target.value || null,
                            })
                          }
                        />
                        <datalist id={`reasons-${r.studentId}`}>
                          {REASON_PRESETS.map((p) => (
                            <option key={p} value={p} />
                          ))}
                        </datalist>
                      </div>
                    ) : (
                      <span className="text-base-content/40 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  active,
  tone,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: 'success' | 'error' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const activeCls =
    tone === 'success' ? 'btn-success' : tone === 'error' ? 'btn-error' : 'btn-neutral';
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('join-item btn btn-xs gap-1', active ? activeCls : 'btn-ghost')}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 text-base-content/40 mt-0.5" />
      <div>
        <div className="text-xs text-base-content/50">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: 'success' | 'error' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneCls =
    tone === 'success' ? 'text-success' : tone === 'error' ? 'text-error' : 'text-base-content/60';
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-3">
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className={`text-2xl font-semibold transition-colors ${toneCls}`}>{value}</div>
      </div>
    </div>
  );
}
