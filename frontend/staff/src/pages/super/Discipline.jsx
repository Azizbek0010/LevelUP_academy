import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Ban, Coins, Plus, ScrollText, UserX } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';

/**
 * Дисциплина сотрудников организации.
 *
 * Экран появился здесь, а не в панели владельца платформы, сознательно.
 * Раньше сводка штрафов по ВСЕМ организациям висела у Main Admin: он видел,
 * кого из чужих сотрудников наказали, за что и на сколько. Это внутреннее дело
 * учебного центра. По матрице прав (backend/src/modules/discipline —
 * CAN_ISSUE) main_admin не выписывает взысканий никому, а superadmin — может
 * администраторам, менторам и методистам своей организации.
 *
 * Два вида записи различаются по смыслу, а не по оформлению:
 *   shtraf — денежный штраф, сумма обязательна;
 *   qora   — увольнение («чёрный список»), суммы нет, сотрудник теряет вход.
 */

const TYPE_META = {
  shtraf: { label: 'Штраф', Icon: Coins, cls: 'bg-warning/10 text-warning' },
  qora: { label: 'Увольнение', Icon: Ban, cls: 'bg-error/10 text-error' },
};

const ROLE_LABEL = {
  admin: 'Администратор',
  mentor: 'Ментор',
  methodist: 'Методист',
  superadmin: 'Super Admin',
};

function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function IssueModal({ open, onClose, staff, onDone }) {
  const { token } = useAuth();
  const [type, setType] = useState('shtraf');
  const [targetUserId, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    setErr('');
    if (!targetUserId) return setErr('Выберите сотрудника');
    if (!reason.trim()) return setErr('Укажите причину');
    if (type === 'shtraf' && !amount) return setErr('Для штрафа нужна сумма');

    setBusy(true);
    try {
      // amount отправляем ТОЛЬКО для штрафа: схема на бэкенде отклоняет
      // сумму у увольнения, и наоборот требует её у штрафа
      await api.superIssuePenalty(token, {
        targetUserId,
        type,
        reason: reason.trim(),
        ...(type === 'shtraf' ? { amount: Number(amount) } : {}),
      });
      onDone();
      onClose();
      setTarget(''); setAmount(''); setReason(''); setType('shtraf');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Взыскание сотруднику"
      actions={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-xs" /> : 'Выписать'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <div className="alert alert-error text-sm py-2">{err}</div>}

        <div className="join w-full">
          {Object.entries(TYPE_META).map(([key, m]) => (
            <button
              key={key}
              className={`btn btn-sm join-item flex-1 ${type === key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setType(key)}
            >
              <m.Icon size={14} /> {m.label}
            </button>
          ))}
        </div>

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Сотрудник
          </span>
          <select
            className="select select-bordered select-sm rounded-lg"
            value={targetUserId}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">Выберите сотрудника</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} — {ROLE_LABEL[s.role] ?? s.role}
              </option>
            ))}
          </select>
        </label>

        {type === 'shtraf' && (
          <label className="form-control">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
              Сумма, сум
            </span>
            <input
              type="number"
              min="0"
              className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
            <span className="text-xs text-base-content/45 mt-1">
              Сумма не списывается автоматически — это запись для расчёта зарплаты
            </span>
          </label>
        )}

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Причина
          </span>
          <textarea
            rows={3}
            className="textarea textarea-bordered rounded-lg text-base sm:text-sm resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="За что выносится взыскание"
          />
        </label>

        {type === 'qora' && (
          <div className="alert alert-warning text-sm py-2">
            <UserX size={15} className="shrink-0" />
            <span>Сотрудник потеряет доступ к системе. Вернуть его можно через список сотрудников.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function SuperDiscipline() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [issueOpen, setIssueOpen] = useState(false);

  const penalties = useQuery({
    queryKey: ['super-penalties'],
    queryFn: () => api.superPenalties(token),
    enabled: !!token,
  });
  const admins = useQuery({
    queryKey: ['super-admins'],
    queryFn: () => api.superAdmins(token),
    enabled: !!token,
  });
  const methodists = useQuery({
    queryKey: ['super-methodists'],
    queryFn: () => api.superMethodists(token),
    enabled: !!token,
  });
  const charter = useQuery({
    queryKey: ['super-charter'],
    queryFn: () => api.superCharter(token),
    enabled: !!token,
  });

  const items = penalties.data?.data ?? [];

  /* Кого можно оштрафовать. По CAN_ISSUE это админы, менторы и методисты,
     но эндпоинта со списком менторов у Super Admin нет — есть только
     /super/admins и /super/methodists. Пока выбираем из них; менторов
     штрафует администратор филиала, у которого их список есть.

     Ключи ответов разные и это проверено на живом API: /super/admins отдаёт
     { admins: [...] }, /super/methodists — { methodists: [...] }, а
     /super/penalties — { data: [...] }. */
  const staff = useMemo(() => [
    ...(admins.data?.admins ?? []).map((u) => ({ ...u, role: 'admin' })),
    ...(methodists.data?.methodists ?? []).map((u) => ({ ...u, role: 'methodist' })),
  ], [admins.data, methodists.data]);

  const totals = useMemo(() => items.reduce((acc, p) => {
    if (p.type === 'shtraf') { acc.shtraf += 1; acc.amount += Number(p.amount) || 0; }
    else acc.qora += 1;
    return acc;
  }, { shtraf: 0, qora: 0, amount: 0 }), [items]);

  const shown = filter === 'all' ? items : items.filter((p) => p.type === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ['super-penalties'] });

  return (
    <div className="space-y-6">
      <PageHeader title="Дисциплина" subtitle="Штрафы и увольнения сотрудников организации">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={() => setIssueOpen(true)}>
          <Plus size={15} /> Взыскание
        </button>
      </PageHeader>

      {penalties.isLoading ? (
        <SkeletonKpis />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi Icon={Coins} tone="warning" title="Штрафы" value={fmt(totals.shtraf)} unit="записей" />
          <Kpi Icon={ShieldAlert} tone="neutral" title="Сумма штрафов" value={money(totals.amount)} />
          <Kpi Icon={Ban} tone="danger" title="Увольнения" value={fmt(totals.qora)} unit="сотрудников" />
        </div>
      )}

      <Panel
        title="История взысканий"
        icon={ScrollText}
        bodyClass="p-0"
        action={
          <div className="join">
            {[['all', 'Все'], ['shtraf', 'Штрафы'], ['qora', 'Увольнения']].map(([key, label]) => (
              <button
                key={key}
                className={`btn btn-xs join-item ${filter === key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {penalties.isLoading ? (
          <div className="p-4"><SkeletonTable /></div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={items.length === 0 ? 'Взысканий нет' : 'В этой категории пусто'}
            hint={items.length === 0 ? 'Хорошая новость: сотрудники работают без нарушений.' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th>Вид</th>
                  <th className="text-right">Сумма</th>
                  <th>Причина</th>
                  <th>Выписал</th>
                  <th>Когда</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const meta = TYPE_META[p.type] ?? TYPE_META.shtraf;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-semibold">{p.target_name ?? p.targetName ?? '—'}</div>
                        <div className="text-xs text-base-content/45">
                          {ROLE_LABEL[p.target_role ?? p.targetRole] ?? p.target_role}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${meta.cls}`}>
                          <meta.Icon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="text-right tabular-nums font-semibold">
                        {p.amount == null ? '—' : money(Number(p.amount))}
                      </td>
                      <td className="max-w-xs">
                        <span className="text-sm">{p.reason}</span>
                      </td>
                      <td className="text-sm">
                        {p.issued_by_name ?? p.issuedByName ?? '—'}
                        <div className="text-xs text-base-content/45">
                          {ROLE_LABEL[p.issuer_role ?? p.issuerRole] ?? ''}
                        </div>
                      </td>
                      <td className="text-xs text-base-content/55 whitespace-nowrap">
                        {dateTime(p.created_at ?? p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {charter.data?.content && (
        <Panel title="Устав организации" icon={ScrollText}>
          <p className="text-sm whitespace-pre-wrap text-base-content/70">{charter.data.content}</p>
        </Panel>
      )}

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        staff={staff}
        onDone={refresh}
      />
    </div>
  );
}
