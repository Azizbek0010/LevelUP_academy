import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ShieldAlert, Ban, Plus, ScrollText, UserX, RotateCcw, Trash2, ListChecks, TriangleAlert, Check,
} from 'lucide-react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../../components/Skeleton.jsx';
import { Kpi, Panel, EmptyState, Modal } from '../mentor/_ui.jsx';
import { TYPE_META, Dot, LevelBadge } from '../../discipline-meta.jsx';

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
 * Три вида записи, от мягкого к жёсткому:
 *   sariq — жёлтое предупреждение;
 *   qizil — красное (строгое) предупреждение;
 *   qora  — увольнение («чёрная метка»), сотрудник теряет вход.
 * Денежная сумма — необязательный довесок к любому из трёх (не 4-я
 * категория: «Штраф» как отдельный синий уровень отменён 2026-07-29).
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

/** Выбор сотрудника для «Взыскания» — тот же список-строка, что и у правил,
    вместо голого нативного <select> (тот и не красится под дизайн панели, и
    не показывает роль по-человечески). */
function StaffSelect({ staff, value, onChange }) {
  return (
    <div className="border border-base-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-base-200 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      {staff.map((s) => {
        const active = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-l-4 ${
              active
                ? 'bg-primary/10 border-l-primary font-semibold'
                : 'border-l-transparent hover:bg-base-200/50'
            }`}
          >
            <Check size={15} className={`shrink-0 ${active ? 'text-primary' : 'text-transparent'}`} />
            <span className="flex-1 truncate">{s.firstName} {s.lastName}</span>
            <span className="text-xs text-base-content/45 shrink-0">{ROLE_LABEL[s.role] ?? s.role}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Выбор правила для «Взыскания» — список строк внутри самой формы (не
    отдельная модалка): вложенный <dialog> внутри уже открытого <dialog>
    закрывался ненадёжно и мог всплыть заново — родной элемент модалок в
    этом проекте не рассчитан на вложенность. Строка = описание + бейдж
    уровня, как в таблице-референсе (Название/Категория). */
function RuleSelect({ rules, value, onChange }) {
  return (
    <div className="border border-base-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-base-200 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-base-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      {rules.map((r) => {
        const active = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-l-4 ${
              active
                ? 'bg-primary/10 border-l-primary font-semibold'
                : 'border-l-transparent hover:bg-base-200/50'
            }`}
          >
            <Check size={15} className={`shrink-0 ${active ? 'text-primary' : 'text-transparent'}`} />
            <span className="flex-1 truncate">{r.description}</span>
            <LevelBadge type={r.type} size="sm" />
          </button>
        );
      })}
    </div>
  );
}

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

    setBusy(true);
    try {
      // amount у штрафа обязателен, у остальных — необязательный довесок,
      // шлём его, только если поле реально показано и заполнено
      await api.superIssuePenalty(token, {
        targetUserId,
        type: rule.type,
        reason: reason.trim(),
        ...(amount ? { amount: Number(amount) } : {}),
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
          {staff.length === 0 ? (
            <span className="text-xs text-warning mt-1">
              Сотрудников не найдено — сначала добавьте администратора, ментора или методиста
            </span>
          ) : (
            <StaffSelect staff={staff} value={targetUserId} onChange={setTarget} />
          )}
        </label>

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Какое правило нарушено
          </span>
          {rules.length === 0 ? (
            <span className="text-xs text-warning mt-1">
              Правил ещё нет — сначала добавьте хотя бы одно кнопкой «Новое правило» выше
            </span>
          ) : (
            <RuleSelect rules={rules} value={ruleId} onChange={pickRule} />
          )}
        </label>

        {rule && rule.amount != null && (
          <label className="form-control">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
              Процент от оклада, %
            </span>
            <input
              type="number"
              min="0"
              max="100"
              className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5"
            />
            <span className="text-xs text-base-content/45 mt-1">
              Подставлен из правила, можно поправить. Не списывается автоматически — запись для расчёта зарплаты
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
   уровень (sariq/qizil/qora), а не абзац в свободном тексте. Сумма — не 4-й
   уровень, а необязательный довесок к любому из трёх. Чисто справочник —
   ничего само не выдаёт и не считает пороги (см. TYPE_META). */
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

    setBusy(true);
    try {
      await api.superCreateDisciplineRule(token, {
        type,
        description: description.trim(),
        // необязательный довесок у sariq/qizil/qora — шлём, только если вписали
        ...(amount ? { amount: Number(amount) } : {}),
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
            {Object.entries(TYPE_META).map(([key, m]) => {
              const active = type === key;
              const fillText = m.dark ? '#141B10' : '#ffffff';
              return (
                <button
                  key={key}
                  type="button"
                  className="btn btn-sm h-auto py-2.5 whitespace-normal leading-tight text-center border-2 bg-transparent"
                  style={active
                    ? { background: m.color, borderColor: m.color, color: fillText }
                    : { background: 'transparent', borderColor: m.color, color: m.color }}
                  onMouseEnter={(e) => {
                    if (active) return;
                    e.currentTarget.style.background = m.color;
                    e.currentTarget.style.color = fillText;
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = m.color;
                  }}
                  onClick={() => setType(key)}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="form-control">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
            Процент от оклада, % (необязательно)
          </span>
          <input
            type="number"
            min="0"
            max="100"
            className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Например, 5"
          />
        </label>

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
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Правило</th>
                <th>Уровень</th>
                <th className="text-right">% от оклада</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="hover">
                  <td className="text-sm">{r.description}</td>
                  <td><LevelBadge type={r.type} size="sm" /></td>
                  <td className="text-right tabular-nums font-semibold">
                    {r.amount != null ? `−${Number(r.amount)}%` : '—'}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => remove(r.id)}
                      disabled={busyId === r.id}
                      title="Удалить правило"
                    >
                      {busyId === r.id
                        ? <span className="loading loading-spinner loading-xs" />
                        : <Trash2 size={13} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const mentors = useQuery({
    queryKey: ['super-mentors'],
    queryFn: () => api.superMentors(token),
    enabled: !!token,
  });
  const rules = useQuery({
    queryKey: ['super-discipline-rules'],
    queryFn: () => api.superDisciplineRules(token),
    enabled: !!token,
  });

  const items = penalties.data?.data ?? [];

  /* Кого можно оштрафовать. По CAN_ISSUE это админы, менторы и методисты —
     раньше менторов тут не было: у Super Admin не было эндпоинта со списком
     менторов (заводит их Admin филиала), 2026-07-29 добавлен /super/mentors
     только на чтение специально для этого списка.

     Ключи ответов разные, проверено на живом API: /super/admins отдаёт
     { admins: [...] }, /super/methodists — { methodists: [...] },
     /super/mentors — { mentors: [...] }, /super/penalties — { data: [...] }. */
  const staff = useMemo(() => [
    ...(admins.data?.admins ?? []).map((u) => ({ ...u, role: 'admin' })),
    ...(mentors.data?.mentors ?? []).map((u) => ({ ...u, role: 'mentor' })),
    ...(methodists.data?.methodists ?? []).map((u) => ({ ...u, role: 'methodist' })),
  ], [admins.data, mentors.data, methodists.data]);

  const totals = useMemo(() => {
    const acc = {};
    for (const key of Object.keys(TYPE_META)) acc[key] = 0;
    for (const p of items) acc[p.type] = (acc[p.type] ?? 0) + 1;
    return acc;
  }, [items]);

  /* Статистика. Два разреза, оба из уже загруженного списка — отдельного
     эндпоинта аналитики по дисциплине нет, а считать по 200 записям в браузере
     дешевле, чем заводить его. Донат — соотношение видов, столбики — кто
     набрал больше всех. Оба разреза строятся по TYPE_META, а не по жёстко
     вписанным типам — иначе каждый новый уровень взыскания надо было бы
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
      const label = (TYPE_META[p.type] ?? TYPE_META.sariq).label;
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
      qc.invalidateQueries({ queryKey: ['super-mentors'] });
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
        <SkeletonKpis count={3} className="grid-cols-1 sm:grid-cols-3" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi Icon={TriangleAlert} tone="warning" title="Жёлтые" value={fmt(totals.sariq)} unit="предупреждений" />
          <Kpi Icon={ShieldAlert} tone="danger" title="Красные" value={fmt(totals.qizil)} unit="предупреждений" />
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
                  <Dot color={TYPE_META[d.key].color} size={10} />
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
            <button
              type="button"
              className={`btn btn-xs join-item ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
            {Object.entries(TYPE_META).map(([key, m]) => {
              const active = filter === key;
              const fillText = m.dark ? '#141B10' : '#ffffff';
              return (
                <button
                  key={key}
                  type="button"
                  className="btn btn-xs join-item border"
                  style={active
                    ? { background: m.color, borderColor: m.color, color: fillText }
                    : { background: 'transparent', borderColor: m.color, color: m.color }}
                  onMouseEnter={(e) => {
                    if (active) return;
                    e.currentTarget.style.background = m.color;
                    e.currentTarget.style.color = fillText;
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = m.color;
                  }}
                  onClick={() => setFilter(key)}
                >
                  {m.label}
                </button>
              );
            })}
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-semibold">{p.target_name ?? p.targetName ?? '—'}</div>
                        <div className="text-xs text-base-content/45">
                          {ROLE_LABEL[p.target_role ?? p.targetRole] ?? p.target_role}
                        </div>
                      </td>
                      <td>
                        <LevelBadge type={p.type} size="sm" />
                      </td>
                      <td className="text-right tabular-nums font-semibold">
                        {p.amount == null ? '—' : `−${Number(p.amount)}%`}
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
                        {(() => {
                          if (p.type !== 'qora') return null;
                          // Историческая запись остаётся qora навсегда, а уволен человек
                          // может быть уже не быть — сверяем с текущим статусом в staff,
                          // иначе кнопка «Вернуть» висит вечно и падает с 409 при повторном клике.
                          const targetId = p.target_user_id ?? p.targetUserId;
                          const stillFired = staff.find((s) => s.id === targetId)?.status === 'fired';
                          if (!stillFired) {
                            return <span className="text-xs text-base-content/35">Восстановлен</span>;
                          }
                          return (
                            <button
                              className="btn btn-outline btn-xs gap-1"
                              onClick={() => reactivate(p)}
                              disabled={busyId === p.id}
                              title="Снять увольнение и вернуть доступ"
                            >
                              {busyId === p.id
                                ? <span className="loading loading-spinner loading-xs" />
                                : <><RotateCcw size={12} /> Вернуть</>}
                            </button>
                          );
                        })()}
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
