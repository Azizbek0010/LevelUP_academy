import { useState, useMemo } from 'react';
import {
  Search, Building2, CheckCircle2, Clock, PauseCircle, UserPlus, ArrowRight,
  GraduationCap, Wallet, LayoutGrid, List, Play, Pause, Globe, TrendingUp,
  Snowflake, AlertTriangle, X, Calendar, History, CreditCard, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, useInvalidate } from '../queries.js';
import { fmt, dateShort, ORG_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import OnboardModal from '../components/OnboardModal.jsx';
import { SkeletonKpis, SkeletonTable } from '../components/Skeleton.jsx';

const STATUS_ICON = { active: CheckCircle2, trial: Clock, frozen: PauseCircle };

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'active', label: 'Активные' },
  { key: 'trial', label: 'Триал' },
  { key: 'frozen', label: 'Заморожены' },
];

const SORT_OPTIONS = [
  { key: 'bill_desc', label: 'По доходу ↓' },
  { key: 'students_desc', label: 'По ученикам ↓' },
  { key: 'date_desc', label: 'По дате ↓' },
  { key: 'name_asc', label: 'По названию ↑' },
];

const FREEZE_REASONS = [
  'Нарушение условий договора',
  'Задержка оплаты',
  'Технические проблемы',
  'Проверка деятельности',
  'По запросу партнёра',
  'Другое',
];

function readFreezeMeta(id) {
  try {
    return JSON.parse(localStorage.getItem(`freeze_meta_${id}`) || 'null');
  } catch {
    return null;
  }
}

function StatCard({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={18} strokeWidth={2.3} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">{title}</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5">{value}</div>
            {unit && <div className="text-[11px] text-base-content/45">{unit}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ p, cur, maxBill, totalIncome, onToggle, busyId, onCardClick }) {
  const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
  const StatusIcon = STATUS_ICON[p.status];
  const isBusy = busyId === p.id;
  const pct = Math.max(4, ((p.monthlyBill || 0) / maxBill) * 100);
  const share = totalIncome > 0 ? ((p.monthlyBill / totalIncome) * 100).toFixed(1) : '0';

  return (
    <div
      onClick={() => onCardClick(p)}
      className="card bg-base-100 shadow-sm border border-base-200/60 hover:shadow-lg hover:border-lime-400/60 hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="card-body p-5 gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={p.name} size={46} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base leading-tight block truncate">{p.name}</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`badge badge-sm gap-1 ${s.cls}`}>
                {StatusIcon && <StatusIcon size={10} />}
                {s.label}
              </span>
              {p.domain && (
                <span className="text-xs text-base-content/50 flex items-center gap-1">
                  <Globe size={10} />
                  {p.domain}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-base-200/40 p-2">
            <div className="text-xs text-base-content/50">Ученики</div>
            <div className="font-extrabold text-base tabular-nums">{fmt(p.students)}</div>
          </div>
          <div className="text-center rounded-lg bg-base-200/40 p-2">
            <div className="text-xs text-base-content/50">Филиалы</div>
            <div className="font-extrabold text-base tabular-nums">{fmt(p.branches)}</div>
          </div>
          <div className="text-center rounded-lg bg-lime-50 p-2">
            <div className="text-xs text-lime-700/70">Счёт/мес</div>
            <div className="font-extrabold text-base tabular-nums text-lime-700">{fmt(p.monthlyBill)}</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-base-content/40 mb-1">
            <span>Доля дохода</span>
            <span>{share}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
            <div className="h-full rounded-full bg-lime-400 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="text-xs text-base-content/40">
          Создан {dateShort(p.createdAt)} · {cur}/мес
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className={`btn btn-sm flex-1 gap-1 ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
            disabled={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(p);
            }}
          >
            {isBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : p.status === 'frozen' ? (
              <><Play size={13} /> Активировать</>
            ) : (
              <><Pause size={13} /> Заморозить</>
            )}
          </button>
          <Link
            to={`/organizations/${p.id}`}
            className="btn btn-sm btn-ghost gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Детали <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FreezeModal({ partner, onConfirm, onClose, busy }) {
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Snowflake size={18} className="text-blue-500" />
          Заморозить партнёра
        </h3>
        <p className="text-sm text-base-content/60 mb-4">
          <span className="font-semibold">{partner.name}</span> — укажите причину и срок
        </p>
        <div className="space-y-4">
          <label className="form-control">
            <span className="label-text mb-1">Причина заморозки *</span>
            <select
              className="select select-bordered w-full"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">— выберите причину —</option>
              {FREEZE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1">Дата разморозки *</span>
            <input
              type="date"
              className="input input-bordered w-full"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
            <span className="text-xs opacity-50 mt-1">За 1 день до этой даты появится напоминание на дашборде</span>
          </label>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
          <button
            className="btn bg-blue-500 hover:bg-blue-600 border-0 text-white gap-2"
            disabled={!reason || !until || busy}
            onClick={() => {
              if (!reason || !until) return;
              onConfirm({ reason, until });
            }}
          >
            {busy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <><Snowflake size={15} /> Заморозить</>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function DetailModal({ partner, cur, onClose, onFreezeRequest, onActivate, busy }) {
  const s = ORG_STATUS[partner.status] || { label: partner.status, cls: 'badge-ghost' };
  const StatusIcon = STATUS_ICON[partner.status];
  const frozen = partner.status === 'frozen';
  const meta = frozen ? readFreezeMeta(partner.id) : null;

  const statusLabels = {
    active: 'Активен',
    trial: 'На пробном периоде',
    frozen: 'Заморожен',
  };
  const registrationLabel = new Date(partner.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-base-200 bg-gradient-to-r from-lime-50 to-transparent">
          <Avatar name={partner.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-lg leading-tight truncate">{partner.name}</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`badge badge-sm gap-1 ${s.cls}`}>
                {StatusIcon && <StatusIcon size={10} />}
                {s.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-base-content/50">
              <span className="flex items-center gap-1">
                <Calendar size={11} /> С {registrationLabel}
              </span>
              {partner.domain && (
                <span className="flex items-center gap-1">
                  <Globe size={11} /> {partner.domain}
                </span>
              )}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-circle shrink-0"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-lg bg-base-200/40 p-3">
              <div className="text-xs text-base-content/50">Филиалы</div>
              <div className="font-extrabold text-lg tabular-nums">{fmt(partner.branches)}</div>
            </div>
            <div className="text-center rounded-lg bg-base-200/40 p-3">
              <div className="text-xs text-base-content/50">Ученики</div>
              <div className="font-extrabold text-lg tabular-nums">{fmt(partner.students)}</div>
            </div>
            <div className="text-center rounded-lg bg-lime-50 p-3">
              <div className="text-xs text-lime-700/70">Счёт/мес</div>
              <div className="font-extrabold text-lg tabular-nums text-lime-700">{fmt(partner.monthlyBill)}</div>
            </div>
          </div>

          {/* History */}
          <div>
            <div className="text-xs font-semibold text-base-content/50 uppercase mb-2 flex items-center gap-1.5">
              <History size={12} /> История взаимодействия
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg p-2 bg-base-200/40">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-base-content/70">Онбординг:</span>
                <span className="font-semibold ml-auto">{dateShort(partner.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg p-2 bg-base-200/40">
                <CreditCard size={14} className="text-blue-500 shrink-0" />
                <span className="text-base-content/70">Первый платёж:</span>
                <span className="font-semibold ml-auto">~{dateShort(partner.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg p-2 bg-base-200/40">
                <Activity size={14} className="text-lime-600 shrink-0" />
                <span className="text-base-content/70">Статус:</span>
                <span className="font-semibold ml-auto">{statusLabels[partner.status] || partner.status}</span>
              </div>
            </div>
          </div>

          {/* Freeze meta */}
          {frozen && meta && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                <Snowflake size={12} /> Данные заморозки
              </div>
              <div className="space-y-1.5 text-sm">
                {meta.reason && (
                  <div className="flex justify-between gap-3">
                    <span className="text-base-content/60 shrink-0">Причина:</span>
                    <span className="font-semibold text-right">{meta.reason}</span>
                  </div>
                )}
                {meta.frozenAt && (
                  <div className="flex justify-between gap-3">
                    <span className="text-base-content/60 shrink-0">Заморожен:</span>
                    <span className="font-semibold">{new Date(meta.frozenAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
                {meta.until && (
                  <div className="flex justify-between gap-3">
                    <span className="text-base-content/60 shrink-0">До:</span>
                    <span className="font-semibold">{new Date(meta.until).toLocaleDateString('ru-RU')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {frozen && !meta && (
            <div className="alert bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span>Партнёр заморожен, но локальные данные о причине не найдены</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-base-200 flex gap-2 flex-wrap">
          <Link
            to={`/organizations/${partner.id}`}
            className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2 flex-1"
            onClick={onClose}
          >
            Открыть профиль <ArrowRight size={15} />
          </Link>
          {frozen ? (
            <button
              className="btn btn-success gap-2"
              onClick={() => onActivate(partner)}
              disabled={busy}
            >
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <><Play size={15} /> Активировать</>
              )}
            </button>
          ) : (
            <button
              className="btn btn-outline btn-error gap-2"
              onClick={() => onFreezeRequest(partner)}
              disabled={busy}
            >
              <Pause size={15} /> Заморозить
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default function Organizations() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data, isLoading, error } = useDashboard();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('bill_desc');
  const [view, setView] = useState('cards');
  const [err, setErr] = useState('');
  const [onboard, setOnboard] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [detailPartner, setDetailPartner] = useState(null);
  const [freezeTarget, setFreezeTarget] = useState(null);

  const partners = data?.partners || [];
  const cur = data?.totals?.currency || 'UZS';

  // Клик по «Заморозить»: если сейчас active/trial — открываем модалку с причиной.
  // Если сейчас frozen — размораживаем сразу без модалки.
  const toggle = async (p) => {
    if (p.status !== 'frozen') {
      setFreezeTarget(p);
      return;
    }
    setBusyId(p.id);
    setErr('');
    try {
      await api.setPartnerStatus(token, p.id, 'active');
      localStorage.removeItem(`freeze_meta_${p.id}`);
      invalidate('dashboard');
      if (detailPartner?.id === p.id) setDetailPartner(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmFreeze = async ({ reason, until }) => {
    if (!freezeTarget) return;
    const p = freezeTarget;
    setBusyId(p.id);
    setErr('');
    try {
      localStorage.setItem(`freeze_meta_${p.id}`, JSON.stringify({
        reason,
        until,
        frozenAt: new Date().toISOString(),
      }));
      await api.setPartnerStatus(token, p.id, 'frozen');
      invalidate('dashboard');
      setFreezeTarget(null);
      if (detailPartner?.id === p.id) setDetailPartner(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() =>
    partners.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {}),
    [partners],
  );

  const totals = useMemo(() => ({
    all: partners.length,
    students: partners.reduce((s, p) => s + (p.students || 0), 0),
    branches: partners.reduce((s, p) => s + (p.branches || 0), 0),
    income: partners.reduce((s, p) => s + (p.monthlyBill || 0), 0),
  }), [partners]);

  const maxBill = Math.max(1, ...partners.map((p) => p.monthlyBill || 0));

  const rows = useMemo(() => {
    let list = partners.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.domain || '').includes(q.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchQ && matchStatus;
    });
    list = [...list];
    if (sort === 'bill_desc') list.sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0));
    else if (sort === 'students_desc') list.sort((a, b) => (b.students || 0) - (a.students || 0));
    else if (sort === 'date_desc') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sort === 'name_asc') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [partners, q, statusFilter, sort]);

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Партнёры" subtitle="Учебные центры на платформе — статус, ученики, счёт">
        <button
          className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2"
          onClick={() => setOnboard(true)}
        >
          <UserPlus size={17} /> Новый партнёр
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading ? (
        <>
          <SkeletonKpis count={4} />
          <SkeletonTable rows={5} cols={5} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Всего" value={fmt(totals.all)} unit="партнёров" />
            <StatCard Icon={GraduationCap} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Ученики" value={fmt(totals.students)} unit="по всем" />
            <StatCard Icon={Building2} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} title="Филиалы" value={fmt(totals.branches)} unit="всего" />
            <StatCard Icon={Wallet} tint={{ bg: '#ECFCCB', fg: '#365314' }} title="Доход" value={fmt(totals.income)} unit={`${cur}/мес`} />
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200/60">
            <div className="card-body gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="input input-bordered input-sm max-w-xs flex items-center gap-2">
                  <Search size={14} className="text-base-content/40" />
                  <input
                    className="grow"
                    placeholder="Поиск по названию / домену…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </label>
                <div className="join">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`join-item btn btn-sm ${statusFilter === f.key ? 'bg-lime-400 hover:bg-lime-500 border-0 text-lime-950' : 'btn-ghost'}`}
                      onClick={() => setStatusFilter(f.key)}
                    >
                      {f.label}
                      {f.key !== 'all' && counts[f.key] ? <span className="badge badge-xs ml-1">{counts[f.key]}</span> : null}
                    </button>
                  ))}
                </div>
                <select
                  className="select select-bordered select-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
                <div className="join ml-auto">
                  <button
                    type="button"
                    className={`join-item btn btn-sm ${view === 'cards' ? 'btn-active' : 'btn-ghost'}`}
                    onClick={() => setView('cards')}
                    title="Карточки"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    type="button"
                    className={`join-item btn btn-sm ${view === 'table' ? 'btn-active' : 'btn-ghost'}`}
                    onClick={() => setView('table')}
                    title="Таблица"
                  >
                    <List size={14} />
                  </button>
                </div>
                <span className="text-sm opacity-50">{rows.length} партнёров</span>
              </div>

              {rows.length === 0 ? (
                <div className="text-center py-14">
                  <Building2 size={36} className="mx-auto text-base-content/25 mb-2" />
                  <div className="opacity-50 text-sm">
                    {q || statusFilter !== 'all' ? 'Ничего не найдено' : 'Партнёров нет'}
                  </div>
                </div>
              ) : view === 'cards' ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {rows.map((p) => (
                    <PartnerCard
                      key={p.id}
                      p={p}
                      cur={cur}
                      maxBill={maxBill}
                      totalIncome={totals.income}
                      onToggle={toggle}
                      busyId={busyId}
                      onCardClick={setDetailPartner}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Учебный центр</th>
                        <th>Домен</th>
                        <th className="text-right">Филиалы</th>
                        <th className="text-right">Ученики</th>
                        <th className="text-right">Счёт/мес ({cur})</th>
                        <th className="text-right">Доля</th>
                        <th>Статус</th>
                        <th>Создан</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
                        const StatusIcon = STATUS_ICON[p.status];
                        const share = totals.income > 0 ? ((p.monthlyBill / totals.income) * 100).toFixed(1) : '0.0';
                        const isBusy = busyId === p.id;
                        return (
                          <tr
                            key={p.id}
                            className="hover cursor-pointer"
                            onClick={() => setDetailPartner(p)}
                          >
                            <td>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={p.name} size={32} />
                                <span className="font-medium">{p.name}</span>
                              </div>
                            </td>
                            <td className="text-base-content/60 text-sm">{p.domain || '—'}</td>
                            <td className="text-right tabular-nums">{fmt(p.branches)}</td>
                            <td className="text-right tabular-nums">{fmt(p.students)}</td>
                            <td className="text-right font-semibold tabular-nums">{fmt(p.monthlyBill)}</td>
                            <td className="text-right text-xs text-base-content/50 tabular-nums">{share}%</td>
                            <td>
                              <span className={`badge badge-sm gap-1 ${s.cls}`}>
                                {StatusIcon && <StatusIcon size={11} />}
                                {s.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap text-sm text-base-content/60">{dateShort(p.createdAt)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Link
                                  to={`/organizations/${p.id}`}
                                  className="btn btn-xs btn-ghost"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ArrowRight size={13} />
                                </Link>
                                <button
                                  className={`btn btn-xs ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggle(p);
                                  }}
                                  disabled={isBusy}
                                >
                                  {isBusy ? <span className="loading loading-spinner loading-xs" /> : p.status === 'frozen' ? 'Актив.' : 'Заморозить'}
                                </button>
                              </div>
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

      {onboard && (
        <OnboardModal
          lead={null}
          onClose={() => setOnboard(false)}
          onDone={() => { setOnboard(false); invalidate('leads', 'dashboard'); }}
        />
      )}

      {detailPartner && (
        <DetailModal
          partner={detailPartner}
          cur={cur}
          onClose={() => setDetailPartner(null)}
          onFreezeRequest={(p) => setFreezeTarget(p)}
          onActivate={(p) => toggle(p)}
          busy={busyId === detailPartner.id}
        />
      )}

      {freezeTarget && (
        <FreezeModal
          partner={freezeTarget}
          onConfirm={confirmFreeze}
          onClose={() => setFreezeTarget(null)}
          busy={busyId === freezeTarget.id}
        />
      )}
    </div>
  );
}
