import { useState, useMemo } from 'react';
import {
  Search, Building2, CheckCircle2, Clock, PauseCircle, UserPlus, ArrowRight,
  GraduationCap, Wallet, LayoutGrid, List, Play, Pause, Globe, TrendingUp,
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

function PartnerCard({ p, cur, maxBill, totalIncome, onToggle, busyId }) {
  const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
  const StatusIcon = STATUS_ICON[p.status];
  const isBusy = busyId === p.id;
  const pct = Math.max(4, ((p.monthlyBill || 0) / maxBill) * 100);
  const share = totalIncome > 0 ? ((p.monthlyBill / totalIncome) * 100).toFixed(1) : '0';

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60 hover:shadow-md hover:border-lime-400/50 transition-all">
      <div className="card-body p-5 gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={p.name} size={46} />
          <div className="flex-1 min-w-0">
            <Link
              to={`/organizations/${p.id}`}
              className="font-bold text-base leading-tight block truncate hover:text-lime-600 transition-colors"
            >
              {p.name}
            </Link>
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

        <div className="flex items-center gap-2">
          <button
            className={`btn btn-sm flex-1 gap-1 ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
            disabled={isBusy}
            onClick={() => onToggle(p)}
          >
            {isBusy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : p.status === 'frozen' ? (
              <><Play size={13} /> Активировать</>
            ) : (
              <><Pause size={13} /> Заморозить</>
            )}
          </button>
          <Link to={`/organizations/${p.id}`} className="btn btn-sm btn-ghost gap-1">
            Детали <ArrowRight size={13} />
          </Link>
        </div>
      </div>
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

  const partners = data?.partners || [];
  const cur = data?.totals?.currency || 'UZS';

  const toggle = async (p) => {
    const next = p.status === 'frozen' ? 'active' : 'frozen';
    setBusyId(p.id);
    setErr('');
    try {
      await api.setPartnerStatus(token, p.id, next);
      invalidate('dashboard');
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
                          <tr key={p.id} className="hover">
                            <td>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={p.name} size={32} />
                                <Link to={`/organizations/${p.id}`} className="font-medium hover:text-lime-600 transition-colors">
                                  {p.name}
                                </Link>
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
                            <td>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Link to={`/organizations/${p.id}`} className="btn btn-xs btn-ghost">
                                  <ArrowRight size={13} />
                                </Link>
                                <button
                                  className={`btn btn-xs ${p.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                                  onClick={() => toggle(p)}
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
    </div>
  );
}
