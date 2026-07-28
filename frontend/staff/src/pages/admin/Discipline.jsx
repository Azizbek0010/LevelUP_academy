import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Ban, Coins, Plus, ScrollText, UserX } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';
import { useAdminPenalties, useAdminMentors } from '../../queries.js';

/**
 * Дисциплина сотрудников филиала (панель Admin).
 *
 * Admin выписывает штрафы (shtraf) менторам и методистам, а увольнение (qora)
 * — только менторам (CAN_ISSUE в discipline.service.js).
 *
 * Список.methodists у admin нет — в форме выбираем только mentors.
 * Бэкенд всё равно проверяет права при выписке.
 */

const TYPE_META = {
  shtraf: { label: 'Штраф', Icon: Coins, cls: 'bg-warning/10 text-warning', color: 'oklch(75% 0.15 85)' },
  qora: { label: 'Увольнение', Icon: Ban, cls: 'bg-error/10 text-error', color: 'oklch(62% 0.24 25)' },
};

const ROLE_LABEL = {
  mentor: 'Ментор',
  methodist: 'Методист',
  admin: 'Администратор',
};

function dateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Модалка «Выписать взыскание» ──────────────────────────────────────── */
function IssueModal({ open, onClose, mentors, onDone }) {
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
      await api.adminIssuePenalty(token, {
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
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {[m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ')} — Ментор
              </option>
            ))}
          </select>
          {mentors.length === 0 && (
            <span className="text-xs text-warning mt-1">
              Менторов не найдено — сначала добавьте ментора
            </span>
          )}
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
            <span>Сотрудник потеряет доступ к системе. Вернуть его может Super Admin.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Основной компонент ────────────────────────────────────────────────── */
export default function AdminDiscipline() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [issueOpen, setIssueOpen] = useState(false);

  const penalties = useAdminPenalties();
  const mentorsQuery = useAdminMentors();

  const items = penalties.data?.data ?? penalties.data ?? [];
  const mentorsRaw = mentorsQuery.data?.data || mentorsQuery.data || {};
  const mentorsList = mentorsRaw.mentors || (Array.isArray(mentorsRaw) ? mentorsRaw : []);

  const staff = useMemo(() =>
    mentorsList.map((m) => ({ ...m, role: 'mentor' })),
    [mentorsList],
  );

  const totals = useMemo(() => items.reduce((acc, p) => {
    if (p.type === 'shtraf') { acc.shtraf += 1; acc.amount += Number(p.amount) || 0; }
    else acc.qora += 1;
    return acc;
  }, { shtraf: 0, qora: 0, amount: 0 }), [items]);

  const shown = filter === 'all' ? items : items.filter((p) => p.type === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-penalties'] });

  return (
    <div className="space-y-6">
      <PageHeader title="Дисциплина" subtitle="Штрафы и увольнения сотрудников филиала">
        <button
          className="btn btn-primary btn-sm gap-1.5"
          onClick={() => setIssueOpen(true)}
        >
          <Plus size={15} /> Взыскание
        </button>
      </PageHeader>

      {penalties.isLoading ? (
        <SkeletonKpis count={3} className="grid-cols-2 lg:grid-cols-3" />
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
                      <td className="max-w-xs"><span className="text-sm">{p.reason}</span></td>
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

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        mentors={staff}
        onDone={refresh}
      />
    </div>
  );
}
