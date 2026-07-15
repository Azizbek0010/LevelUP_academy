import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, GraduationCap, Wallet, Calendar,
  Globe, GitBranch, Landmark, UserPlus, RefreshCw,
  TrendingUp, Shield, Clock, ChevronRight, Hash,
  LayoutDashboard, CreditCard, Info,
} from 'lucide-react';
import { useDashboard, usePricing, useInvalidate } from '../queries.js';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { fmt, dateShort, ORG_STATUS } from '../format.js';
import Avatar from '../components/Avatar.jsx';
import OnboardModal from '../components/OnboardModal.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';

function Kpi({ Icon, label, value, sub, tint, accent }) {
  return (
    <div className={`card shadow-sm border ${accent ? 'bg-gradient-to-br from-lime-400 to-lime-500 border-lime-400' : 'bg-base-100 border-base-200/60'}`}>
      <div className="card-body p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
            style={accent ? { background: 'rgba(0,0,0,0.12)', color: '#1a2e05' } : { background: tint.bg, color: tint.fg }}
          >
            <Icon size={15} strokeWidth={2.3} />
          </span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${accent ? 'text-lime-950/60' : 'text-base-content/45'}`}>{label}</span>
        </div>
        <div className={`text-3xl font-extrabold leading-none ${accent ? 'text-lime-950' : ''}`}>{value}</div>
        {sub && <div className={`text-xs mt-1 ${accent ? 'text-lime-950/55' : 'text-base-content/45'}`}>{sub}</div>}
      </div>
    </div>
  );
}

function BillingBreakdown({ partner, pricing, cur }) {
  if (!pricing) return <div className="flex justify-center py-8"><span className="loading loading-spinner opacity-40" /></div>;
  const base = Number(pricing.baseFirstBranch) || 0;
  const extra = Math.max(0, (partner.branches || 1) - 1);
  const extraCost = extra * (Number(pricing.perExtraBranch) || 0);
  const studCost = (partner.students || 0) * (Number(pricing.perStudent) || 0);
  const calc = base + extraCost + studCost;
  const actual = partner.monthlyBill || 0;
  const diff = Math.abs(calc - actual) > 1;

  return (
    <div className="space-y-4">
      <div className="bg-base-200/40 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-base-content/60">
            <div className="w-7 h-7 rounded-lg bg-blue-50 grid place-items-center shrink-0">
              <Landmark size={12} className="text-blue-600" />
            </div>
            Базовый (1-й филиал)
          </span>
          <span className="font-semibold tabular-nums">{fmt(base)} {cur}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-base-content/60">
            <div className="w-7 h-7 rounded-lg bg-purple-50 grid place-items-center shrink-0">
              <GitBranch size={12} className="text-purple-600" />
            </div>
            {extra > 0
              ? `Доп. филиалы: ${extra} × ${fmt(pricing.perExtraBranch)}`
              : 'Доп. филиалы (нет)'}
          </span>
          <span className="font-semibold tabular-nums">{fmt(extraCost)} {cur}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-base-content/60">
            <div className="w-7 h-7 rounded-lg bg-green-50 grid place-items-center shrink-0">
              <GraduationCap size={12} className="text-green-600" />
            </div>
            Ученики: {fmt(partner.students)} × {fmt(pricing.perStudent)}
          </span>
          <span className="font-semibold tabular-nums">{fmt(studCost)} {cur}</span>
        </div>
        <div className="border-t border-base-300 pt-3 flex items-center justify-between">
          <span className="font-bold">По тарифу / мес</span>
          <span className="text-xl font-extrabold text-lime-600 tabular-nums">{fmt(calc)} {cur}</span>
        </div>
      </div>
      {diff && (
        <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-base-content/60">
          <Info size={13} className="text-warning shrink-0 mt-0.5" />
          Фактический счёт: <span className="font-semibold">{fmt(actual)} {cur}</span> — расхождение с расчётом тарифа
        </div>
      )}
    </div>
  );
}

const TABS = [
  { key: 'overview', label: 'Обзор', Icon: LayoutDashboard },
  { key: 'finance', label: 'Финансы', Icon: CreditCard },
  { key: 'details', label: 'Детали', Icon: Info },
];

export default function OrgDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const invalidate = useInvalidate();

  const { data, isLoading, error, refetch } = useDashboard();
  const { data: pricing } = usePricing();

  const [tab, setTab] = useState('overview');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [onboard, setOnboard] = useState(false);

  const partner = data?.partners?.find((p) => String(p.id) === String(id));
  const cur = data?.totals?.currency || 'UZS';

  const toggle = async () => {
    if (!partner) return;
    const next = partner.status === 'frozen' ? 'active' : 'frozen';
    setBusy(true);
    setErr('');
    try {
      await api.setPartnerStatus(token, partner.id, next);
      invalidate('dashboard');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const s = partner ? (ORG_STATUS[partner.status] || { label: partner.status, cls: 'badge-ghost' }) : null;
  const daysSince = partner
    ? Math.floor((Date.now() - new Date(partner.createdAt).getTime()) / 86_400_000)
    : 0;

  const totalIncome = data?.partners?.reduce((sum, p) => sum + (p.monthlyBill || 0), 0) || 0;
  const share = totalIncome > 0 && partner ? ((partner.monthlyBill / totalIncome) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button className="btn btn-ghost btn-sm gap-1.5 -ml-2 text-base-content/60 hover:text-base-content" onClick={() => navigate('/organizations')}>
          <ArrowLeft size={15} /> Все партнёры
        </button>
        <ChevronRight size={14} className="text-base-content/30" />
        <span className="font-medium">{partner?.name || '...'}</span>
      </div>

      {(err || (error && error.status !== 401)) && (
        <div className="alert alert-error text-sm">
          <span>{err || error?.message}</span>
          <button className="btn btn-xs btn-ghost ml-auto gap-1" onClick={() => { setErr(''); refetch(); }}>
            <RefreshCw size={13} /> Повторить
          </button>
        </div>
      )}

      {isLoading ? (
        <>
          <div className="card bg-base-100 border border-base-200/60 shadow-sm">
            <div className="card-body h-32 animate-pulse bg-base-200/30 rounded-2xl" />
          </div>
          <SkeletonKpis count={4} />
        </>
      ) : !partner ? (
        <div className="alert alert-warning">
          <span>Партнёр не найден.</span>
          <button className="btn btn-xs btn-ghost ml-auto" onClick={() => refetch()}>Обновить</button>
        </div>
      ) : (
        <>
          {/* Hero header */}
          <div className="card bg-base-100 border border-base-200/60 shadow-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-lime-400 via-lime-500 to-lime-600" />
            <div className="card-body flex-row flex-wrap items-start gap-5 pt-5">
              <div className="relative shrink-0">
                <Avatar name={partner.name} size={68} />
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-base-100 ${
                  partner.status === 'active' ? 'bg-success' :
                  partner.status === 'trial' ? 'bg-warning' : 'bg-error'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl font-extrabold leading-tight">{partner.name}</h1>
                  <span className={`badge ${s.cls} badge-sm`}>{s.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-base-content/55">
                  {partner.domain && (
                    <span className="flex items-center gap-1.5">
                      <Globe size={13} />
                      <span className="font-mono">{partner.domain}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    С {dateShort(partner.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} />
                    <span className="font-mono text-xs">{partner.id}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-base-200/60 rounded-lg">
                    <Building2 size={13} className="text-blue-500" />
                    <span className="text-base-content/60">Филиалов:</span>
                    <span className="font-bold">{fmt(partner.branches)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-base-200/60 rounded-lg">
                    <GraduationCap size={13} className="text-purple-500" />
                    <span className="text-base-content/60">Учеников:</span>
                    <span className="font-bold">{fmt(partner.students)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-50 border border-lime-200 rounded-lg">
                    <Wallet size={13} className="text-lime-600" />
                    <span className="text-lime-700 font-bold">{fmt(partner.monthlyBill)} {cur}/мес</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-start">
                <button
                  className="btn btn-sm btn-outline gap-1.5"
                  onClick={() => setOnboard(true)}
                >
                  <UserPlus size={14} /> Онбординг
                </button>
                <button
                  className={`btn btn-sm ${partner.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                  onClick={toggle}
                  disabled={busy}
                >
                  {busy
                    ? <span className="loading loading-spinner loading-xs" />
                    : partner.status === 'frozen' ? 'Активировать' : 'Заморозить'}
                </button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              Icon={Wallet}
              label="Счёт / мес"
              value={fmt(partner.monthlyBill)}
              sub={cur}
              tint={{ bg: '#E6F4D7', fg: '#3F6212' }}
              accent
            />
            <Kpi Icon={Building2} label="Филиалы" value={fmt(partner.branches)} sub="активных" tint={{ bg: '#E0F2FE', fg: '#075985' }} />
            <Kpi Icon={GraduationCap} label="Ученики" value={fmt(partner.students)} sub="в системе" tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} />
            <Kpi Icon={Clock} label="Дней на платформе" value={String(daysSince)} sub={`с ${dateShort(partner.createdAt)}`} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} />
          </div>

          {/* Tabs */}
          <div className="card bg-base-100 border border-base-200/60 shadow-sm">
            {/* Tab nav */}
            <div className="border-b border-base-200 px-5">
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                      tab === t.key
                        ? 'border-lime-500 text-lime-700'
                        : 'border-transparent text-base-content/50 hover:text-base-content'
                    }`}
                  >
                    <t.Icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body">
              {/* Overview Tab */}
              {tab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Revenue share */}
                    <div className="p-4 border border-base-200 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={15} className="text-lime-600" />
                          <span className="font-semibold text-sm">Доля в доходе платформы</span>
                        </div>
                        <span className="text-lg font-extrabold text-lime-600">{share}%</span>
                      </div>
                      <div className="h-2 bg-base-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, parseFloat(share))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-base-content/40 mt-1.5">
                        <span>{fmt(partner.monthlyBill)} {cur}</span>
                        <span>из {fmt(totalIncome)} {cur} общих</span>
                      </div>
                    </div>

                    {/* Status card */}
                    <div className="p-4 border border-base-200 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={15} className="text-base-content/50" />
                        <span className="font-semibold text-sm">Статус аккаунта</span>
                      </div>
                      <div className={`badge ${s.cls} badge-lg gap-1.5 mb-3`}>{s.label}</div>
                      <div className="text-xs text-base-content/50 space-y-1">
                        <div>Зарегистрирован: <span className="font-semibold">{dateShort(partner.createdAt)}</span></div>
                        <div>Дней на платформе: <span className="font-semibold">{daysSince}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Ученик / филиал', value: partner.branches ? (partner.students / partner.branches).toFixed(1) : '—', note: 'среднее', color: 'text-blue-600' },
                      { label: 'Счёт / ученик', value: partner.students ? fmt(Math.round(partner.monthlyBill / partner.students)) : '—', note: cur + '/мес', color: 'text-lime-600' },
                      { label: 'Счёт / филиал', value: partner.branches ? fmt(Math.round(partner.monthlyBill / partner.branches)) : '—', note: cur + '/мес', color: 'text-purple-600' },
                    ].map((item) => (
                      <div key={item.label} className="bg-base-200/40 rounded-xl p-3 text-center">
                        <div className={`text-xl font-extrabold ${item.color}`}>{item.value}</div>
                        <div className="text-xs font-semibold text-base-content/60 mt-0.5">{item.label}</div>
                        <div className="text-[10px] text-base-content/35">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Finance Tab */}
              {tab === 'finance' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <CreditCard size={15} className="text-lime-600" />
                      Расчёт счёта по тарифам
                    </h3>
                    <BillingBreakdown partner={partner} pricing={pricing} cur={cur} />
                  </div>

                  <div className="border-t border-base-200 pt-4">
                    <h3 className="font-bold text-sm mb-3">Фактические данные</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-lime-50 border border-lime-100 rounded-xl p-4">
                        <div className="text-xs text-lime-700/70 mb-1 font-semibold uppercase tracking-wide">К оплате / мес</div>
                        <div className="text-2xl font-extrabold text-lime-700">{fmt(partner.monthlyBill)}</div>
                        <div className="text-xs text-lime-700/60 mt-0.5">{cur}</div>
                      </div>
                      <div className="bg-base-200/40 border border-base-200 rounded-xl p-4">
                        <div className="text-xs text-base-content/50 mb-1 font-semibold uppercase tracking-wide">Доля платформы</div>
                        <div className="text-2xl font-extrabold">{share}%</div>
                        <div className="text-xs text-base-content/40 mt-0.5">от общего дохода</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {tab === 'details' && (
                <div className="space-y-1">
                  {[
                    ['Название организации', partner.name],
                    ['Домен', partner.domain || '—'],
                    ['Статус', <span key="s" className={`badge badge-sm ${s.cls}`}>{s.label}</span>],
                    ['Дата регистрации', dateShort(partner.createdAt)],
                    ['Дней на платформе', String(daysSince)],
                    ['Количество филиалов', fmt(partner.branches)],
                    ['Количество учеников', fmt(partner.students)],
                    ['Ежемесячный счёт', <span key="b" className="font-bold text-lime-700">{fmt(partner.monthlyBill)} {cur}</span>],
                    ['Доля в доходе', `${share}%`],
                    ['ID', <span key="id" className="font-mono text-xs text-base-content/50">{partner.id}</span>],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center border-b border-base-200 py-3 text-sm last:border-0">
                      <dt className="text-base-content/55">{label}</dt>
                      <dd className="font-semibold text-right">{val}</dd>
                    </div>
                  ))}
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
