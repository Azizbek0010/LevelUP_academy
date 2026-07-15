import { useState, useMemo } from 'react';
import { Wallet, CreditCard, Banknote, Clock, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useAdminInvoices } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const STATUS = {
  paid: { label: 'Оплачен', bg: '#2ECC7115', text: '#2ECC71', icon: CheckCircle2 },
  partial: { label: 'Частично', bg: '#F59E0B15', text: '#F59E0B', icon: Clock },
  unpaid: { label: 'Не оплачен', bg: '#6B728015', text: '#6B7280', icon: AlertCircle },
  overdue: { label: 'Просрочен', bg: '#E8543E15', text: '#E8543E', icon: AlertTriangle },
};

const studentName = (inv) => `${inv.student?.firstName || inv.student?.first_name || ''} ${inv.student?.lastName || inv.student?.last_name || ''}`.trim() || '—';

/* ═══════════════ Stat Card ═══════════════ */
function StatCard({ Icon, label, value, color, gradient, delay }) {
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[16px] p-4 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity duration-500" style={{ background: gradient }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}15`, color }}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">{label}</div>
            <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Invoice Card ═══════════════ */
function InvoiceCard({ inv, onPay }) {
  const st = STATUS[inv.status] || STATUS.unpaid;
  const StIcon = st.icon;
  const total = Number(inv.amount || inv.total_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  const remaining = total - paid;
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div className="glass-strong rounded-[16px] p-5 card-hover-premium group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[14px] font-bold text-[var(--text)]">{studentName(inv)}</h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{inv.group?.name || '—'}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background: st.bg, color: st.text }}>
          <StIcon size={12} /> {st.label}
        </span>
      </div>

      {/* Amounts */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Сумма</div>
          <div className="text-[18px] font-extrabold text-[var(--text)] tabular-nums">{money(total)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Оплачено</div>
          <div className="text-[14px] font-bold tabular-nums" style={{ color: paidPercent >= 100 ? '#2ECC71' : 'var(--text)' }}>{money(paid)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-[var(--surface)] mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${paidPercent}%`,
            background: paidPercent >= 100 ? '#2ECC71' : paidPercent > 0 ? '#F59E0B' : 'var(--border)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <Clock size={10} /> Срок: {dateShort(inv.due_date)}
        </span>
        {inv.status !== 'paid' && (
          <button
            className="h-7 px-3 rounded-[8px] flex items-center gap-1 text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--green)' }}
            onClick={() => onPay(inv)}
          >
            <Wallet size={12} /> Оплатить {remaining > 0 ? money(remaining) : ''}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Main Payments ═══════════════ */
export default function AdminPayments() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminInvoices();
  const [pay, setPay] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.invoices || (Array.isArray(raw) ? raw : []);

  const stats = useMemo(() => {
    const total = rows.reduce((s, inv) => s + Number(inv.amount || inv.total_amount || 0), 0);
    const paid = rows.filter((inv) => inv.status === 'paid').length;
    const unpaid = rows.filter((inv) => inv.status !== 'paid').length;
    const overdue = rows.filter((inv) => inv.status === 'overdue').length;
    return { total, paid, unpaid, overdue };
  }, [rows]);

  const openPay = (inv) => {
    setPay(inv);
    setAmount(String((inv.amount || inv.total_amount || 0) - (inv.paid_amount || 0)));
    setMethod('cash');
    setErr('');
  };
  const submitPay = async () => {
    setBusy(true); setErr('');
    try {
      await api.adminPayInvoice(token, pay.id, { amount: Number(amount), method });
      setPay(null); refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Платежи" subtitle="Счета и оплаты (наличные + карта)" />

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard Icon={TrendingUp} label="Всего счетов" value={rows.length} color="#3B82F6" gradient="linear-gradient(135deg,#3B82F6,#2980B9)" delay="stagger-1" />
        <StatCard Icon={CheckCircle2} label="Оплачено" value={stats.paid} color="#2ECC71" gradient="linear-gradient(135deg,#2ECC71,#27AE60)" delay="stagger-2" />
        <StatCard Icon={Clock} label="Ожидает" value={stats.unpaid} color="#F59E0B" gradient="linear-gradient(135deg,#F59E0B,#E67E22)" delay="stagger-3" />
        <StatCard Icon={AlertTriangle} label="Просрочено" value={stats.overdue} color="#E8543E" gradient="linear-gradient(135deg,#E8543E,#C0392B)" delay="stagger-4" />
      </div>

      {/* ═══ Invoice Cards ═══ */}
      {isLoading ? (
        <div className="mt-4"><SkeletonTable cols={6} /></div>
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : rows.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center animate-fade-in">
          <Wallet size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">Нет счетов</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 opacity-60">Счета появятся здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((inv) => (
            <InvoiceCard key={inv.id} inv={inv} onPay={openPay} />
          ))}
        </div>
      )}

      {/* ═══ Payment Modal ═══ */}
      {pay && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-1">Приём оплаты</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{studentName(pay)} · {pay.group?.name || '—'}</p>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Сумма</label>
                <input
                  className="input input-bordered w-full"
                  type="number"
                  placeholder="Сумма"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Способ оплаты</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`flex items-center justify-center gap-2 py-3 rounded-[12px] border-2 transition-all font-semibold text-[13px] ${method === 'cash' ? 'border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--green)]/40'}`}
                    onClick={() => setMethod('cash')}
                  >
                    <Banknote size={18} /> Наличные
                  </button>
                  <button
                    className={`flex items-center justify-center gap-2 py-3 rounded-[12px] border-2 transition-all font-semibold text-[13px] ${method === 'card' ? 'border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--green)]/40'}`}
                    onClick={() => setMethod('card')}
                  >
                    <CreditCard size={18} /> Карта
                  </button>
                </div>
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
