import { useState } from 'react';
import { Receipt, Tag, TrendingUp, Layers } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { useState } from 'react';
import { TrendingUp, Tag, Layers, Receipt } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { useBranchManagerExpenses } from '../../queries.js';

export default function BranchManagerExpenses() {
  const [monthKey, setMonthKey] = useState('2026-08');
  const [cat, setCat] = useState('');
  const { data, isLoading, error } = useBranchManagerExpenses(monthKey);

  if (isLoading) return <div className="p-8 text-center text-base-content/45">Yuklanmoqda...</div>;
  if (error) return <div className="p-8 text-center text-error">Xatolik yuz berdi</div>;

  const rows = (data?.expenses || []).filter(
    (e) => !cat || e.category === cat,
  );
  const total = data?.totalAmount || 0;
  const categories = new Set((data?.expenses || []).map((e) => e.category));
  const top = rows.length ? [...rows].sort((a, b) => b.amount - a.amount)[0] : null;

  const MONTHS = [
    { key: '2026-03', label: 'Mart' },
    { key: '2026-04', label: 'Aprel' },
    { key: '2026-05', label: 'May' },
    { key: '2026-06', label: 'Iyun' },
    { key: '2026-07', label: 'Iyul' },
    { key: '2026-08', label: 'Avgust' },
  ];
  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[MONTHS.length - 1];
  const EXPENSE_CATEGORIES = [...categories].sort();

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Xarajatlar"
        subtitle={`Filial · xarajatlari`}
      />

      {/* ── Oy tanlash ── */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMonthKey(m.key)}
            className={`btn btn-sm rounded-lg transition-all ${
              m.key === monthKey
                ? 'btn-primary'
                : 'btn-ghost border border-base-200 text-base-content/60 hover:border-primary/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi Icon={TrendingUp} title="Oy xarajati" value={money(total)} unit={`${month.label} oyi`} tone="warning" />
        <Kpi Icon={Layers} title="Kategoriyalar" value={categories.size} unit="ishlatilgan" tone="neutral" />
        <Kpi Icon={Receipt} title="Yozuvlar" value={rows.length} unit="ta xarajat" tone="neutral" />
        <Kpi
          Icon={Tag}
          title="Eng katta"
          value={top ? money(top.amount) : '—'}
          unit={top ? top.category : ''}
          tone="danger"
        />
      </div>

      {/* ── Kategoriya filtri ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mr-1">
          Kategoriya:
        </span>
        <button
          onClick={() => setCat('')}
          className={`badge badge-lg gap-1 border transition-colors cursor-pointer ${
            cat === '' ? 'badge-primary' : 'badge-ghost border-base-200 text-base-content/60 hover:border-primary/40'
          }`}
        >
          Hammasi
        </button>
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(cat === c ? '' : c)}
            className={`badge badge-lg gap-1 border transition-colors cursor-pointer ${
              cat === c ? 'badge-primary' : 'badge-ghost border-base-200 text-base-content/60 hover:border-primary/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Xarajatlar jadvali ── */}
      <Panel title={`Xarajatlar — ${month.label}`} icon={Receipt} bodyClass="p-0">
        {rows.length === 0 ? (
          <p className="text-[13px] text-base-content/45 text-center py-10">
            Bu oyda xarajatlar yo'q
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                  <th className="pl-5">Sana</th>
                  <th>Kategoriya</th>
                  <th>Izoh</th>
                  <th className="pr-5 text-right">Summa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="pl-5 text-[13px] text-base-content/60 tabular-nums whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost border border-base-200 text-base-content/70">
                        {e.category}
                      </span>
                    </td>
                    <td className="text-[13px] text-base-content/70 max-w-[260px] truncate">{e.note}</td>
                    <td className="pr-5 text-right text-[14px] font-extrabold tabular-nums text-base-content">
                      {money(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-base-200">
                  <td colSpan={3} className="pl-5 text-[12px] font-semibold text-base-content/60">Jami</td>
                  <td className="pr-5 text-right text-[15px] font-extrabold tabular-nums text-error">{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
