import { useMemo, useState } from 'react';
import {
  AlertTriangle, Wallet, Building2, UserX, Info, Search,
} from 'lucide-react';
import { usePenalties } from '../queries.js';
import { fmt, dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../components/Skeleton.jsx';

/**
 * Дисциплина по всем партнёрам — ТОЛЬКО ЧТЕНИЕ.
 *
 * Раньше страница показывала `initialMock` — шесть выдуманных партнёров и штрафов,
 * ноль обращений к API — и предлагала форму «выписать штраф», которой не
 * соответствовал ни один эндпоинт.
 *
 * Формы выписки здесь нет и не будет: по матрице прав (CAN_ISSUE в модуле
 * discipline) main_admin не выписывает взыскания НИКОМУ. Их выдают Super Admin
 * и Admin внутри своей организации. Владелец платформы может только видеть
 * картину целиком — это и есть назначение страницы.
 *
 * Источник: GET /api/main/penalties (SELECT по staff_penalties, без записи).
 */

const TYPE_META = {
  shtraf: { label: 'Штраф', cls: 'badge-warning', Icon: Wallet },
  qora: { label: 'Увольнение', cls: 'badge-error', Icon: UserX },
};

const ROLE_LABEL = {
  admin: 'Администратор',
  mentor: 'Ментор',
  methodist: 'Методист',
  superadmin: 'Super Admin',
};

function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            style={{ background: tint.bg, color: tint.fg }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider leading-tight text-base-content/45">
            {title}
          </div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs mt-1.5 text-base-content/45">{unit}</div>}
      </div>
    </div>
  );
}

export default function Fines() {
  const { data, isLoading, error } = usePenalties();

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const items = data?.items ?? [];
  const totals = data?.totals;
  const cur = totals?.currency || 'UZS';

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (!needle) return true;
      return (
        (p.partnerName || '').toLowerCase().includes(needle)
        || (p.employeeName || '').toLowerCase().includes(needle)
        || (p.reason || '').toLowerCase().includes(needle)
      );
    });
  }, [items, q, typeFilter]);

  if (error && error.status !== 401) {
    return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Дисциплина партнёров"
        subtitle="Взыскания сотрудников по всем учебным центрам — обзор платформы"
      />

      <div className="alert bg-base-200/60 border-0 text-sm">
        <Info size={16} className="shrink-0" />
        <span>
          Только просмотр. Взыскания выписывают Super Admin и Admin внутри своей
          организации — у владельца платформы такого права нет по матрице прав.
        </span>
      </div>

      {isLoading ? (
        <>
          <SkeletonKpis count={4} />
          <SkeletonTable rows={6} cols={5} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              Icon={Wallet}
              tint={{ bg: '#FEF3C7', fg: '#92400E' }}
              title="Сумма штрафов"
              value={fmt(totals?.shtrafAmount ?? 0)}
              unit={cur}
            />
            <Kpi
              Icon={AlertTriangle}
              tint={{ bg: '#FEF3C7', fg: '#92400E' }}
              title="Штрафов"
              value={fmt(totals?.shtrafCount ?? 0)}
              unit="записей"
            />
            <Kpi
              Icon={UserX}
              tint={{ bg: '#FEE2E2', fg: '#991B1B' }}
              title="Увольнений"
              value={fmt(totals?.qoraCount ?? 0)}
              unit="чёрных меток"
            />
            <Kpi
              Icon={Building2}
              tint={{ bg: '#E0F2FE', fg: '#075985' }}
              title="Затронуто центров"
              value={fmt(totals?.orgsAffected ?? 0)}
              unit="организаций"
            />
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200/60">
            <div className="card-body">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <label className="input input-bordered input-sm flex items-center gap-2 w-full max-w-xs">
                  <Search size={14} className="opacity-50" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="Центр, сотрудник, причина"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </label>
                <div className="join">
                  {[
                    { key: 'all', label: 'Все' },
                    { key: 'shtraf', label: 'Штрафы' },
                    { key: 'qora', label: 'Увольнения' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={`join-item btn btn-sm ${typeFilter === t.key ? 'bg-lime-400 hover:bg-lime-500 border-0 text-lime-950' : 'btn-outline'}`}
                      onClick={() => setTypeFilter(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-base-content/50 ml-auto">
                  {filtered.length} из {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-16 text-base-content/40">
                  <AlertTriangle size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Взысканий пока нет ни у одного партнёра</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-base-content/40 text-sm">
                  Ничего не найдено
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Центр</th>
                        <th>Сотрудник</th>
                        <th>Причина</th>
                        <th>Кто выдал</th>
                        <th className="text-right">Сумма</th>
                        <th className="text-right">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p) => {
                        const meta = TYPE_META[p.type] ?? TYPE_META.shtraf;
                        return (
                          <tr key={p.id}>
                            <td className="font-medium">{p.partnerName ?? '—'}</td>
                            <td>
                              <div>{p.employeeName}</div>
                              <div className="text-xs text-base-content/45">
                                {ROLE_LABEL[p.employeeRole] ?? p.employeeRole}
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-sm ${meta.cls} mr-2`}>{meta.label}</span>
                              <span className="text-sm">{p.reason}</span>
                            </td>
                            <td className="text-sm">
                              {p.issuerName ?? '—'}
                              <div className="text-xs text-base-content/45">
                                {ROLE_LABEL[p.issuerRole] ?? p.issuerRole}
                              </div>
                            </td>
                            <td className="text-right tabular-nums font-semibold">
                              {p.amount == null ? '—' : `${fmt(p.amount)} ${cur}`}
                            </td>
                            <td className="text-right text-sm whitespace-nowrap">
                              {dateShort(p.createdAt)}
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
        </>
      )}
    </div>
  );
}
