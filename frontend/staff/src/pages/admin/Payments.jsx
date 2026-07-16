import { useState, useMemo } from 'react';
import {
  Wallet, CreditCard, Banknote, Clock, CheckCircle2, AlertTriangle, AlertCircle,
  TrendingUp, Search, ChevronLeft, ChevronRight, Plus, X,
} from 'lucide-react';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useAdminInvoices } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// Backend statuslari: pending, partially_paid, paid, overdue, cancelled
const STATUS = {
  paid: { label: 'Оплачен', bg: '#2ECC7115', text: '#2ECC71', icon: CheckCircle2 },
  partially_paid: { label: 'Частично', bg: '#F59E0B15', text: '#F59E0B', icon: Clock },
  pending: { label: 'Ожидает', bg: '#6B728015', text: '#6B7280', icon: AlertCircle },
  overdue: { label: 'Просрочен', bg: '#E8543E15', text: '#E8543E', icon: AlertTriangle },
  cancelled: { label: 'Отменён', bg: '#6B728008', text: '#6B7280', icon: AlertCircle },
};

const STATUS_LIST = ['all', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'];
const STATUS_LABELS = {
  all: 'Все',
  pending: 'Ожидает',
  partially_paid: 'Частично',
  paid: 'Оплачен',
  overdue: 'Просрочен',
  cancelled: 'Отменён',
};

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
  const st = STATUS[inv.status] || STATUS.pending;
  const StIcon = st.icon;
  const total = Number(inv.totalAmount || inv.amount || 0);
  const paid = Number(inv.paidAmount || inv.paid_amount || 0);
  const remaining = total - paid;
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div className="glass-strong rounded-[16px] p-5 card-hover-premium group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[14px] font-bold text-[var(--text)]">{inv.student || '—'}</h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{inv.group || '—'}</p>
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
          <Clock size={10} /> Срок: {dateShort(inv.dueDate || inv.due_date)}
        </span>
        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
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

  // Filter & pagination state
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;
  const [searchQuery, setSearchQuery] = useState('');

  // Pay modal state — split payment
  const [pay, setPay] = useState(null);
  const [parts, setParts] = useState([{ method: 'cash', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const qs = `?page=${page}&limit=${limit}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`;

  const { data, isLoading, error, refetch } = useAdminInvoices(qs);

  const raw = data?.data || data || {};
  const allRows = raw.invoices || [];
  const meta = raw.meta || {};
  const totalPages = meta.totalPages || Math.ceil((meta.total || allRows.length) / limit) || 1;

  // Client-side search filtering
  const rows = useMemo(() => {
    let filtered = allRows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((inv) => {
        const name = (inv.student || '').toLowerCase();
        const group = (inv.group || '').toLowerCase();
        return name.includes(q) || group.includes(q);
      });
    }
    return filtered;
  }, [allRows, searchQuery]);

  const stats = useMemo(() => {
    const total = allRows.reduce((s, inv) => s + Number(inv.totalAmount || inv.amount || 0), 0);
    const paid = allRows.filter((inv) => inv.status === 'paid').length;
    const waiting = allRows.filter((inv) => inv.status === 'pending' || inv.status === 'partially_paid').length;
    const overdue = allRows.filter((inv) => inv.status === 'overdue').length;
    return { total, paid, waiting, overdue };
  }, [allRows]);

  const openPay = (inv) => {
    const remaining = Number(inv.totalAmount || inv.amount || 0) - Number(inv.paidAmount || inv.paid_amount || 0);
    setPay(inv);
    setParts([{ method: 'cash', amount: String(remaining) }]);
    setErr('');
  };

  const addPart = () => {
    if (parts.length >= 5) return;
    setParts([...parts, { method: 'card', amount: '' }]);
  };

  const removePart = (i) => {
    if (parts.length <= 1) return;
    setParts(parts.filter((_, idx) => idx !== i));
  };

  const updatePart = (i, field, value) => {
    const updated = [...parts];
    updated[i] = { ...updated[i], [field]: value };
    setParts(updated);
  };

  const partsSum = parts.reduce((s, p) => s + Number(p.amount || 0), 0);

  const submitPay = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.adminPayInvoice(token, pay.id, {
        parts: parts.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
        })),
      });
      setPay(null);
      refetch();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Платежи" subtitle="Счета и оплаты (наличные + карта)">
        {allRows.length > 0 && (
          <span className="text-sm text-[var(--text-muted)] tabular-nums">
            {meta.total || allRows.length} счетов
          </span>
        )}
      </PageHeader>

      {/* ═══ Search & Filters ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Поиск по имени или группе..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[13px] font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`h-8 px-3 rounded-lg text-[12px] font-bold transition-all ${
                statusFilter === s
                  ? 'bg-[var(--accent)] text-black shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)]/40'
              }`}
            >
              {STATUS_LABELS[s]}
              {s !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {allRows.filter((inv) => inv.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard Icon={TrendingUp} label="Всего счетов" value={allRows.length} color="#3B82F6" gradient="linear-gradient(135deg,#3B82F6,#2980B9)" delay="stagger-1" />
        <StatCard Icon={CheckCircle2} label="Оплачено" value={stats.paid} color="#2ECC71" gradient="linear-gradient(135deg,#2ECC71,#27AE60)" delay="stagger-2" />
        <StatCard Icon={Clock} label="Ожидает" value={stats.waiting} color="#F59E0B" gradient="linear-gradient(135deg,#F59E0B,#E67E22)" delay="stagger-3" />
        <StatCard Icon={AlertTriangle} label="Просрочено" value={stats.overdue} color="#E8543E" gradient="linear-gradient(135deg,#E8543E,#C0392B)" delay="stagger-4" />
      </div>

      {/* ═══ Invoice List ═══ */}
      {isLoading ? (
        <div className="mt-4"><SkeletonTable cols={6} /></div>
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : allRows.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center animate-fade-in mt-4">
          <Wallet size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">Нет счетов</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 opacity-60">Счета появятся здесь</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-8 text-center animate-fade-in mt-4">
          <Search size={32} className="mx-auto mb-2 text-[var(--text-muted)] opacity-30" />
          <p className="text-[13px] font-medium text-[var(--text-muted)]">Ничего не найдено</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 opacity-60">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((inv) => (
              <InvoiceCard key={inv.id} inv={inv} onPay={openPay} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[var(--text-muted)] tabular-nums">
                Страница {meta.page || page} из {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={(meta.page || page) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={(meta.page || page) >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ Payment Modal — Split Payment ═══ */}
      {pay && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-1">Приём оплаты</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {pay.student} · {pay.group || '—'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Счёт: {dateShort(pay.dueDate || pay.due_date)} · Остаток: {money(Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0))}
            </p>

            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}

            {/* Split Payment Parts */}
            <div className="space-y-2">
              {parts.map((part, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="select select-bordered select-sm w-[120px]"
                    value={part.method}
                    onChange={(e) => updatePart(i, 'method', e.target.value)}
                  >
                    <option value="cash">Наличные</option>
                    <option value="card">Карта</option>
                    <option value="transfer">Перевод</option>
                  </select>
                  <input
                    className="input input-bordered input-sm flex-1"
                    type="number"
                    placeholder="Сумма"
                    value={part.amount}
                    onChange={(e) => updatePart(i, 'amount', e.target.value)}
                  />
                  {parts.length > 1 && (
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => removePart(i)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {parts.length < 5 && (
              <button className="btn btn-ghost btn-xs mt-2 gap-1" onClick={addPart}>
                <Plus size={12} /> Добавить часть (сплит)
              </button>
            )}

            {parts.length > 1 && (
              <p className="text-xs text-[var(--text-muted)] mt-2 tabular-nums">
                Итого: {money(partsSum)}
                {partsSum > Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0) && (
                  <span className="text-error ml-1">· Превышает остаток!</span>
                )}
              </p>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setPay(null)} disabled={busy}>Отмена</button>
              <button
                className="btn btn-primary"
                onClick={submitPay}
                disabled={busy || parts.some((p) => !p.amount || Number(p.amount) <= 0) || partsSum > Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0)}
              >
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
