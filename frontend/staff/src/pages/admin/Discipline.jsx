import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Ban, Coins, Plus, ScrollText, UserX, BookOpen, AlertTriangle, AlertCircle, Percent } from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';
import { useAdminPenalties, useAdminMentors, useMyDisciplineRules } from '../../queries.js';

/**
 * Дисциплина сотрудников филиала (панель Admin).
 *
 * Admin выписывает предупреждения (sariq/qizil) менторам и методистам,
 * а увольнение (qora) — только менторам (см. CAN_ISSUE в discipline.service.js).
 *
 * Бэкенд принимает только sariq/qizil/qora. shtraf отменён 2026-07-29.
 * amount — процент от оклада (0-100), НЕ сумма в сумах.
 */

const TYPE_META = {
  sariq: { label: 'Сарық', Icon: AlertTriangle, cls: 'bg-warning/10 text-warning', color: 'oklch(75% 0.15 85)' },
  qizil: { label: 'Қизил', Icon: AlertCircle, cls: 'bg-error/20 text-error', color: 'oklch(62% 0.24 25)' },
  qora: { label: 'Қора', Icon: Ban, cls: 'bg-neutral/20 text-neutral', color: 'oklch(45% 0 0)' },
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
function IssueModal({ open, onClose, staffList, onDone }) {
  const { token } = useAuth();
  const [type, setType] = useState('sariq');
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

    const parsed = amount !== '' ? Number(amount) : undefined;
    if (parsed != null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      return setErr('Процент должен быть от 0 до 100');
    }

    setBusy(true);
    try {
      await api.adminIssuePenalty(token, {
        targetUserId,
        type,
        reason: reason.trim(),
        ...(parsed != null ? { amount: parsed } : {}),
      });
      onDone();
      onClose();
      setTarget(''); setAmount(''); setReason(''); setType('sariq');
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
            {staffList.map((m) => (
              <option key={m.id} value={m.id}>
                {[m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ')} — {ROLE_LABEL[m.role] ?? m.role}
              </option>
            ))}
          </select>
          {staffList.length === 0 && (
            <span className="text-xs text-warning mt-1">
              Сотрудников не найдено
            </span>
          )}
        </label>

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Процент от оклада (необязательно)
          </span>
          <div className="join w-full">
            <input
              type="number"
              min="0"
              max="100"
              className="input input-bordered input-sm rounded-lg text-base sm:text-sm join-item flex-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            <span className="join-item btn btn-sm btn-ghost pointer-events-none text-base-content/45">%</span>
          </div>
          <span className="text-xs text-base-content/45 mt-1">
            Процент от оклада, который вычитается (например, 5 = −5% от оклада)
          </span>
        </label>

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

/* ── Панель правил дисциплины (каталог) ───────────────────────────────── */
function RulesPanel() {
  const { data, isLoading } = useMyDisciplineRules();
  const rules = data?.data ?? data ?? [];

  const TYPE_META_SMALL = {
    sariq: { label: 'Сарық', Icon: AlertTriangle, cls: 'badge-warning' },
    qizil: { label: 'Қизил', Icon: AlertCircle, cls: 'badge-error' },
    qora: { label: 'Қора', Icon: Ban, cls: 'badge-neutral' },
  };

  return (
    <Panel
      title="Правила дисциплины"
      icon={BookOpen}
      bodyClass="p-0"
    >
      {isLoading ? (
        <div className="p-4"><SkeletonTable /></div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Правил пока нет"
          hint="Super Admin может настроить правила дисциплины — они будут отображаться здесь как справочник."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Уровень</th>
                <th>Описание</th>
                <th className="text-right w-24">% от оклада</th>
                <th className="w-40">Добавлено</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const meta = TYPE_META_SMALL[r.type] ?? TYPE_META_SMALL.sariq;
                return (
                  <tr key={r.id}>
                    <td>
                      <span className={`badge badge-sm gap-1 ${meta.cls}`}>
                        <meta.Icon size={11} /> {meta.label}
                      </span>
                    </td>
                    <td className="text-sm max-w-md">{r.description}</td>
                    <td className="text-right tabular-nums">
                      {r.amount != null ? (
                        <span className="inline-flex items-center gap-0.5 font-semibold">
                          {r.amount} <Percent size={11} className="text-base-content/45" />
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-xs text-base-content/55">
                      {dateTime(r.created_at || r.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
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

  // Admin может выдать sariq/qizil менторам и методистам, qora — только менторам.
  // Собираем методистов и менторов вместе для формы, чтобы admin мог выбрать любого.
  const staff = useMemo(() =>
    mentorsList.map((m) => ({ ...m, role: m.role || 'mentor' })),
    [mentorsList],
  );

  const totals = useMemo(() => items.reduce((acc, p) => {
    if (p.type === 'sariq') acc.sariq += 1;
    else if (p.type === 'qizil') acc.qizil += 1;
    else if (p.type === 'qora') acc.qora += 1;
    return acc;
  }, { sariq: 0, qizil: 0, qora: 0 }), [items]);

  const shown = filter === 'all' ? items : items.filter((p) => p.type === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-penalties'] });

  return (
    <div className="space-y-6">
      <PageHeader title="Дисциплина" subtitle="Взыскания сотрудников филиала">
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
          <Kpi Icon={AlertTriangle} tone="warning" title="Сарық" value={fmt(totals.sariq)} unit="предупреждений" />
          <Kpi Icon={AlertCircle} tone="danger" title="Қизил" value={fmt(totals.qizil)} unit="предупреждений" />
          <Kpi Icon={Ban} tone="neutral" title="Қора" value={fmt(totals.qora)} unit="увольнений" />
        </div>
      )}

      <Panel
        title="История взысканий"
        icon={ScrollText}
        bodyClass="p-0"
        action={
          <div className="join">
            {[['all', 'Все'], ['sariq', 'Сарық'], ['qizil', 'Қизил'], ['qora', 'Қора']].map(([key, label]) => (
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
                  <th className="text-right">% от оклада</th>
                  <th>Причина</th>
                  <th>Выписал</th>
                  <th>Когда</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const meta = TYPE_META[p.type] ?? TYPE_META.sariq;
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
                        {p.amount == null ? '—' : `${Number(p.amount)}%`}
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

      <RulesPanel />

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        staffList={staff}
        onDone={refresh}
      />
    </div>
  );
}
