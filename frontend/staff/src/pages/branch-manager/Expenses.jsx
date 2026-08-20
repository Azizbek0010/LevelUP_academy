import { useState } from 'react';
import { Receipt, Tag, TrendingUp, Layers, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi } from '../mentor/_ui.jsx';
import { useBranchManagerExpenses } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

export default function BranchManagerExpenses() {
  const { token } = useAuth();
  const [monthKey, setMonthKey] = useState('2026-08');
  const [cat, setCat] = useState('');
  const { data, isLoading, error, refetch } = useBranchManagerExpenses(monthKey);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const saveExpense = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        category: form.category.trim(),
        amount: Number(form.amount),
        spentAt: form.spentAt || undefined,
        note: form.note.trim() || undefined,
      };
      if (form.id) await api.adminUpdateExpense(token, form.id, payload);
      else await api.adminCreateExpense(token, payload);
      setForm(null);
      await refetch();
    } catch (e) {
      setFormError(e.message || 'Xarajatni saqlab bo\u2018lmadi');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (expense) => {
    if (!confirm(`«${expense.category}» xarajatini o‘chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.adminDeleteExpense(token, expense.id);
      await refetch();
    } catch (e) {
      alert(e.message || 'Xarajatni o‘chirib bo‘lmadi');
    }
  };

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
      >
        <button
          className="btn btn-primary btn-sm gap-1.5"
          onClick={() => setForm({ category: '', amount: '', spentAt: new Date().toISOString().slice(0, 10), note: '' })}
        >
          <Plus size={15} /> Xarajat qo‘shish
        </button>
      </PageHeader>

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
                  <th className="text-right">Summa</th>
                  <th className="pr-5 w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="pl-5 text-[13px] text-base-content/60 tabular-nums whitespace-nowrap">
                      {new Date(e.spentAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost border border-base-200 text-base-content/70">
                        {e.category}
                      </span>
                    </td>
                    <td className="text-[13px] text-base-content/70 max-w-[260px] truncate">{e.note}</td>
                    <td className="text-right text-[14px] font-extrabold tabular-nums text-base-content">
                      {money(e.amount)}
                    </td>
                    <td className="pr-5"><div className="flex justify-end gap-1">
                      <button className="btn btn-ghost btn-xs btn-square" aria-label="Tahrirlash"
                        onClick={() => setForm({ id: e.id, category: e.category, amount: String(e.amount), spentAt: String(e.spentAt).slice(0, 10), note: e.note || '' })}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-xs btn-square text-error" aria-label="O‘chirish" onClick={() => removeExpense(e)}>
                        <Trash2 size={14} />
                      </button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-base-200">
                  <td colSpan={3} className="pl-5 text-[12px] font-semibold text-base-content/60">Jami</td>
                  <td className="text-right text-[15px] font-extrabold tabular-nums text-error">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      {form && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box w-[min(92vw,460px)] max-w-none max-h-[88vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-lg">{form.id ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</h3>
                <p className="text-xs text-base-content/50 mt-1">Xarajat filial foydasidan avtomatik ayriladi</p>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setForm(null)}><X size={17} /></button>
            </div>
            <div className="grid gap-3">
              <label className="form-control">
                <span className="label-text text-xs font-semibold mb-1">Kategoriya</span>
                <input className="input input-bordered input-sm h-10" maxLength={60} value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ijara, reklama, jihoz..." />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="form-control">
                  <span className="label-text text-xs font-semibold mb-1">Summa (UZS)</span>
                  <input className="input input-bordered input-sm h-10" type="number" min="1" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </label>
                <label className="form-control">
                  <span className="label-text text-xs font-semibold mb-1">Sana</span>
                  <input className="input input-bordered input-sm h-10" type="date" value={form.spentAt}
                    onChange={(e) => setForm({ ...form, spentAt: e.target.value })} />
                </label>
              </div>
              <label className="form-control">
                <span className="label-text text-xs font-semibold mb-1">Izoh</span>
                <textarea className="textarea textarea-bordered min-h-20 max-h-32" rows={3} maxLength={1000} value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Xarajat tafsilotlari" />
              </label>
              {formError && <div className="alert alert-error text-sm">{formError}</div>}
            </div>
            <div className="modal-action mt-4 pt-4 border-t border-base-200">
              <button className="btn btn-ghost btn-sm" onClick={() => setForm(null)} disabled={saving}>Bekor qilish</button>
              <button className="btn btn-primary btn-sm" onClick={saveExpense}
                disabled={saving || !form.category.trim() || !(Number(form.amount) > 0)}>
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
          <button className="modal-backdrop" onClick={() => setForm(null)}>close</button>
        </div>
      )}
    </div>
  );
}
