import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User as UserIcon, Users2, Wallet } from 'lucide-react';
import { groupsApi } from '../../../shared/api/endpoints/groups';
import { MOCK_LESSONS } from '../../../dev/mockAttendance';
import { Badge } from '../../../shared/ui/Badge';

const DAY_LABEL: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

export default function GroupDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.get(id!),
    enabled: !!id,
  });

  if (query.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>Группа не найдена</span>
        </div>
      </div>
    );
  }

  const g = query.data;
  const lessons = MOCK_LESSONS.filter((l) => l.groupId === g.id).slice(0, 12);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <Link to="/superadmin/groups" className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft className="size-4" /> К списку групп
        </Link>
      </div>

      {/* Header */}
      <div className="card bg-base-100 border border-base-300 chart-rise">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-base-content/50 uppercase tracking-wider">Группа</div>
              <h1 className="text-2xl font-semibold mt-1">{g.name}</h1>
              <div className="mt-1">
                {g.status === 'archived' ? (
                  <Badge variant="ghost">архив</Badge>
                ) : (
                  <Badge variant="success">актив</Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-base-content/50">Абонемент</div>
              <div className="text-2xl font-semibold text-primary">
                {g.monthlyFee.toLocaleString('ru-RU')}
                <span className="text-sm text-base-content/60 font-normal ml-1">сум/мес</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <Meta icon={UserIcon} label="Ментор" value={g.mentorName} />
            <Meta
              icon={Clock}
              label="Расписание"
              value={`${g.lessonDays.map((d) => DAY_LABEL[d] ?? d).join(' · ')} · ${g.lessonStartTime}–${g.lessonEndTime}`}
            />
            <Meta icon={Users2} label="Студентов" value={String(g.students.length)} />
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="card bg-base-100 border border-base-300 chart-rise chart-rise-delay-1">
        <div className="card-body">
          <div className="flex items-center gap-2">
            <Users2 className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Список студентов</h2>
            <Badge variant="primary">{g.students.length}</Badge>
          </div>
          {g.students.length === 0 ? (
            <p className="text-base-content/50 text-sm mt-2">Пока нет студентов</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead className="bg-base-200/40">
                  <tr>
                    <th>ФИО</th>
                    <th>Телефон родителя</th>
                    <th>Telegram</th>
                  </tr>
                </thead>
                <tbody>
                  {g.students.map((s) => (
                    <tr key={s.id} className="hover:bg-base-200/40">
                      <td>
                        <Link
                          to={`/superadmin/students/${s.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {s.lastName} {s.firstName}
                        </Link>
                      </td>
                      <td className="font-mono text-xs">{s.parentPhone}</td>
                      <td>
                        {s.telegramChatId ? (
                          <Badge variant="success">TG</Badge>
                        ) : (
                          <span className="text-base-content/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent lessons */}
      <div className="card bg-base-100 border border-base-300 chart-rise chart-rise-delay-2">
        <div className="card-body">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Последние уроки</h2>
          </div>
          {lessons.length === 0 ? (
            <p className="text-base-content/50 text-sm mt-2">Уроков пока не было</p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead className="bg-base-200/40">
                  <tr>
                    <th>Дата · время</th>
                    <th>Пришли</th>
                    <th>Не пришли</th>
                    <th className="w-32 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => {
                    const marked = l.present + l.absent;
                    const pct = marked > 0 ? Math.round((l.present / marked) * 100) : 0;
                    const tone = pct >= 85 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-error';
                    return (
                      <tr key={l.id} className="hover:bg-base-200/40">
                        <td className="font-mono text-xs">
                          <Link
                            to={`/superadmin/attendance/${l.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {formatDT(l.startsAt)}
                          </Link>
                        </td>
                        <td className="text-success font-medium">{l.present}</td>
                        <td className="text-error">{l.absent}</td>
                        <td>
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 h-1.5 bg-base-200 rounded overflow-hidden">
                              <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDT(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} · ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
