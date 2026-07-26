import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ShieldAlert, Ban, Coins, Plus, ScrollText, UserX, RotateCcw, Pencil, Save, X,
} from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';

/**
 * Дисциплина сотрудников организации.
 *
 * Экран живёт здесь, а не в панели владельца платформы, сознательно. Раньше
 * сводка штрафов по ВСЕМ организациям висела у Main Admin: он видел, кого из
 * чужих сотрудников наказали, за что и на сколько. Это внутреннее дело
 * учебного центра. По матрице прав (backend discipline.service.js — CAN_ISSUE)
 * main_admin не выписывает взысканий никому, а superadmin — может
 * администраторам, менторам и методистам своей организации.
 *
 * Два вида записи различаются смыслом, а не оформлением:
 *   shtraf — денежный штраф, сумма обязательна;
 *   qora   — увольнение («чёрный список»), суммы нет, сотрудник теряет вход.
 *
 * Устав тут же, а не отдельной страницей: правила и наказания за их нарушение
 * читают вместе. Пустой устав это норма, а не ошибка — бэкенд отдаёт для новой
 * организации шаблон с пустым текстом.
 */

const TYPE_META = {
  shtraf: { label: 'Штраф', Icon: Coins, cls: 'bg-warning/10 text-warning', color: 'oklch(75% 0.15 85)' },
  qora: { label: 'Увольнение', Icon: Ban, cls: 'bg-error/10 text-error', color: 'oklch(62% 0.24 25)' },
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

/* ── Выписать взыскание ───────────────────────────────────────────────── */
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
      // amount отправляем ТОЛЬКО для штрафа: схема на бэкенде отклоняет сумму
      // у увольнения и, наоборот, требует её у штрафа
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
          {staff.length === 0 && (
            <span className="text-xs text-warning mt-1">
              Сотрудников не найдено — сначала добавьте администратора или методиста
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
            <span>Сотрудник потеряет доступ к системе. Вернуть его можно кнопкой в списке.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Устав ────────────────────────────────────────────────────────────── */
function Charter({ charter, onSaved }) {
  const { token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // при открытии редактора подставляем то, что уже есть на сервере
  useEffect(() => {
    if (editing) {
      setTitle(charter?.title ?? 'Устав');
      setContent(charter?.content ?? '');
      setErr('');
    }
  }, [editing, charter]);

  const empty = !charter?.content?.trim();

  const save = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.superUpsertCharter(token, { title: title.trim() || 'Устав', content });
      onSaved();
      setEditing(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title={charter?.title || 'Устав организации'}
      icon={ScrollText}
      action={
        editing ? (
          <div className="flex gap-1.5">
            <button className="btn btn-ghost btn-xs gap-1" onClick={() => setEditing(false)} disabled={busy}>
              <X size={13} /> Отмена
            </button>
            <button className="btn btn-primary btn-xs gap-1" onClick={save} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-xs" /> : <><Save size={13} /> Сохранить</>}
            </button>
          </div>
        ) : (
          <button className="btn btn-outline btn-xs gap-1" onClick={() => setEditing(true)}>
            {empty ? <><Plus size={13} /> Создать</> : <><Pencil size={13} /> Изменить</>}
          </button>
        )
      }
    >
      {err && <div className="alert alert-error text-sm py-2 mb-3">{err}</div>}

      {editing ? (
        <div className="space-y-3">
          <label className="form-control">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
              Заголовок
            </span>
            <input
              className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Устав"
            />
          </label>
          <label className="form-control">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
              Правила
            </span>
            <textarea
              rows={12}
              className="textarea textarea-bordered rounded-lg text-base sm:text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'Например:\n1. Опоздание более 15 минут — штраф 50 000 сум.\n2. Пропуск занятия без предупреждения — штраф 100 000 сум.'}
            />
            <span className="text-xs text-base-content/45 mt-1">
              До 20 000 символов. Устав видят сотрудники организации
            </span>
          </label>
        </div>
      ) : empty ? (
        <EmptyState
          icon={ScrollText}
          title="Устав ещё не написан"
          hint="Пока правил нет, взыскание опирается только на формулировку в поле «Причина». Запишите правила один раз — и на них можно ссылаться."
        />
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap text-base-content/75 leading-relaxed">
            {charter.content}
          </p>
          {charter.updated_at && (
            <p className="text-xs text-base-content/40 mt-4 pt-3 border-t border-base-200">
              Обновлён {dateTime(charter.updated_at)}
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

export default function SuperDiscipline() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [issueOpen, setIssueOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

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

  /* Кого можно оштрафовать. По CAN_ISSUE это админы, менторы и методисты, но
     эндпоинта со списком менторов у Super Admin нет — есть только
     /super/admins и /super/methodists. Менторов штрафует администратор
     филиала, у которого их список есть.

     Ключи ответов разные, проверено на живом API: /super/admins отдаёт
     { admins: [...] }, /super/methodists — { methodists: [...] },
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

  /* Статистика. Два разреза, оба из уже загруженного списка — отдельного
     эндпоинта аналитики по дисциплине нет, а считать по 200 записям в браузере
     дешевле, чем заводить его. Донат — соотношение видов, столбики — кто
     набрал больше всех. */
  const byType = useMemo(() => ([
    { name: TYPE_META.shtraf.label, value: totals.shtraf, key: 'shtraf' },
    { name: TYPE_META.qora.label, value: totals.qora, key: 'qora' },
  ].filter((d) => d.value > 0)), [totals]);

  const byEmployee = useMemo(() => {
    const map = new Map();
    for (const p of items) {
      const name = p.target_name ?? p.targetName ?? '—';
      const cur = map.get(name) ?? { name, Штрафы: 0, Увольнения: 0, sum: 0 };
      if (p.type === 'shtraf') { cur.Штрафы += 1; cur.sum += Number(p.amount) || 0; }
      else cur.Увольнения += 1;
      map.set(name, cur);
    }
    return [...map.values()]
      .sort((a, b) => (b.Штрафы + b.Увольнения) - (a.Штрафы + a.Увольнения))
      .slice(0, 6);
  }, [items]);

  const shown = filter === 'all' ? items : items.filter((p) => p.type === filter);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['super-penalties'] });
    qc.invalidateQueries({ queryKey: ['super-charter'] });
  };

  const reactivate = async (p) => {
    const id = p.target_user_id ?? p.targetUserId;
    if (!id) return;
    setBusyId(p.id);
    setErr('');
    try {
      await api.superReactivateStaff(token, id);
      qc.invalidateQueries({ queryKey: ['super-penalties'] });
      qc.invalidateQueries({ queryKey: ['super-admins'] });
      qc.invalidateQueries({ queryKey: ['super-methodists'] });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Дисциплина" subtitle="Устав, штрафы и увольнения сотрудников">
        <button
          className="btn btn-primary btn-sm gap-1.5"
          onClick={() => setIssueOpen(true)}
        >
          <Plus size={15} /> Взыскание
        </button>
      </PageHeader>

      {err && <div className="alert alert-error text-sm py-2">{err}</div>}

      {penalties.isLoading ? (
        <SkeletonKpis count={3} className="grid-cols-2 lg:grid-cols-3" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Kpi Icon={Coins} tone="warning" title="Штрафы" value={fmt(totals.shtraf)} unit="записей" />
          <Kpi Icon={ShieldAlert} tone="neutral" title="Сумма штрафов" value={money(totals.amount)} />
          <Kpi Icon={Ban} tone="danger" title="Увольнения" value={fmt(totals.qora)} unit="сотрудников" />
        </div>
      )}

      {items.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="Соотношение взысканий" icon={ShieldAlert}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {byType.map((d) => (
                      <Cell key={d.key} fill={TYPE_META[d.key].color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4">
              {byType.map((d) => (
                <span key={d.key} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: TYPE_META[d.key].color }}
                  />
                  {d.name} · <span className="font-bold tabular-nums">{d.value}</span>
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Кто чаще получает" icon={UserX}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byEmployee} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={24} />
                  <Tooltip />
                  <Bar dataKey="Штрафы" stackId="a" fill={TYPE_META.shtraf.color} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Увольнения" stackId="a" fill={TYPE_META.qora.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
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
                  <th />
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
                      <td className="text-right">
                        {p.type === 'qora' && (
                          <button
                            className="btn btn-ghost btn-xs gap-1"
                            onClick={() => reactivate(p)}
                            disabled={busyId === p.id}
                            title="Снять увольнение и вернуть доступ"
                          >
                            {busyId === p.id
                              ? <span className="loading loading-spinner loading-xs" />
                              : <><RotateCcw size={12} /> Вернуть</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {charter.isLoading ? (
        <div className="skeleton h-40 w-full rounded-2xl" />
      ) : (
        <Charter charter={charter.data?.data} onSaved={refresh} />
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
