import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Phone, Building2, Wallet, Calendar,
  ShieldAlert, Ban, TriangleAlert, ScrollText,
} from 'lucide-react';
import { fmt, dateShort, money, ADMIN_STATUS } from '../../format.js';
import { useSuperAdmins, useSuperMethodists } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState } from '../mentor/_ui.jsx';
import { TYPE_META, LevelBadge } from '../../discipline-meta.jsx';

/**
 * Полная карточка сотрудника (Admin/Methodist) — отдельная страница, а не
 * модалка: список нарушений и контактные данные не помещались в диалог без
 * скролла внутри скролла, а Karis прямо попросил full page.
 *
 * Данные не тянут новый endpoint — берутся из уже загруженных списков
 * /super/admins и /super/methodists (react-query отдаёт их из кэша, если
 * страница открыта переходом со списка) плюс существующий фильтр
 * /super/penalties?targetUserId=.
 */

const ROLE_LABEL = { admin: 'Администратор', methodist: 'Методист' };

function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="card bg-base-100">
      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
          <Icon size={13} /> {label}
        </div>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export default function StaffDetail() {
  const { role, id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const admins = useSuperAdmins();
  const methodists = useSuperMethodists();

  const loading = role === 'admin' ? admins.isLoading : methodists.isLoading;

  const person = useMemo(() => {
    if (role === 'admin') return (admins.data?.admins ?? []).find((a) => a.id === id) ?? null;
    if (role === 'methodist') return (methodists.data?.methodists ?? []).find((m) => m.id === id) ?? null;
    return null;
  }, [role, id, admins.data, methodists.data]);

  const penalties = useQuery({
    queryKey: ['super-penalties', id],
    queryFn: () => api.superPenalties(token, `?targetUserId=${id}`),
    enabled: !!token && !!id,
  });
  const items = penalties.data?.data ?? [];

  const totals = useMemo(() => {
    const acc = {};
    for (const key of Object.keys(TYPE_META)) acc[key] = 0;
    for (const p of items) acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, [items]);

  const back = () => navigate('/admins');

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="space-y-4">
        <button className="btn btn-ghost btn-sm gap-1.5" onClick={back}>
          <ArrowLeft size={15} /> Назад к сотрудникам
        </button>
        <EmptyState
          icon={ShieldAlert}
          title="Сотрудник не найден"
          hint="Возможно, аккаунт был удалён, или ссылка ведёт на другую роль."
        />
      </div>
    );
  }

  const status = ADMIN_STATUS[person.status === 'frozen' ? 'frozen' : 'active'] || { label: person.status, cls: 'badge-ghost' };

  return (
    <div className="space-y-6">
      <button className="btn btn-ghost btn-sm gap-1.5 -mb-1" onClick={back}>
        <ArrowLeft size={15} /> Назад к сотрудникам
      </button>

      <PageHeader title={`${person.firstName} ${person.lastName}`} subtitle={ROLE_LABEL[role] ?? role}>
        <span className={`badge font-semibold ${status.cls}`}>{status.label}</span>
      </PageHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Field icon={Mail} label="Email">
          <span className="font-mono break-all">{person.email}</span>
        </Field>
        <Field icon={Phone} label="Телефон">
          <span className="font-mono">{person.phone || '—'}</span>
        </Field>
        {role === 'admin' && (
          <Field icon={Building2} label="Филиал">
            <span className="font-medium">{person.branchName || '—'}</span>
          </Field>
        )}
        <Field icon={Wallet} label="Оклад">
          <span className="font-semibold">{person.monthlySalary != null ? money(person.monthlySalary) : '—'}</span>
        </Field>
        <Field icon={Calendar} label="В системе с">
          {dateShort(person.createdAt)}
        </Field>
      </div>

      {penalties.isLoading ? (
        <SkeletonKpis count={3} className="grid-cols-1 sm:grid-cols-3" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi Icon={TriangleAlert} tone="warning" title="Жёлтые" value={fmt(totals.sariq)} unit="предупреждений" />
          <Kpi Icon={ShieldAlert} tone="danger" title="Красные" value={fmt(totals.qizil)} unit="предупреждений" />
          <Kpi Icon={Ban} tone="danger" title="Увольнения" value={fmt(totals.qora)} unit="записей" />
        </div>
      )}

      <Panel title="История нарушений дисциплины" icon={ScrollText} bodyClass="p-0">
        {penalties.isLoading ? (
          <div className="p-4"><SkeletonTable /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Нарушений нет"
            hint="За этим сотрудником не числится взысканий."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Вид</th>
                  <th className="text-right">% от оклада</th>
                  <th>Причина</th>
                  <th>Выписал</th>
                  <th>Когда</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td><LevelBadge type={p.type} size="sm" /></td>
                    <td className="text-right tabular-nums font-semibold">
                      {p.amount == null ? '—' : `−${Number(p.amount)}%`}
                    </td>
                    <td className="max-w-sm"><span className="text-sm">{p.reason}</span></td>
                    <td className="text-sm">
                      {p.issued_by_name ?? p.issuedByName ?? '—'}
                      <div className="text-xs text-base-content/45">
                        {p.issuer_role === 'superadmin' ? 'Super Admin' : (ROLE_LABEL[p.issuer_role] ?? p.issuer_role)}
                      </div>
                    </td>
                    <td className="text-xs text-base-content/55 whitespace-nowrap">
                      {dateTime(p.created_at ?? p.createdAt)}
                    </td>
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
