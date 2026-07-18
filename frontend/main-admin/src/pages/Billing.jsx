import { useEffect, useState } from 'react';
import {
  Wallet, Building2, Users, Landmark, GitBranch, GraduationCap, Download, Check, Sparkles,
} from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useDashboard, usePricing, useInvalidate } from '../queries.js';
import { fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis, SkeletonTable } from '../components/Skeleton.jsx';

const FIELDS = [
  {
    key: 'baseFirstBranch',
    label: 'Первый филиал',
    hint: 'базовая цена за 1-й филиал партнёра',
    Icon: Landmark,
    tint: { bg: '#ECFCCB', fg: '#365314' },
    previewLabel: (v, cur) => `1 филиал = ${fmt(v)} ${cur}`,
  },
  {
    key: 'perExtraBranch',
    label: 'Доп. филиал',
    hint: 'за каждый дополнительный филиал',
    Icon: GitBranch,
    tint: { bg: '#E0F2FE', fg: '#075985' },
    previewLabel: (v, cur) => `+3 доп. филиала = ${fmt(v * 3)} ${cur}`,
  },
  {
    key: 'perStudent',
    label: 'За ученика',
    hint: 'за каждого ученика в месяц',
    Icon: GraduationCap,
    tint: { bg: '#EDE9FE', fg: '#5B21B6' },
    previewLabel: (v, cur) => `за 10 учеников = ${fmt(v * 10)} ${cur}`,
  },
];

// разрешаем только цифры при вводе текста
const sanitize = (v) => String(v ?? '').replace(/[^\d]/g, '');

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
        baseFirstBranch: Number(form.baseFirstBranch) || 0,
        perExtraBranch: Number(form.perExtraBranch) || 0,
        perStudent: Number(form.perStudent) || 0,
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

          {/* Pricing form — premium look */}
          <form onSubmit={save} className="card bg-base-100 shadow-sm border border-base-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-lime-100 via-lime-50 to-transparent px-6 py-5 border-b border-base-200 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-lime-400 text-lime-950 grid place-items-center shrink-0">
                <Sparkles size={20} strokeWidth={2.4} />
              </span>
              <div>
                <h2 className="font-extrabold text-lg leading-tight">Тарифы платформы</h2>
                <p className="text-xs text-base-content/60 mt-0.5">Изменение цен применяется сразу ко всем партнёрам</p>
              </div>
            </div>

            <div className="card-body">
              <div className="grid md:grid-cols-3 gap-4">
                {FIELDS.map((f) => {
                  const val = form[f.key];
                  const numeric = Number(val || 0);
                  return (
                    <div key={f.key} className="rounded-2xl border border-base-200 hover:border-lime-300 transition-colors p-4 bg-gradient-to-br from-base-100 to-base-100/60 flex flex-col">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: f.tint.bg, color: f.tint.fg }}>
                          <f.Icon size={18} strokeWidth={2.3} />
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{f.label}</div>
                          <div className="text-[10.5px] text-base-content/50 truncate">{f.hint}</div>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="input input-bordered w-full text-lg font-bold tracking-tight pr-14 focus:border-lime-400 focus:outline-lime-200"
                          placeholder="0"
                          value={val ?? ''}
                          onChange={(e) => setForm((s) => ({ ...s, [f.key]: sanitize(e.target.value) }))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content/40 pointer-events-none">
                          {cur}
                        </span>
                      </div>

                      <div className="mt-3 rounded-lg bg-lime-50 px-3 py-1.5 text-[11px] font-semibold text-lime-800 self-start">
                        {f.previewLabel(numeric, cur)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-base-200">
                <button
                  className={`btn border-0 text-lime-950 gap-2 px-6 transition-all ${
                    saved ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-lime-400 hover:bg-lime-500 hover:shadow-lg'
                  }`}
                  disabled={busy}
                >
                  {busy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : saved ? (
                    <><Check size={16} strokeWidth={3} /> Сохранено!</>
                  ) : (
                    'Сохранить тарифы'
                  )}
                </button>
                <span className="text-xs text-base-content/50">
                  Тарифы применятся к следующему счёту всех партнёров
                </span>
              </div>
            </div>
          </form>

          {/* Calculator */}
          <div className="card bg-base-100 shadow-sm border border-base-200/60">
            <div className="card-body">
              <h2 className="card-title text-base mb-1">Калькулятор счёта</h2>
              <p className="text-sm text-base-content/50 mb-4">Проверка тарифов на примере партнёра</p>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="grid grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text mb-1 text-xs font-semibold text-base-content/60 uppercase tracking-wider">Студентов</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input input-bordered"
                      value={previewStudents}
                      onChange={(e) => setPreviewStudents(Number(sanitize(e.target.value)) || 0)}
                    />
                  </label>
                  <label className="form-control">
                    <span className="label-text mb-1 text-xs font-semibold text-base-content/60 uppercase tracking-wider">Филиалов</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input input-bordered"
                      value={previewBranches}
                      onChange={(e) => setPreviewBranches(Math.max(1, Number(sanitize(e.target.value)) || 1))}
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
