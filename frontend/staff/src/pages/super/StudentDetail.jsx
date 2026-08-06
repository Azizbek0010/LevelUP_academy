import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Coins, Wallet, KeyRound, Phone, Cake, AlertTriangle, ArrowRight,
  BookOpen, Snowflake, Users2,
} from 'lucide-react';
import { fmt, money, dateShort, USER_STATUS } from '../../format.js';
import { useSuperStudentDetail } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';
import { phoneDisplay } from '../../components/PhoneInput.jsx';
import {
  Card, Metric, Panel, EmptyState, StatusBadge, Avatar,
} from './_ui.jsx';

const STATUS_CLS_TONE = { 'badge-success': 'success', 'badge-error': 'danger', 'badge-ghost': 'neutral' };

export default function SuperStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useSuperStudentDetail(id);
  const s = data?.student;
  const fullName = s ? `${s.firstName} ${s.lastName}` : '';

  useEffect(() => {
    if (fullName) document.title = `${fullName} | Ученики | LevelUp Academy`;
  }, [fullName]);

  if (error && error.status !== 401) {
    return (
      <div className="space-y-6">
        <Breadcrumbs name="Ошибка" />
        <Card className="max-w-lg mx-auto mt-6">
          <EmptyState
            icon={AlertTriangle}
            title="Ошибка загрузки ученика"
            hint={error.message || 'Не удалось получить данные.'}
            action={<button className="btn btn-primary btn-sm px-6" onClick={() => refetch()}>Повторить</button>}
          />
        </Card>
      </div>
    );
  }

  if (isLoading || !s) {
    return (<div><PageHeader title="Ученик" /><SkeletonList rows={8} /></div>);
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs name={fullName} />

      <PageHeader title={fullName} subtitle={s.branchName || 'Филиал не указан'}>
        <StatusBadge tone={STATUS_CLS_TONE[USER_STATUS[s.status]?.cls] ?? 'neutral'}>
          {USER_STATUS[s.status]?.label ?? s.status}
        </StatusBadge>
        {s.hasOverdueInvoice && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-error">
            <AlertTriangle size={13} /> просроченный счёт
          </span>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-scale-in stagger-1">
          <Metric Icon={Wallet} label="Долг" value={money(s.totalDebt)} tone={s.totalDebt > 0 ? 'danger' : 'neutral'} />
        </div>
        <div className="animate-scale-in stagger-2">
          <Metric Icon={Coins} label="Коины" value={fmt(s.coinBalance)} tone="warning" />
        </div>
        <div className="animate-scale-in stagger-3">
          <Metric Icon={BookOpen} label="Групп" value={fmt(s.groups.length)} tone="info" />
        </div>
        <div className="animate-scale-in stagger-4">
          <Metric Icon={KeyRound} label="Логин-код" value={s.loginCode || '—'} tone="neutral" />
        </div>
      </div>

      {s.status === 'frozen' && (
        <div className="alert alert-warning text-sm">
          <Snowflake size={16} />
          <span>Заморожен{s.frozenAt ? ` ${dateShort(s.frozenAt)}` : ''}{s.frozenReason ? ` — ${s.frozenReason}` : ''}</span>
        </div>
      )}

      <Panel title="Контакты" icon={Phone}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
          <span className="flex items-center gap-2">
            <Phone size={14} className="text-base-content/40 shrink-0" />
            {s.phone ? phoneDisplay(s.phone) : 'Телефон не указан'}
          </span>
          <span className="flex items-center gap-2">
            <Cake size={14} className="text-base-content/40 shrink-0" />
            {s.birthDate ? dateShort(s.birthDate) : 'Дата рождения не указана'}
          </span>
          <span className="flex items-center gap-2">
            <Users2 size={14} className="text-base-content/40 shrink-0" />
            {s.hasParent ? 'Родитель привязан' : 'Родитель не привязан'}
          </span>
          <span className="text-xs text-base-content/40 ml-auto">
            в системе с {dateShort(s.createdAt)}
          </span>
        </div>
      </Panel>

      <Panel title="Группы ученика" icon={BookOpen} bodyClass="p-0">
        {s.groups.length === 0 ? (
          <EmptyState icon={BookOpen} title="Не состоит ни в одной группе" />
        ) : (
          <ul className="divide-y divide-base-200">
            {s.groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-base-200/50 transition-colors"
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <Avatar name={g.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {g.name} {g.subject && <span className="text-base-content/40 font-normal">· {g.subject}</span>}
                  </div>
                  <div className="text-xs text-base-content/50 truncate">
                    {g.mentor ? `Ментор: ${g.mentor}` : 'Ментор не назначен'}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">{money(g.monthlyPrice)}</span>
                <ArrowRight size={14} className="text-base-content/25 shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Breadcrumbs({ name }) {
  return (
    <div className="text-xs breadcrumbs text-base-content/50">
      <ul>
        <li><Link to="/students" className="hover:text-base-content font-medium">Ученики</Link></li>
        <li className="font-semibold text-base-content">{name}</li>
      </ul>
    </div>
  );
}
