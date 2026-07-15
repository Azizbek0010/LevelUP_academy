import { useEffect, useState } from 'react';
import { Wallet, Building2, Users, Landmark, GitBranch, GraduationCap, Download } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, usePricing, useInvalidate } from '../queries.js';
import { fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../components/Skeleton.jsx';

const FIELDS = [
  { key: 'baseFirstBranch', label: 'Первый филиал', hint: 'базовая цена за 1 филиал', Icon: Landmark },
  { key: 'perExtraBranch', label: 'Доп. филиал', hint: 'за каждый дополнительный филиал', Icon: GitBranch },
  { key: 'perStudent', label: 'За ученика', hint: 'за каждого ученика в месяц', Icon: GraduationCap },
];

function Kpi({ Icon, tint, title, value, unit, accent }) {
  return (
    <div className={`card shadow-sm border ${accent ? 'bg-gradient-to-br from-lime-400 to-lime-500 border-lime-400' : 'bg-base-100 border-base-200/60'}`}>
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            style={accent ? { background: 'rgba(0,0,0,0.12)', color: '#1a2e05' } : { background: tint.bg, color: tint.fg }}
          >
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className={`text-[11px] font-semibold uppercase tracking-wider leading-tight ${accent ? 'text-lime-950/60' : 'text-base-content/45'}`}>
            {title}
          </div>
        </div>
        <div className={`text-3xl font-extrabold mt-3 leading-none ${accent ? 'text-lime-950' : ''}`}>{value}</div>
        {unit && <div className={`text-xs mt-1.5 ${accent ? 'text-lime-950/55' : 'text-base-content/45'}`}>{unit}</div>}
      </div>
    </div>
  );
}

function exportCsv(partners, pricing, cur) {
  const header = ['Партнёр', 'Филиалы', 'Ученики', 'Базовый', 'Доп. филиалы', 'Ученики (сумма)', 'Итого/мес', 'Валюта'];
  const rows = partners.map((p) => {
    const base = Number(pricing?.baseFirstBranch || 0);
    const extra = Math.max(0, (p.branches || 1) - 1) * Number(pricing?.perExtraBranch || 0);
    const studCost = (p.students || 0) * Number(pricing?.perStudent || 0);
    return [p.name, p.branches, p.students, base, extra, studCost, p.monthlyBill || (base + extra + studCost), cur];
  });
  const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Billing() {
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const { data: pricing, isLoading: pLoading } = usePricing();
  const { data: dash } = useDashboard();
  const partners = dash?.partners || [];
  const cur = pricing?.currency || dash?.totals?.currency || 'UZS';

  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [previewStudents, setPreviewStudents] = useState(20);
  const [previewBranches, setPreviewBranches] = useState(2);

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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.status === 422 ? 'Цены — целые числа ≥ 0' : err.message);
    } finally { setBusy(false); }
  };

  const previewCalc = () => {
    const base = Number(form.baseFirstBranch || 0);
    const extra = Math.max(0, previewBranches - 1) * Number(form.perExtraBranch || 0);
    const stud = previewStudents * Number(form.perStudent || 0);
    return { base, extra, stud, total: base + extra + stud };
  };

  const totalIncome = partners.reduce((s, p) => s + (p.monthlyBill || 0), 0);
  const preview = previewCalc();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Тарифы и биллинг"
        subtitle={`Ценообразование платформы — счёт рассчитывается по факту (в ${cur})`}
      >
        {partners.length > 0 && (
          <button
            className="btn btn-outline btn-sm gap-2"
            onClick={() => exportCsv(partners, pricing, cur)}
          >
            <Download size={15} /> Экспорт CSV
          </button>
        )}
      </PageHeader>

      {error && <div className="alert alert-error text-sm"><span>{error}</span></div>}

      {pLoading ? (
        <>
          <SkeletonKpis count={3} />
          <SkeletonTable rows={4} cols={4} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Kpi
              Icon={Wallet}
              tint={{ bg: '#ECFCCB', fg: '#365314' }}
              title="Общий счёт / мес"
              value={fmt(totalIncome)}
              unit={cur}
              accent
            />
            <Kpi Icon={Building2} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Партнёров на биллинге" value={fmt(partners.length)} unit="учебных центров" />
            <Kpi
              Icon={Users}
              tint={{ bg: '#EDE9FE', fg: '#5B21B6' }}
              title="Средний счёт"
              value={fmt(partners.length ? Math.round(totalIncome / partners.length) : 0)}
              unit={cur}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <form onSubmit={save} className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body">
                <h2 className="card-title text-base mb-1">Тарифы платформы</h2>
                <p className="text-sm text-base-content/50 mb-4">Изменение тарифов повлияет на счёт всех партнёров немедленно</p>
                <div className="space-y-4">
                  {FIELDS.map((f) => (
                    <label key={f.key} className="form-control">
                      <span className="label-text mb-1 flex items-center gap-1.5">
                        <f.Icon size={14} className="text-base-content/40" />
                        {f.label}
                      </span>
                      <div className="join">
                        <input
                          type="number"
                          min="0"
                          className="input input-bordered join-item w-full"
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                        />
                        <span className="btn btn-disabled join-item no-animation text-xs">{cur}</span>
                      </div>
                      <span className="text-xs opacity-50 mt-1">{f.hint}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950" disabled={busy}>
                    {busy ? <span className="loading loading-spinner loading-sm" /> : 'Сохранить тарифы'}
                  </button>
                  {saved && (
                    <span className="text-success text-sm font-medium flex items-center gap-1">
                      ✓ Сохранено
                    </span>
                  )}
                </div>
              </div>
            </form>

            <div className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body">
                <h2 className="card-title text-base mb-1">Калькулятор счёта</h2>
                <p className="text-sm text-base-content/50 mb-4">Предпросмотр расчёта по текущим тарифам</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="form-control">
                    <span className="label-text mb-1">Студентов</span>
                    <input
                      type="number"
                      min="0"
                      className="input input-bordered input-sm"
                      value={previewStudents}
                      onChange={(e) => setPreviewStudents(Number(e.target.value))}
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-1">Филиалов</span>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered input-sm"
                      value={previewBranches}
                      onChange={(e) => setPreviewBranches(Math.max(1, Number(e.target.value)))}
                    />
                  </label>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60 flex items-center gap-1.5"><Landmark size={12} className="text-lime-600" /> 1-й филиал (база)</span>
                    <span className="font-semibold tabular-nums">{fmt(preview.base)} {cur}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60 flex items-center gap-1.5">
                      <GitBranch size={12} className="text-lime-600" />
                      {Math.max(0, previewBranches - 1) > 0
                        ? `${Math.max(0, previewBranches - 1)} доп. филиала`
                        : 'Доп. филиалы (нет)'}
                    </span>
                    <span className="font-semibold tabular-nums">{fmt(preview.extra)} {cur}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/60 flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-lime-600" />
                      {previewStudents} учеников × {fmt(form.perStudent || 0)}
                    </span>
                    <span className="font-semibold tabular-nums">{fmt(preview.stud)} {cur}</span>
                  </div>
                  <div className="border-t border-base-300 pt-2.5 flex justify-between">
                    <span className="font-bold">Итого / месяц</span>
                    <span className="text-xl font-extrabold text-lime-600 tabular-nums">{fmt(preview.total)} {cur}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {partners.length > 0 && (
            <div className="card bg-base-100 shadow-sm border border-base-200/60">
              <div className="card-body">
                <h2 className="card-title text-base mb-1">Счета партнёров ({cur}/мес)</h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Партнёр</th>
                        <th className="text-right">Филиалы</th>
                        <th className="text-right">Ученики</th>
                        <th className="text-right">К оплате / мес</th>
                        <th className="text-right">Доля</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...partners]
                        .sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0))
                        .map((p) => {
                          const share = totalIncome > 0 ? ((p.monthlyBill / totalIncome) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={p.id} className="hover">
                              <td className="font-medium">{p.name}</td>
                              <td className="text-right tabular-nums">{fmt(p.branches)}</td>
                              <td className="text-right tabular-nums">{fmt(p.students)}</td>
                              <td className="text-right font-semibold tabular-nums text-lime-700">{fmt(p.monthlyBill)}</td>
                              <td className="text-right text-xs text-base-content/50 tabular-nums">{share}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t-2 border-base-300">
                        <td colSpan={3} className="text-right text-sm opacity-60">Итого:</td>
                        <td className="text-right text-lime-600 tabular-nums">{fmt(totalIncome)}</td>
                        <td className="text-right text-xs text-base-content/40">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
