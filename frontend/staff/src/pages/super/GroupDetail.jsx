import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Users, Wallet, DoorOpen, Clock, AlertTriangle, ArrowRight, UserCog,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmt, money, USER_STATUS } from '../../format.js';
import { useSuperGroupDetail } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import {
  Card, Metric, Panel, EmptyState, StatusBadge, Avatar,
} from './_ui.jsx';

const DAY_LABEL = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

const STATUS_CLS_TONE = { 'badge-success': 'success', 'badge-error': 'danger', 'badge-ghost': 'neutral' };

export default function SuperGroupDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useSuperGroupDetail(id);
  const group = data?.group;

  useEffect(() => {
    if (group?.name) document.title = `${group.name} | Группы | LevelUp Academy`;
  }, [group?.name]);

  if (error && error.status !== 401) {
    return (
      <div className="space-y-6">
        <Breadcrumbs name="Ошибка" />
        <Card className="max-w-lg mx-auto mt-6">
          <EmptyState
            icon={AlertTriangle}
            title="Ошибка загрузки группы"
            hint={error.message || 'Не удалось получить данные.'}
            action={<button className="btn btn-primary btn-sm px-6" onClick={() => refetch()}>Повторить</button>}
          />
        </Card>
      </div>
    );
  }

  if (isLoading || !group) {
    return (<div><PageHeader title="Группа" /><SkeletonList rows={8} /></div>);
  }

  const schedule = Array.isArray(group.schedule) ? group.schedule : [];

  return (
    <div className="space-y-5">
      <Breadcrumbs name={group.name} />

      <PageHeader title={group.name} subtitle={group.branchName || 'Филиал не указан'}>
        {group.subject && <span className="badge badge-ghost badge-sm">{group.subject}</span>}
        {group.isArchived && <span className="badge badge-ghost badge-sm">Архив</span>}
        <span className="inline-flex items-center gap-1.5 text-sm text-base-content/60">
          <UserCog size={14} className="shrink-0" />
          {group.mentor ? group.mentor.name : <span className="text-warning">ментор не назначен</span>}
        </span>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="animate-scale-in stagger-1"><Metric Icon={Users} label="Учеников" value={fmt(group.students.length)} /></div>
        <div className="animate-scale-in stagger-2"><Metric Icon={Wallet} label="Цена в месяц" value={money(group.monthlyPrice)} tone="success" /></div>
        <div className="animate-scale-in stagger-3"><Metric Icon={DoorOpen} label="Кабинет" value={group.room || '—'} tone="info" /></div>
      </div>

      <Panel title="Расписание" icon={Clock}>
        {schedule.length === 0 ? (
          <p className="text-sm text-base-content/40">Расписание не задано</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {schedule.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-base-200 px-3 py-1.5 text-sm font-medium">
                {DAY_LABEL[s.day] ?? s.day}
                <span className="text-base-content/50 font-normal tabular-nums">{s.start}–{s.end}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Ученики группы" icon={BookOpen} bodyClass="p-0">
        {group.students.length === 0 ? (
          <EmptyState icon={Users} title="В группе пока никого нет" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Ученик</th><th>Телефон</th><th>Статус</th>
                  <th className="text-right">Долг</th><th className="text-right">Коины</th><th />
                </tr>
              </thead>
              <tbody>
                {group.students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover cursor-pointer"
                    onClick={() => navigate(`/students/${s.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={`${s.firstName} ${s.lastName}`} size="md" />
                        <span className="font-semibold">{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td className="text-sm">{s.phone || '—'}</td>
                    <td>
                      <StatusBadge tone={STATUS_CLS_TONE[USER_STATUS(t)[s.status]?.cls] ?? 'neutral'}>
                        {USER_STATUS(t)[s.status]?.label ?? s.status}
                      </StatusBadge>
                    </td>
                    <td className={`text-right tabular-nums font-semibold ${s.totalDebt > 0 ? 'text-error' : 'text-base-content/40'}`}>
                      {money(s.totalDebt)}
                    </td>
                    <td className="text-right tabular-nums">{fmt(s.coinBalance)}</td>
                    <td><ArrowRight size={14} className="text-base-content/25" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Breadcrumbs({ name }) {
  return (
    <div className="text-xs breadcrumbs text-base-content/50">
      <ul>
        <li><Link to="/groups" className="hover:text-base-content font-medium">Группы</Link></li>
        <li className="font-semibold text-base-content">{name}</li>
      </ul>
    </div>
  );
}
