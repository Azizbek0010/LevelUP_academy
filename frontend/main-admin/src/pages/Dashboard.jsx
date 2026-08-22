import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Building2, GraduationCap, Store, RefreshCw, ArrowRight,
  Inbox, Crown, Sparkles, PhoneCall, CheckCircle2, XCircle,
  X, TrendingUp, Snowflake, Zap, PieChart as PieIcon,
  Calculator, Percent, Award, ChevronRight, Power, Pause,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { fmt, dateShort, LEAD_STATUS, ORG_STATUS } from '../format.js';
import { tierRange, tierPriceLabel } from '../lib/pricing.js';
import { useDashboard, useLeads, useInvalidate } from '../queries.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonList } from '../components/Skeleton.jsx';
import { Kpi, Modal, Avatar, CHART_PRIMARY, CHART_SERIES } from '../components/_ui.jsx';

const PIE_COLORS = { active: '#A3E635', trial: '#FCD34D', frozen: '#F87171' };
const PIE_LABELS = { active: 'Активные', trial: 'Триал', frozen: 'Заморожены' };
const STATUS_ICON = { new: Sparkles, contacted: PhoneCall, onboarded: CheckCircle2, rejected: XCircle };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-200 rounded-md shadow-xl px-4 py-3 text-sm">
      <div className="font-semibold mb-1 truncate max-w-[200px]">{payload[0]?.payload?.fullName || label}</div>
      <div className="text-primary font-bold">{fmt(payload[0]?.value)} UZS/мес</div>
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: allLeads } = useLeads();

  const recentLeads = useMemo(
    () => (allLeads || [])
      .filter((l) => l.status === 'new' || l.status === 'contacted')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4),
    [allLeads],
  );
  const newLeadsCount = (allLeads || []).filter((l) => l.status === 'new').length;

  if (error && error.status !== 401) {
    return (
      <div className="alert alert-error text-sm flex items-center justify-between">
        <span>{error.message}</span>
        <button className="btn btn-sm btn-ghost gap-1" onClick={() => refetch()}>
          <RefreshCw size={14} /> Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Дашборд платформы" subtitle="Обзор партнёров, дохода и заявок LevelUp Academy" />
        <button
          className="btn btn-ghost btn-sm gap-1.5 shrink-0 mt-1"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {isLoading || !data ? (
        <>
          <SkeletonKpis count={4} />
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="card bg-base-100 lg:col-span-2"><div className="card-body"><SkeletonList rows={6} /></div></div>
            <div className="card bg-base-100"><div className="card-body"><SkeletonList rows={5} /></div></div>
          </div>
        </>
      ) : (
        <Loaded
          data={data}
          recentLeads={recentLeads}
          newLeadsCount={newLeadsCount}
          allLeadsCount={(allLeads || []).length}
        />
      )}
    </div>
  );
}

function Loaded({ data, recentLeads, newLeadsCount, allLeadsCount }) {
  const t = data.totals;
  const cur = t.currency;
  const pricing = data.pricing || {};
  const partners = data.partners || [];

  const [modal, setModal] = useState(null); // 'income' | 'partners' | 'students' | 'branches' | { type:'partner', p }
  const [barModal, setBarModal] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');
  const { token } = useAuth();
  const invalidate = useInvalidate();

  /* Здесь был блок «Скоро разморозка»: он читал дату разморозки из
     localStorage браузера. Ни база, ни API такого поля не хранят — напоминание
     видел только тот, кто сам нажал «Заморозить», на своей же машине, и оно
     исчезало вместе с очисткой кэша. Убрано вместе с формой причины и срока
     заморозки (см. Organizations.jsx). Если напоминание нужно по-настоящему —
     это поля frozen_until/frozen_reason у organizations плюс отдача их в
     /main/dashboard, то есть работа на бэкенде, а не в браузере. */

  const barPartner = barModal ? partners.find((p) => p.id === barModal.id) : null;

  const sorted = [...partners].sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0));
  const topPartners = sorted.slice(0, 6);
  const maxBill = Math.max(1, ...partners.map((p) => p.monthlyBill || 0));
  const totalIncome = partners.reduce((s, p) => s + (p.monthlyBill || 0), 0);
  const activeCount = partners.filter((p) => p.status === 'active').length;
  const trialCount = partners.filter((p) => p.status === 'trial').length;
  const frozenCount = partners.filter((p) => p.status === 'frozen').length;
  const avgBill = partners.length ? Math.round(totalIncome / partners.length) : 0;
  const activeShare = partners.length ? Math.round((activeCount / partners.length) * 100) : 0;
  const frozenShare = partners.length ? Math.round((frozenCount / partners.length) * 100) : 0;

  const barData = topPartners.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name,
    fullName: p.name,
    value: p.monthlyBill || 0,
    id: p.id,
  }));

  const statusCounts = partners.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: PIE_LABELS[status] || status,
    key: status,
    value: count,
    color: PIE_COLORS[status] || '#94a3b8',
  }));

  const topByStudents = [...partners].sort((a, b) => (b.students || 0) - (a.students || 0)).slice(0, 5);
  const topByBranches = [...partners].sort((a, b) => (b.branches || 0) - (a.branches || 0)).slice(0, 5);

  const togglePartnerStatus = async (p) => {
    if (!p) return;
    const next = p.status === 'active' ? 'frozen' : 'active';
    setBusyId(p.id);
    setErr('');
    try {
      await api.setPartnerStatus(token, p.id, next);
      invalidate('dashboard');
      setModal(null);
      setBarModal(null);
    } catch (e) {
      // было alert(): единственное место в панели, где ошибка выпадала
      // системным окном поверх интерфейса — везде остальное показывается в вёрстке
      setErr(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {err && (
        <div className="alert alert-error mb-4 text-sm">
          <span>{err}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          Icon={Wallet}
          title="Наш доход / мес"
          value={fmt(t.ourMonthlyIncome)}
          unit={`${cur} · разбивка`}
          onClick={() => setModal('income')}
        />
        <Kpi
          Icon={Building2}
          title="Партнёры"
          value={fmt(t.partners)}
          unit="учебных центров · по статусам"
          onClick={() => setModal('partners')}
        />
        <Kpi
          Icon={GraduationCap}
          title="Ученики"
          value={fmt(t.students)}
          unit="по платформе · топ 5"
          onClick={() => setModal('students')}
        />
        <Kpi
          Icon={Store}
          title="Филиалы"
          value={fmt(t.branches)}
          unit="всего · распределение"
          onClick={() => setModal('branches')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-sm border border-base-200/60 lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown size={17} className="text-primary" />
                <h2 className="card-title text-base">Доход по партнёрам</h2>
                <span className="text-xs text-base-content/40">({cur}/мес)</span>
              </div>
              <Link to="/revenue" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                Все <ArrowRight size={13} />
              </Link>
            </div>

            {barData.length === 0 ? (
              <div className="text-center py-12">
                <Building2 size={32} className="mx-auto text-base-content/20 mb-2" />
                <p className="text-base-content/40 text-sm">Пока нет партнёров</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PRIMARY} />
                      <stop offset="100%" stopColor={CHART_SERIES[3]} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}к`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FEE7' }} />
                  <Bar
                    dataKey="value"
                    fill="url(#revenue-grad)"
                    maxBarSize={44}
                    onClick={(d) => setBarModal(d?.payload || null)}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {pieData.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body p-5">
                <div className="flex items-center gap-2 mb-3">
                  <PieIcon size={15} className="text-primary" />
                  <h2 className="card-title text-sm">По статусам</h2>
                </div>
                <div className="flex items-center gap-3">
                  <PieChart width={100} height={100}>
                    <Pie data={pieData} cx={48} cy={48} innerRadius={26} outerRadius={46} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="space-y-1.5 flex-1">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          {entry.name}
                        </span>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card bg-base-100 shadow-sm border border-base-200/60 flex-1">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Inbox size={15} className="text-primary" />
                  <h2 className="card-title text-sm">Активные заявки</h2>
                </div>
                {newLeadsCount > 0 && (
                  <Link to="/leads" className="badge badge-error badge-sm">{newLeadsCount} новых</Link>
                )}
              </div>
              <div className="divide-y divide-base-200 -mb-2">
                {recentLeads.length === 0 ? (
                  <div className="text-center py-6">
                    <Inbox size={24} className="mx-auto text-base-content/25 mb-1" />
                    <p className="text-base-content/40 text-xs">Активных заявок нет</p>
                  </div>
                ) : (
                  recentLeads.map((l) => {
                    const s = LEAD_STATUS[l.status] || { label: l.status, cls: 'badge-ghost' };
                    const StatusIcon = STATUS_ICON[l.status];
                    return (
                      <Link
                        key={l.id}
                        to="/leads"
                        className="py-2.5 flex items-center gap-2.5 hover:bg-base-200/50 -mx-5 px-5 transition-colors"
                      >
                        <Avatar name={l.centerName || l.name} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{l.centerName || l.name}</div>
                          <div className="text-xs text-base-content/50">{dateShort(l.createdAt)}</div>
                        </div>
                        <span className={`badge badge-sm gap-1 ${s.cls}`}>
                          {StatusIcon && <StatusIcon size={10} />}
                          {s.label}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
              {(allLeadsCount > 0 || recentLeads.length > 0) && (
                <Link to="/leads" className="btn btn-ghost btn-xs w-full mt-3 gap-1">
                  Все заявки ({allLeadsCount}) <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {partners.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200/60">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-primary" />
                <h2 className="card-title text-base">ТОП партнёров</h2>
                <span className="text-xs text-base-content/40">{activeCount} активных</span>
              </div>
              <Link to="/organizations" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                Все партнёры <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2">
              {topPartners.map((p, i) => {
                const pct = Math.max(4, ((p.monthlyBill || 0) / maxBill) * 100);
                const share = totalIncome > 0 ? ((p.monthlyBill / totalIncome) * 100).toFixed(1) : '0.0';
                const statusCls = { active: 'badge-success', trial: 'badge-warning', frozen: 'badge-error' };
                const statusLabel = { active: 'Активен', trial: 'Триал', frozen: 'Заморожен' };
                return (
                  <button
                    type="button"
                    key={p.id}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                    onClick={() => setModal({ type: 'partner', p })}
                  >
                    <span className="w-6 text-center text-xs font-extrabold text-base-content/40 tabular-nums">{i + 1}</span>
                    <Avatar name={p.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1.5 gap-2 items-center">
                        <span className="truncate font-medium hover:text-primary transition-colors">{p.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-base-content/50 tabular-nums">{share}%</span>
                          <span className={`badge badge-xs ${statusCls[p.status] || 'badge-ghost'}`}>{statusLabel[p.status] || p.status}</span>
                          <span className="font-bold tabular-nums">{fmt(p.monthlyBill)}</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-base-200 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: i === 0 ? `linear-gradient(90deg,${CHART_PRIMARY},${CHART_SERIES[3]})` : CHART_PRIMARY }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-base-content/30 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Platform metrics — pill cards */}
      {partners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PillMetric
            Icon={Calculator}
            title="Средний счёт партнёра"
            value={`${fmt(avgBill)} ${cur}`}
            tone="primary"
          />
          <PillMetric
            Icon={TrendingUp}
            title="Доля активных"
            value={`${activeShare}%`}
            sub={`${activeCount} из ${partners.length}`}
            tone="success"
          />
          <PillMetric
            Icon={Snowflake}
            title="Доля замороженных"
            value={`${frozenShare}%`}
            sub={`${frozenCount} партнёров`}
            tone="danger"
          />
        </div>
      )}

      {/* ---------- MODALS ---------- */}
      <Modal
        open={modal === 'income'}
        onClose={() => setModal(null)}
        title="Наш доход / месяц"
        subtitle="Как считается выручка платформы"
        Icon={Wallet}
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-content">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Итого / мес</div>
            <div className="text-4xl font-black mt-1">{fmt(t.ourMonthlyIncome)} <span className="text-base font-bold">{cur}</span></div>
            <div className="text-xs mt-2 opacity-70">Сумма счетов {partners.length} активных партнёров</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-base-200 p-4">
              <div className="text-[11px] text-base-content/50 uppercase font-semibold">Средний счёт</div>
              <div className="text-2xl font-extrabold mt-1">{fmt(avgBill)} <span className="text-xs text-base-content/50">{cur}</span></div>
            </div>
            <div className="rounded-md border border-base-200 p-4">
              <div className="text-[11px] text-base-content/50 uppercase font-semibold">Партнёров на биллинге</div>
              <div className="text-2xl font-extrabold mt-1">{fmt(partners.length)}</div>
            </div>
          </div>

          {/* Тарифы — бакеты по общему числу активных аккаунтов. Здесь стояла старая
              формула (база + доп. филиал + за ученика): бэкенд этих полей не
              отдаёт, и все три строки печатали пустое значение. */}
          <div className="rounded-md bg-base-200/50 p-4 space-y-2">
            <div className="text-xs font-semibold text-base-content/60 uppercase mb-1">Тарифы по числу активных аккаунтов</div>
            {(pricing.tiers ?? []).map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>{t.label} <span className="text-base-content/45">· {tierRange(t)}</span></span>
                <span className="font-bold tabular-nums">{tierPriceLabel(t, cur)}</span>
              </div>
            ))}
            <div className="text-xs text-base-content/45 pt-1">Филиалы входят в тариф без доплаты</div>
          </div>

          <Link to="/revenue" className="btn btn-primary text-primary-content w-full gap-2" onClick={() => setModal(null)}>
            <TrendingUp size={16} /> Открыть отчёт по доходу
          </Link>
        </div>
      </Modal>

      <Modal
        open={modal === 'partners'}
        onClose={() => setModal(null)}
        title="Партнёры по статусам"
        subtitle={`Всего ${partners.length} учебных центров`}
        Icon={Building2}
        size="lg"
      >
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatusTile color="#A3E635" label="Активные" count={activeCount} total={partners.length} Icon={Zap} />
          <StatusTile color="#FCD34D" label="Триал" count={trialCount} total={partners.length} Icon={Sparkles} />
          <StatusTile color="#F87171" label="Заморожены" count={frozenCount} total={partners.length} Icon={Snowflake} />
        </div>

        <div className="text-xs font-semibold text-base-content/50 uppercase mb-2">Партнёры</div>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {sorted.slice(0, 20).map((p) => {
            const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
            return (
              <Link
                to={`/organizations/${p.id}`}
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-base-200/50 transition-colors"
                onClick={() => setModal(null)}
              >
                <Avatar name={p.name} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-base-content/50">{p.branches} филиалов · {p.students} учеников</div>
                </div>
                <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>
              </Link>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={modal === 'students'}
        onClose={() => setModal(null)}
        title="Ученики платформы"
        subtitle={`Всего ${fmt(t.students)} учеников на платформе`}
        Icon={GraduationCap}
        size="lg"
      >
        <div className="rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 p-5 text-white mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70">Всего учеников</div>
          <div className="text-4xl font-black mt-1">{fmt(t.students)}</div>
          <div className="text-xs mt-2 opacity-70">В среднем {partners.length ? Math.round(t.students / partners.length) : 0} на партнёра</div>
        </div>

        <div className="text-xs font-semibold text-base-content/50 uppercase mb-2">Топ-5 по ученикам</div>
        <div className="space-y-2">
          {topByStudents.map((p, i) => {
            const pct = Math.max(4, ((p.students || 0) / Math.max(1, topByStudents[0]?.students || 1)) * 100);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-base-content/40">{i + 1}</span>
                <Avatar name={p.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{p.name}</span>
                    <span className="font-bold tabular-nums">{fmt(p.students)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={modal === 'branches'}
        onClose={() => setModal(null)}
        title="Филиалы по партнёрам"
        subtitle={`Всего ${fmt(t.branches)} филиалов`}
        Icon={Store}
        size="lg"
      >
        <div className="rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 p-5 text-white mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Всего филиалов</div>
          <div className="text-4xl font-black mt-1">{fmt(t.branches)}</div>
          <div className="text-xs mt-2 opacity-80">
            В среднем {partners.length ? (t.branches / partners.length).toFixed(1) : 0} на партнёра
          </div>
        </div>

        <div className="text-xs font-semibold text-base-content/50 uppercase mb-2">Топ-5 по филиалам</div>
        <div className="space-y-2">
          {topByBranches.map((p, i) => {
            const pct = Math.max(4, ((p.branches || 0) / Math.max(1, topByBranches[0]?.branches || 1)) * 100);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-base-content/40">{i + 1}</span>
                <Avatar name={p.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{p.name}</span>
                    <span className="font-bold tabular-nums">{fmt(p.branches)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Partner detail modal */}
      {modal && modal.type === 'partner' && (
        <PartnerModal
          p={modal.p}
          totalIncome={totalIncome}
          cur={cur}
          onClose={() => setModal(null)}
          onToggle={() => togglePartnerStatus(modal.p)}
          busy={busyId === modal.p?.id}
        />
      )}

      {/* Bar click modal */}
      {barModal && barPartner && (
        <PartnerModal
          p={barPartner}
          totalIncome={totalIncome}
          cur={cur}
          onClose={() => setBarModal(null)}
          onToggle={() => togglePartnerStatus(barPartner)}
          busy={busyId === barPartner.id}
        />
      )}
    </>
  );
}

function StatusTile({ color, label, count, total, Icon }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-base-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-md grid place-items-center" style={{ background: `${color}33`, color: '#365314' }}>
          <Icon size={15} />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">{label}</span>
      </div>
      <div className="text-2xl font-extrabold">{count}</div>
      <div className="text-[11px] text-base-content/50 mt-0.5">{pct}% от всех</div>
    </div>
  );
}

function PillMetric({ Icon, title, value, sub, tone }) {
  const tones = {
    lime: 'bg-primary/10 text-primary',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-4 flex flex-row items-center gap-3">
        <span className={`w-11 h-11 rounded-md grid place-items-center shrink-0 ${tones[tone] || tones.lime}`}>
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase font-semibold tracking-wider text-base-content/45">{title}</div>
          <div className="text-xl font-extrabold leading-tight mt-0.5">{value}</div>
          {sub && <div className="text-[11px] text-base-content/50 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function PartnerModal({ p, totalIncome, cur, onClose, onToggle, busy }) {
  const share = totalIncome > 0 ? ((p.monthlyBill / totalIncome) * 100).toFixed(1) : '0.0';
  const s = ORG_STATUS[p.status] || { label: p.status, cls: 'badge-ghost' };
  const frozen = p.status === 'frozen';
  return (
    <Modal open={true} onClose={onClose} title={p.name} subtitle={p.domain || 'домен не задан'} Icon={Building2} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg truncate">{p.name}</span>
              <span className={`badge ${s.cls}`}>{s.label}</span>
            </div>
            <div className="text-xs text-base-content/50">Регистрация: {dateShort(p.createdAt)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat Icon={Store} label="Филиалы" value={fmt(p.branches)} />
          <MiniStat Icon={GraduationCap} label="Ученики" value={fmt(p.students)} />
          <MiniStat Icon={Wallet} label={`Счёт/мес (${cur})`} value={fmt(p.monthlyBill)} accent />
          <MiniStat Icon={Percent} label="Доля дохода" value={`${share}%`} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            to={`/organizations/${p.id}`}
            className="btn btn-primary text-primary-content gap-2 flex-1"
            onClick={onClose}
          >
            Открыть профиль <ArrowRight size={15} />
          </Link>
          <button
            className={`btn gap-2 ${frozen ? 'btn-success' : 'btn-outline btn-error'}`}
            onClick={onToggle}
            disabled={busy}
          >
            {busy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : frozen ? (
              <><Power size={15} /> Активировать</>
            ) : (
              <><Pause size={15} /> Заморозить</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MiniStat({ Icon, label, value, accent }) {
  return (
    <div className={`rounded-md p-3 border ${accent ? 'bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-content' : 'border-base-200 bg-base-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={accent ? 'text-primary-content/70' : 'text-base-content/40'} />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? 'text-primary-content/70' : 'text-base-content/50'}`}>{label}</span>
      </div>
      <div className="text-lg font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
