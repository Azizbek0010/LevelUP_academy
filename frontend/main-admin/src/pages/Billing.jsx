import { useEffect, useState } from 'react';
import { Wallet, Building2, Users, Landmark, GitBranch, GraduationCap } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, usePricing, useInvalidate } from '../queries.js';
import { fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../components/Skeleton.jsx';

const FIELDS = [
  { key: 'baseFirstBranch', label: 'Первый филиал', hint: 'база за 1 филиал', Icon: Landmark },
  { key: 'perExtraBranch', label: 'Доп. филиал', hint: 'за каждый филиал сверх первого', Icon: GitBranch },
  { key: 'perStudent', label: 'За ученика', hint: 'за каждого ученика в месяц', Icon: GraduationCap },
];

// та же карточка, что в Dashboard.jsx — держим 1-в-1, чтобы вид совпадал
function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">
            {title}
          </div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      </div>
    </div>
  );
}

export default function Billing() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: pricing, isLoading: pLoading } = usePricing();
  const { data: dash } = useDashboard();
  const partners = dash?.partners || [];
  const cur = pricing?.currency || dash?.totals.currency || 'UZS';

  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (pricing) setForm(pricing); }, [pricing]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setSaved(false);
    try {
      await api.updatePricing(token, {
        baseFirstBranch: Number(form.baseFirstBranch),
        perExtraBranch: Number(form.perExtraBranch),
        perStudent: Number(form.perStudent),
      });
      invalidate('pricing', 'dashboard');
      setSaved(true);
    } catch (err) {
      setError(err.status === 422 ? 'Цены — целые числа ≥ 0' : err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Тарифы платформы"
        subtitle={`Цена по факту: первый филиал + доп. филиалы + ученики (в ${cur}). Планов нет — счёт растёт автоматически.`}
      />

      {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

      {pLoading ? (
        <>
          <SkeletonKpis count={3} />
          <SkeletonTable rows={4} cols={4} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Kpi Icon={Wallet} tint={{ bg: '#E6F4D7', fg: '#3F6212' }} title="Общий счёт / мес" value={fmt(partners.reduce((sum, p) => sum + p.monthlyBill, 0))} unit={cur} />
            <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёров на биллинге" value={fmt(partners.length)} unit="учебных центров" />
            <Kpi Icon={Users} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Средний счёт" value={fmt(partners.length ? Math.round(partners.reduce((sum, p) => sum + p.monthlyBill, 0) / partners.length) : 0)} unit={cur} />
          </div>

          <form onSubmit={save} className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-base">Цены (редактирует Main Admin)</h2>
              <div className="grid sm:grid-cols-3 gap-4 mt-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="form-control">
                    <span className="label-text mb-1 flex items-center gap-1.5">
                      <f.Icon size={14} className="text-base-content/40" />
                      {f.label}
                    </span>
                    <div className="join">
                      <input type="number" min="0" className="input input-bordered join-item w-full"
                        value={form[f.key] ?? ''}
                        onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                      <span className="btn btn-disabled join-item no-animation">{cur}</span>
                    </div>
                    <span className="text-xs opacity-50 mt-1">{f.hint}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? <span className="loading loading-spinner loading-sm" /> : 'Сохранить'}
                </button>
                {saved && <span className="text-success text-sm">Сохранено ✓</span>}
              </div>
            </div>
          </form>

          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-base">Счета партнёров ({cur}/мес)</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Партнёр</th><th className="text-right">Филиалы</th>
                      <th className="text-right">Ученики</th><th className="text-right">К оплате</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.name}</td>
                        <td className="text-right">{fmt(p.branches)}</td>
                        <td className="text-right">{fmt(p.students)}</td>
                        <td className="text-right font-semibold">{fmt(p.monthlyBill)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
