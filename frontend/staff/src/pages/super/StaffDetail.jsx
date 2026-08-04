import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Mail, Phone, Building2, Wallet, Calendar, MapPin, UserCog, Award,
  ShieldAlert, Ban, TriangleAlert, ScrollText,
} from 'lucide-react';
import { fmt, dateShort, money, ADMIN_STATUS, ROLE_LABELS } from '../../format.js';
import { useSuperAdmins, useSuperMentors, useSuperMethodists, useSuperBranches } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { SkeletonKpis, SkeletonTable, SkeletonList } from '../../components/Skeleton.jsx';
import { phoneDisplay } from '../../components/PhoneInput.jsx';
import { Kpi, Panel, EmptyState, Avatar } from '../mentor/_ui.jsx';
import { TYPE_META, LevelBadge } from '../../discipline-meta.jsx';

/**
 * Полная карточка сотрудника (Admin/Methodist) — отдельная страница, а не
 * модалка: список нарушений и контактные данные не помещались в диалог без
 * скролла внутри скролла, а Karis прямо попросил full page.
 *
 * Вёрстка сознательно повторяет язык SuperBranchDetail.jsx (хлебные крошки →
 * заголовок → KPI-плитки → панель с иконка+текст строками вместо кучи мелких
 * рамочных карточек) — это уже устоявшийся «серьёзный» стиль остальной
 * Super Admin панели, а не новый визуальный диалект для одной страницы.
 *
 * Данные не тянут новый endpoint — берутся из уже загруженных списков
 * /super/admins, /super/methodists, /super/branches (react-query отдаёт их
 * из кэша, если страница открыта переходом со списка) плюс существующий
 * фильтр /super/penalties?targetUserId=.
 */

// Те же цвета, что и в GradePicker админа филиала (pages/admin/Mentors.jsx) —
// грейд здесь read-only (меняет только Admin филиала), но цвет должен
// совпадать, а не изобретаться заново для одной страницы.
const GRADE_META = {
  junior: { label: 'Junior', color: '#2563eb' },
  middle: { label: 'Middle', color: '#b45309' },
  senior: { label: 'Senior', color: '#15803d' },
};

function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StaffDetail() {
  const { role, id } = useParams();
  const { token } = useAuth();

  const admins = useSuperAdmins();
  const mentors = useSuperMentors();
  const methodists = useSuperMethodists();
  const branches = useSuperBranches();

  const loading = role === 'admin' ? admins.isLoading : role === 'mentor' ? mentors.isLoading : methodists.isLoading;

  const person = useMemo(() => {
    if (role === 'admin') return (admins.data?.admins ?? []).find((a) => a.id === id) ?? null;
    if (role === 'mentor') return (mentors.data?.mentors ?? []).find((m) => m.id === id) ?? null;
    if (role === 'methodist') return (methodists.data?.methodists ?? []).find((m) => m.id === id) ?? null;
    return null;
  }, [role, id, admins.data, mentors.data, methodists.data]);

  const branch = useMemo(
    () => (branches.data?.branches ?? []).find((b) => b.id === person?.branchId) ?? null,
    [branches.data, person],
  );

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

  if (loading) {
    return (
      <div>
        <div className="text-xs breadcrumbs text-base-content/50">
          <ul><li><Link to="/admins" className="hover:text-base-content font-medium">Сотрудники</Link></li></ul>
        </div>
        <SkeletonList rows={8} />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="space-y-4">
        <div className="text-xs breadcrumbs text-base-content/50">
          <ul>
            <li><Link to="/admins" className="hover:text-base-content font-medium">Сотрудники</Link></li>
            <li className="font-semibold text-base-content">Не найден</li>
          </ul>
        </div>
        <EmptyState
          icon={ShieldAlert}
          title="Сотрудник не найден"
          hint="Возможно, аккаунт был удалён, или ссылка ведёт на другую роль."
        />
      </div>
    );
  }

  const status = ADMIN_STATUS[person.status === 'frozen' ? 'frozen' : 'active'] || { label: person.status, cls: 'badge-ghost' };
  const lastViolation = items[0] ?? null;
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <div className="space-y-5">
      <div className="text-xs breadcrumbs text-base-content/50">
        <ul>
          <li><Link to="/admins" className="hover:text-base-content font-medium">Сотрудники</Link></li>
          <li className="font-semibold text-base-content">{fullName}</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 animate-page-enter">
        <div className="flex items-center gap-3.5">
          <Avatar name={fullName} size="lg" />
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight leading-tight text-base-content">{fullName}</h1>
            <p className="text-[13px] text-base-content/70 mt-0.5">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === 'mentor' && person.grade && GRADE_META[person.grade] && (
            <span
              className="badge badge-outline badge-sm gap-1.5 font-semibold"
              style={{ borderColor: GRADE_META[person.grade].color, color: GRADE_META[person.grade].color }}
            >
              <Award size={11} /> {GRADE_META[person.grade].label}
            </span>
          )}
          {lastViolation && (
            <span className="badge badge-ghost badge-sm gap-1.5">
              <ScrollText size={11} /> Последнее: {dateShort(lastViolation.created_at ?? lastViolation.createdAt)}
            </span>
          )}
          <span className={`badge font-semibold ${status.cls}`}>{status.label}</span>
        </div>
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

      <Panel title="Профиль" icon={UserCog}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
            <span className="flex items-center gap-2">
              <Mail size={14} className="text-base-content/40 shrink-0" />
              <span className="font-mono">{person.email}</span>
            </span>
            <span className="flex items-center gap-2">
              <Phone size={14} className="text-base-content/40 shrink-0" />
              {person.phone ? phoneDisplay(person.phone) : 'Телефон не указан'}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-base-content/40 shrink-0" />
              В системе с {dateShort(person.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm pt-3 border-t border-base-200">
            <span className="flex items-center gap-2">
              <Wallet size={14} className="text-base-content/40 shrink-0" />
              Оклад: <span className="font-semibold">
                {person.monthlySalary != null ? money(person.monthlySalary) : 'не указан'}
              </span>
            </span>
            {role !== 'methodist' && (
              <>
                <span className="flex items-center gap-2">
                  <Building2 size={14} className="text-base-content/40 shrink-0" />
                  {person.branchName || 'Филиал не указан'}
                </span>
                {branch?.address && (
                  <span className="flex items-center gap-2 text-base-content/60">
                    <MapPin size={14} className="text-base-content/40 shrink-0" />
                    {branch.address}
                  </span>
                )}
                {branch?.phone && (
                  <span className="flex items-center gap-2 text-base-content/60">
                    <Phone size={14} className="text-base-content/40 shrink-0" />
                    {phoneDisplay(branch.phone)} · филиал
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Panel>

      {role === 'mentor' && (
        <Panel title="О менторе" icon={Award}>
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-2">
                Навыки
              </div>
              {person.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {person.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium px-2.5 py-1 rounded-full border border-base-300 text-base-content/70"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/45">Не указаны</p>
              )}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-2">
                О себе
              </div>
              {person.bio ? (
                <p className="text-sm text-base-content/75 leading-relaxed border-l-2 border-base-300 pl-3 whitespace-pre-wrap">
                  {person.bio}
                </p>
              ) : (
                <p className="text-sm text-base-content/45">Не заполнено</p>
              )}
            </div>
          </div>
        </Panel>
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
                        {ROLE_LABELS[p.issuer_role] ?? p.issuer_role}
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
