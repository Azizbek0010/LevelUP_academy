import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useAdminInvoices } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const STATUS = {
  paid: { label: 'Оплачен', cls: 'badge-success' },
  partial: { label: 'Частично', cls: 'badge-warning' },
  unpaid: { label: 'Не оплачен', cls: 'badge-ghost' },
  overdue: { label: 'Просрочен', cls: 'badge-error' },
};
const studentName = (inv) => `${inv.student?.firstName || inv.student?.first_name || ''} ${inv.student?.lastName || inv.student?.last_name || ''}`.trim() || '—';

export default function AdminPayments() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminInvoices();
  const [pay, setPay] = useState(null); // invoice
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.invoices || (Array.isArray(raw) ? raw : []);

  const openPay = (inv) => { setPay(inv); setAmount(String((inv.amount || inv.total_amount || 0) - (inv.paid_amount || 0))); setMethod('cash'); setErr(''); };
  const submitPay = async () => {
    setBusy(true); setErr('');
    try {
      await api.adminPayInvoice(token, pay.id, { amount: Number(amount), method });
      setPay(null); refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Платежи" subtitle="Счета и оплаты (наличные + карта)" />

      {isLoading ? (
        <div className="mt-6"><SkeletonTable cols={6} /></div>
      ) : error ? (
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="card bg-base-100 mt-6">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Студент</th><th>Группа</th><th className="text-right">Сумма</th><th className="text-right">Оплачено</th><th>Срок</th><th>Статус</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={7} className="text-center text-base-content/40 py-8">Нет счетов</td></tr>}
                  {rows.map((inv) => {
                    const st = STATUS[inv.status] || STATUS.unpaid;
                    const paid = inv.status === 'paid';
                    return (
                      <tr key={inv.id}>
                        <td className="font-medium">{studentName(inv)}</td>
                        <td className="text-sm">{inv.group?.name || '—'}</td>
                        <td className="text-right tabular-nums">{money(inv.amount || inv.total_amount)}</td>
                        <td className="text-right tabular-nums">{money(inv.paid_amount)}</td>
                        <td className="text-sm text-base-content/60">{dateShort(inv.due_date)}</td>
                        <td><span className={`badge badge-sm ${st.cls}`}>{st.label}</span></td>
                        <td className="text-right">
                          <button className="btn btn-primary btn-xs gap-1" disabled={paid} onClick={() => openPay(inv)}><Wallet size={13} /> Оплатить</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {pay && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-1">Приём оплаты</h3>
            <p className="text-sm text-base-content/60 mb-4">{studentName(pay)} · {pay.group?.name || '—'}</p>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" type="number" placeholder="Сумма" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="join w-full">
                <button className={`btn join-item flex-1 ${method === 'cash' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMethod('cash')}>Наличные</button>
                <button className={`btn join-item flex-1 ${method === 'card' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMethod('card')}>Карта</button>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setPay(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={submitPay} disabled={busy || !amount || Number(amount) <= 0}>
                {busy && <span className="loading loading-spinner loading-xs" />} Принять
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPay(null)} />
        </dialog>
      )}
    </div>
  );
}
