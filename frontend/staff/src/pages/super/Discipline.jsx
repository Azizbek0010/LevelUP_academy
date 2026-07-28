import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ShieldAlert, Ban, Coins, Plus, ScrollText, UserX, RotateCcw, Trash2, ListChecks, TriangleAlert,
} from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';
import { TYPE_META } from '../../discipline-meta.js';

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
 * Четыре вида записи, от мягкого к жёсткому:
 *   sariq  — жёлтое предупреждение, без денег и без блокировки входа;
 *   qizil  — красное (строгое) предупреждение, тоже без денег и блокировки;
 *   shtraf — денежный штраф, сумма обязательна;
 *   qora   — увольнение («чёрная метка»), суммы нет, сотрудник теряет вход.
 *
 * sariq/qizil — НЕ автоматика: система не считает пороги и не превращает
 * несколько предупреждений в qora сама. Это осталось ручным решением того,
 * кто выдаёт взыскание — как раньше был только qora.
 *
 * Свободный текстовый устав убран 2026-07-28 — каталог правил (qoyda) ниже
 * заменяет его целиком: конкретное нарушение → конкретный уровень, структурой,
 * а не абзацем прозы. Самопросмотр сотрудника (MyDiscipline.jsx) теперь тоже
 * показывает этот каталог вместо устава.
 */

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

// Эмодзи-маркер цвета внутри <option> — CSS-цвет текста у нативных option
// ненадёжен по браузерам, а цветной эмодзи-кружок рендерится всегда одинаково.
const TYPE_DOT = { sariq: '🟡', qizil: '🔴', shtraf: '💰', qora: '⚫' };

/* ── Выписать взыскание ───────────────────────────────────────────────────
   Взыскание больше не выбирает уровень и не описывает причину заново —
   и то, и другое уже задано в правиле (qoyda). Тут только «кому» и «за
   какое из уже описанных правил»; цвет/уровень и сумма штрафа подтягиваются
   из выбранного правила автоматически. */
function IssueModal({ open, onClose, staff, rules, onDone }) {
  const { token } = useAuth();
  const [targetUserId, setTarget] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const rule = rules.find((r) => r.id === ruleId) ?? null;
  const meta = rule ? (TYPE_META[rule.type] ?? TYPE_META.sariq) : null;

  const pickRule = (id) => {
    setRuleId(id);
    const r = rules.find((x) => x.id === id);
    setAmount(r?.amount != null ? String(r.amount) : '');
    setReason(r?.description ?? '');
  };

  if (!open) return null;

  const submit = async () => {
    setErr('');
    if (!targetUserId) return setErr('Выберите сотрудника');
    if (!rule) return setErr('Выберите нарушенное правило');
    if (!reason.trim()) return setErr('Укажите причину');
    if (rule.type === 'shtraf' && !amount) return setErr('Для штрафа нужна сумма');

    setBusy(true);
    try {
      // amount отправляем ТОЛЬКО для штрафа: схема на бэкенде отклоняет сумму
      // у остальных уровней и, наоборот, требует её у штрафа
      await api.superIssuePenalty(token, {
        targetUserId,
        type: rule.type,
        reason: reason.trim(),
        ...(rule.type === 'shtraf' ? { amount: Number(amount) } : {}),
      });
      onDone();
      onClose();
      setTarget(''); setRuleId(''); setAmount(''); setReason('');
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

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Какое правило нарушено
          </span>
          <select
            className="select select-bordered select-sm rounded-lg"
            value={ruleId}
            onChange={(e) => pickRule(e.target.value)}
          >
            <option value="">Выберите правило</option>
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {TYPE_DOT[r.type] ?? ''} {r.description}
              </option>
            ))}
          </select>
          {rules.length === 0 && (
            <span className="text-xs text-warning mt-1">
              Правил ещё нет — сначала добавьте хотя бы одно кнопкой «Новое правило» выше
            </span>
          )}
        </label>

        {meta && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${meta.cls}`}>
            <meta.Icon size={14} /> {meta.label}
          </span>
        )}

        {rule?.type === 'shtraf' && (
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
              Подставлена из правила, можно поправить. Не списывается автоматически — запись для расчёта зарплаты
            </span>
          </label>
        )}

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Описание
          </span>
          <textarea
            rows={3}
            className="textarea textarea-bordered rounded-lg text-base sm:text-sm resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Подставится из правила — можно уточнить детали"
          />
        </label>

        {rule?.type === 'qora' && (
          <div className="alert alert-warning text-sm py-2">
            <UserX size={15} className="shrink-0" />
            <span>Сотрудник потеряет доступ к системе. Вернуть его можно кнопкой в списке.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Каталог правил (qoyda) ──────────────────────────────────────────────
   Структурированная альтернатива устава: конкретное нарушение → конкретный
   уровень (sariq/qizil/shtraf/qora), а не абзац в свободном тексте. Чисто
   справочник — ничего само не выдаёт и не считает пороги (см. TYPE_META). */
function NewRuleModal({ open, onClose, onDone }) {
  const { token } = useAuth();
  const [type, setType] = useState('sariq');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    setErr('');
    if (!description.trim()) return setErr('Опишите, за что выдаётся это правило');
    if (type === 'shtraf' && !amount) return setErr('Для штрафа нужна сумма');

    setBusy(true);
    try {
      await api.superCreateDisciplineRule(token, {
        type,
        description: description.trim(),
        ...(type === 'shtraf' ? { amount: Number(amount) } : {}),
      });
      onDone();
      onClose();
      setType('sariq'); setAmount(''); setDescription('');
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
      title="Новое правило"
      actions={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-xs" /> : 'Сохранить'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <div className="alert alert-error text-sm py-2">{err}</div>}

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5 block">
            Уровень
          </span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TYPE_META).map(([key, m]) => (
              <button
                key={key}
                className={`btn btn-sm h-auto py-2.5 gap-1.5 whitespace-normal leading-tight text-center ${type === key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setType(key)}
              >
                <m.Icon size={14} className="shrink-0" /> {m.label}
              </button>
            ))}
          </div>
        </div>

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
              placeholder="50000"
            />
          </label>
        )}

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            За что
          </span>
          <textarea
            rows={2}
            className="textarea textarea-bordered rounded-lg text-base sm:text-sm resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: опоздание более 15 минут"
          />
        </label>
      </div>
    </Modal>
  );
}

function RulesPanel({ rules, onChanged }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const remove = async (id) => {
    setBusyId(id);
    setErr('');
    try {
      await api.superDeleteDisciplineRule(token, id);
      onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Panel
      title="Правила (qoyda)"
      icon={ListChecks}
      action={
        <button className="btn btn-outline btn-xs gap-1" onClick={() => setOpen(true)}>
          <Plus size={13} /> Новое правило
        </button>
      }
    >
      {err && <div className="alert alert-error text-sm py-2 mb-3">{err}</div>}

      {rules.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Правил пока нет"
          hint="Опишите нарушение и уровень взыскания за него один раз — дальше на это правило можно ссылаться при выдаче взыскания."
        />
      ) : (
        <div className="space-y-2">
          {rules.map((r) => {
            const meta = TYPE_META[r.type] ?? TYPE_META.sariq;
            return (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-base-200/50">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 ${meta.cls}`}>
                  <meta.Icon size={12} /> {meta.label}
                </span>
                <span className="text-sm flex-1">{r.description}</span>
                {r.amount != null && (
                  <span className="text-sm font-semibold tabular-nums shrink-0">{money(Number(r.amount))}</span>
                )}
                <button
                  className="btn btn-ghost btn-xs shrink-0"
                  onClick={() => remove(r.id)}
                  disabled={busyId === r.id}
                  title="Удалить правило"
                >
                  {busyId === r.id
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Trash2 size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <NewRuleModal open={open} onClose={() => setOpen(false)} onDone={onChanged} />
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
  const rules = useQuery({
    queryKey: ['super-discipline-rules'],
    queryFn: () => api.superDisciplineRules(token),
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

  const totals = useMemo(() => {
    const acc = { amount: 0 };
    for (const key of Object.keys(TYPE_META)) acc[key] = 0;
    for (const p of items) {
      acc[p.type] = (acc[p.type] ?? 0) + 1;
      if (p.type === 'shtraf') acc.amount += Number(p.amount) || 0;
    }
    return acc;
  }, [items]);

  /* Статистика. Два разреза, оба из уже загруженного списка — отдельного
     эндпоинта аналитики по дисциплине нет, а считать по 200 записям в браузере
     дешевле, чем заводить его. Донат — соотношение видов, столбики — кто
     набрал больше всех. Оба разреза строятся по TYPE_META, а не по жёстко
     вписанным shtraf/qora — иначе каждый новый уровень взыскания надо было бы
     дописывать здесь руками. */
  const byType = useMemo(() => (
    Object.entries(TYPE_META)
      .map(([key, m]) => ({ name: m.label, value: totals[key] ?? 0, key }))
      .filter((d) => d.value > 0)
  ), [totals]);

  const byEmployee = useMemo(() => {
    const map = new Map();
    for (const p of items) {
      const name = p.target_name ?? p.targetName ?? '—';
      if (!map.has(name)) {
        const row = { name, total: 0 };
        for (const m of Object.values(TYPE_META)) row[m.label] = 0;
        map.set(name, row);
      }
      const row = map.get(name);
      const label = (TYPE_META[p.type] ?? TYPE_META.shtraf).label;
      row[label] += 1;
      row.total += 1;
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 6);
  }, [items]);

  const shown = filter === 'all' ? items : items.filter((p) => p.type === filter);
  const refresh = () => qc.invalidateQueries({ queryKey: ['super-penalties'] });
  const refreshRules = () => qc.invalidateQueries({ queryKey: ['super-discipline-rules'] });

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
      <PageHeader title="Дисциплина" subtitle="Устав, правила, предупреждения, штрафы и увольнения сотрудников">
        <button
          className="btn btn-primary btn-sm gap-1.5"
          onClick={() => setIssueOpen(true)}
        >
          <Plus size={15} /> Взыскание
        </button>
      </PageHeader>

      {err && <div className="alert alert-error text-sm py-2">{err}</div>}

      {penalties.isLoading ? (
        <SkeletonKpis count={5} className="grid-cols-2 lg:grid-cols-5" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Kpi Icon={TriangleAlert} tone="warning" title="Жёлтые" value={fmt(totals.sariq)} unit="предупреждений" />
          <Kpi Icon={ShieldAlert} tone="danger" title="Красные" value={fmt(totals.qizil)} unit="предупреждений" />
          <Kpi Icon={Coins} tone="neutral" title="Штрафы" value={fmt(totals.shtraf)} unit="записей" />
          <Kpi Icon={Coins} tone="neutral" title="Сумма штрафов" value={money(totals.amount)} />
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
                  {Object.values(TYPE_META).map((m, i, arr) => (
                    <Bar
                      key={m.label}
                      dataKey={m.label}
                      stackId="a"
                      fill={m.color}
                      radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
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
            {[['all', 'Все'], ...Object.entries(TYPE_META).map(([k, m]) => [k, m.label])].map(([key, label]) => (
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

      {rules.isLoading ? (
        <div className="skeleton h-32 w-full rounded-2xl" />
      ) : (
        <RulesPanel rules={rules.data?.data ?? []} onChanged={refreshRules} />
      )}

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        staff={staff}
        rules={rules.data?.data ?? []}
        onDone={refresh}
      />
    </div>
  );
}
