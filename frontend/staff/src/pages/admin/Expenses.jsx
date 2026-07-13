import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useAdminExpenses } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const empty = { title: '', amount: '', category: '', note: '' };

export default function AdminExpenses() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminExpenses();
  const [form, setForm] = useState(null); // null | empty
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.expenses || raw.items || (Array.isArray(raw) ? raw : []);
  const total = rows.reduce((s, e) => s + Number(e.amount || 0), 0);

  const save = async () => {
    setBusy(true); setErr('');
    try {
      await api.adminCreateExpense(token, {
        title: form.title,
        amount: Number(form.amount),
        category: form.category || undefined,
        note: form.note || undefined,
      });
      setForm(null); refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm('Удалить расход?')) return;
    try { await api.adminDeleteExpense(token, id); refetch(); }
    catch (e) { alert(e.message || 'Ошибка удаления'); }
  };

  return (
    <div>
      <PageHeader title="Расходы" subtitle="Учёт расходов филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(empty); setErr(''); }}>
          <Plus size={16} /> Добавить
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="mt-6"><SkeletonTable cols={4} /></div>
      ) : error ? (
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="card bg-base-100 mt-6">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Название</th><th>Категория</th><th className="text-right">Сумма</th><th>Дата</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-base-content/40 py-8">Нет расходов</td></tr>
                  )}
                  {rows.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium">{e.title || e.note || '—'}</td>
                      <td>{e.category ? <span className="badge badge-ghost">{e.category}</span> : '—'}</td>
                      <td className="text-right tabular-nums font-semibold">{money(e.amount)}</td>
                      <td className="text-sm text-base-content/60">{dateShort(e.spent_at || e.created_at || e.date)}</td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => del(e.id)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr><th>Итого</th><th></th><th className="text-right tabular-nums">{money(total)}</th><th colSpan={2}></th></tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Новый расход</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input input-bordered w-full" type="number" placeholder="Сумма (UZS)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Категория (необязательно)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <textarea className="textarea textarea-bordered w-full" placeholder="Заметка (необязательно)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={save} disabled={busy || !form.title || !form.amount}>
                {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setForm(null)} />
        </dialog>
      )}
    </div>
  );
}
