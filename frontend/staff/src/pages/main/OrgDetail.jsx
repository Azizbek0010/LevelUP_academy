import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, GraduationCap, Wallet, Calendar, Globe, GitBranch, Landmark, UserPlus, RefreshCw } from 'lucide-react';
import { useMainDashboard, useMainPricing, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { fmt, dateShort, ORG_STATUS } from '../../format.js';
import Avatar from '../../components/Avatar.jsx';
import OnboardModal from './OnboardModal.jsx';

function Kpi({ Icon, label, value, sub, tint }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={15} strokeWidth={2.3} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">{label}</span>
        </div>
        <div className="text-3xl font-extrabold leading-none">{value}</div>
        {sub && <div className="text-xs text-base-content/45 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function BillingFormula({ partner, pricing, cur }) {
  if (!pricing) return null;
  const base = Number(pricing.baseFirstBranch) || 0;
  const extra = Math.max(0, (partner.branches || 1) - 1);
  const extraCost = extra * (Number(pricing.perExtraBranch) || 0);
  const studCost = (partner.students || 0) * (Number(pricing.perStudent) || 0);
  const calc = base + extraCost + studCost;

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-base mb-3">Расчёт счёта</h2>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-base-content/60"><Landmark size={13} className="text-primary" />Базовый (1-й филиал)</span>
            <span className="font-semibold tabular-nums">{fmt(base)} {cur}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-base-content/60">
              <GitBranch size={13} className="text-primary" />
              {extra > 0 ? `Доп. филиалы: ${extra} × ${fmt(pricing.perExtraBranch)}` : 'Доп. филиалы (нет)'}
            </span>
            <span className="font-semibold tabular-nums">{fmt(extraCost)} {cur}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-base-content/60">
              <GraduationCap size={13} className="text-primary" />Ученики: {fmt(partner.students)} × {fmt(pricing.perStudent)}
            </span>
            <span className="font-semibold tabular-nums">{fmt(studCost)} {cur}</span>
          </div>
          <div className="border-t border-base-200 pt-2.5 flex items-center justify-between">
            <span className="font-bold">Итого / месяц</span>
            <span className="text-xl font-extrabold text-primary tabular-nums">{fmt(calc)} {cur}</span>
          </div>
          {Math.abs(calc - (partner.monthlyBill || 0)) > 1 && (
            <p className="text-xs text-base-content/40">* По текущим тарифам: {fmt(calc)}. Фактический: {fmt(partner.monthlyBill)} {cur}.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MainOrgDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const invalidate = useInvalidate();

  const { data, isLoading, error, refetch } = useMainDashboard();
  const { data: pricing } = useMainPricing();

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [onboard, setOnboard] = useState(false);

  const partner = data?.partners?.find((p) => String(p.id) === String(id));
  const cur = data?.totals?.currency || 'UZS';

  const toggle = async () => {
    if (!partner) return;
    const next = partner.status === 'frozen' ? 'active' : 'frozen';
    setBusy(true); setErr('');
    try {
      await api.mainSetPartnerStatus(token, partner.id, next);
      invalidate('main-dashboard');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const s = partner ? (ORG_STATUS[partner.status] || { label: partner.status, cls: 'badge-ghost' }) : null;
  const daysSince = partner ? Math.floor((Date.now() - new Date(partner.createdAt).getTime()) / 86_400_000) : 0;

  return (
    <div className="space-y-5">
      <button className="btn btn-ghost btn-sm gap-2 -ml-2" onClick={() => navigate('/main/organizations')}>
        <ArrowLeft size={16} /> Все партнёры
      </button>

      {(err || (error && error.status !== 401)) && (
        <div className="alert alert-error text-sm">
          <span>{err || error?.message}</span>
          <button className="btn btn-xs btn-ghost ml-auto gap-1" onClick={() => { setErr(''); refetch(); }}>
            <RefreshCw size={13} /> Повторить
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg opacity-40" /></div>
      ) : !partner ? (
        <div className="alert alert-warning text-sm">
          <span>Партнёр не найден.</span>
          <button className="btn btn-xs btn-ghost ml-auto" onClick={() => refetch()}>Обновить</button>
        </div>
      ) : (
        <>
          <div className="card bg-base-100">
            <div className="card-body flex-row flex-wrap items-start gap-4">
              <Avatar name={partner.name} size={60} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold">{partner.name}</h1>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-base-content/55">
                  {partner.domain && <span className="flex items-center gap-1.5"><Globe size={13} />{partner.domain}</span>}
                  <span className="flex items-center gap-1.5"><Calendar size={13} />Зарегистрирован {dateShort(partner.createdAt)}</span>
                  <span className="text-base-content/30">ID: {partner.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="btn btn-sm btn-outline gap-1.5" onClick={() => setOnboard(true)}>
                  <UserPlus size={14} /> Онбординг
                </button>
                <button
                  className={`btn btn-sm ${partner.status === 'frozen' ? 'btn-success' : 'btn-outline btn-error'}`}
                  onClick={toggle} disabled={busy}
                >
                  {busy ? <span className="loading loading-spinner loading-xs" /> : partner.status === 'frozen' ? 'Активировать' : 'Заморозить'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi Icon={Building2} label="Филиалы" value={fmt(partner.branches)} sub="активных" tint={{ bg: '#E0F2FE', fg: '#075985' }} />
            <Kpi Icon={GraduationCap} label="Ученики" value={fmt(partner.students)} sub="в системе" tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} />
            <Kpi Icon={Wallet} label="Счёт / мес" value={fmt(partner.monthlyBill)} sub={cur} tint={{ bg: '#E6F4D7', fg: '#3F6212' }} />
            <Kpi Icon={Calendar} label="Дней на платформе" value={String(daysSince)} sub={`с ${dateShort(partner.createdAt)}`} tint={{ bg: '#FFEDD5', fg: '#9A3412' }} />
          </div>

          <BillingFormula partner={partner} pricing={pricing} cur={cur} />

          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-base mb-3">Детали партнёра</h2>
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-0 text-sm">
                {[
                  ['Название', partner.name],
                  ['Домен', partner.domain || '—'],
                  ['Статус', <span className={`badge badge-sm ${s.cls}`}>{s.label}</span>],
                  ['Дата регистрации', dateShort(partner.createdAt)],
                  ['Количество филиалов', fmt(partner.branches)],
                  ['Количество учеников', fmt(partner.students)],
                  ['Ежемесячный счёт', <span className="font-semibold text-primary">{fmt(partner.monthlyBill)} {cur}</span>],
                  ['Дней на платформе', String(daysSince)],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-base-200 py-2.5">
                    <dt className="text-base-content/55">{label}</dt>
                    <dd className="font-semibold text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </>
      )}

      {onboard && (
        <OnboardModal lead={null} onClose={() => setOnboard(false)} onDone={() => { setOnboard(false); invalidate('main-leads', 'main-dashboard'); }} />
      )}
    </div>
  );
}
