import { useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet, CreditCard, Banknote, Clock, CheckCircle2, AlertTriangle, AlertCircle,
  TrendingUp, Search, ChevronLeft, ChevronRight, Plus, X, FileText, Upload,
  RotateCcw, Ban, Info, Download, Check,
} from 'lucide-react';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useNavigate } from 'react-router-dom';
import { useAdminInvoices, useAdminStudents } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, RowSkeleton } from '../mentor/_ui.jsx';

const STATUS = {
  paid: { label: 'Оплачен', bg: '#2ECC7115', text: '#2ECC71', icon: CheckCircle2 },
  partially_paid: { label: 'Частично', bg: '#F59E0B15', text: '#F59E0B', icon: Clock },
  pending: { label: 'Ожидает', bg: '#6B728015', text: '#6B7280', icon: AlertCircle },
  overdue: { label: 'Просрочен', bg: '#E8543E15', text: '#E8543E', icon: AlertTriangle },
  cancelled: { label: 'Отменён', bg: '#6B728008', text: '#6B7280', icon: AlertCircle },
};

const STATUS_LIST = ['all', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled'];
const STATUS_LABELS = {
  all: 'Все', pending: 'Ожидает', partially_paid: 'Частично',
  paid: 'Оплачен', overdue: 'Просрочен', cancelled: 'Отменён',
};

const METHODS = { cash: 'Наличные', card: 'Карта', transfer: 'Перевод' };

/* ══════════ StatCard ══════════ */
function StatCard({ Icon, label, value, color, gradient, delay }) {
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[16px] p-4 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity" style={{ background: gradient }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
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

/* ══════════ SplitPartsForm (reused in pay + ad-hoc modals) ══════════ */
function SplitPartsForm({ parts, onChange, onAdd, onRemove, maxParts = 5 }) {
  return (
    <div className="space-y-2">
      {parts.map((part, i) => (
        <div key={i} className="flex items-center gap-2">
          <select className="select select-bordered select-sm w-[120px]" value={part.method}
            onChange={(e) => onChange(i, 'method', e.target.value)}>
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="transfer">Перевод</option>
          </select>
          <input className="input input-bordered input-sm flex-1" type="number" placeholder="Сумма"
            value={part.amount} onChange={(e) => onChange(i, 'amount', e.target.value)} />
          {parts.length > 1 && (
            <button className="btn btn-ghost btn-xs text-error" onClick={() => onRemove(i)}><X size={14} /></button>
          )}
        </div>
      ))}
      {parts.length < maxParts && (
        <button className="btn btn-ghost btn-xs gap-1" onClick={onAdd}>
          <Plus size={12} /> Добавить часть (сплит)
        </button>
      )}
    </div>
  );
}

/* ══════════ Invoice Card ══════════ */
function InvoiceCard({ inv, onPay, onDetail, onStudentClick }) {
  const st = STATUS[inv.status] || STATUS.pending;
  const StIcon = st.icon;
  const total = Number(inv.totalAmount || inv.amount || 0);
  const paid = Number(inv.paidAmount || inv.paid_amount || 0);
  const remaining = total - paid;
  const paidPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const studentName = inv.student || inv.studentName || '';

  return (
    <div className="glass-strong rounded-[16px] p-5 card-hover-premium group">
      <div className="flex items-start gap-3 mb-3">
        {/* Student avatar */}
        <div onClick={() => onStudentClick(inv)} title="Открыть профиль студента" className="shrink-0 cursor-pointer">
          <Avatar name={studentName} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-[var(--text)] truncate cursor-pointer hover:text-[var(--accent)] transition-colors"
            onClick={() => onStudentClick(inv)}>
            {studentName || '—'}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{inv.group || inv.groupName || '—'}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-2"
          style={{ background: st.bg, color: st.text }}>
          <StIcon size={12} /> {st.label}
        </span>
      </div>
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
      <div className="w-full h-1.5 rounded-full bg-[var(--surface)] mb-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{
          width: `${paidPercent}%`,
          background: paidPercent >= 100 ? '#2ECC71' : paidPercent > 0 ? '#F59E0B' : 'var(--border)',
        }} />
      </div>
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          onClick={() => onDetail(inv)}>
          <Info size={10} /> Детали
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Clock size={10} /> {dateShort(inv.dueDate || inv.due_date)}
          </span>
          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
            <button className="h-7 px-3 rounded-[8px] flex items-center gap-1 text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--green)' }} onClick={() => onPay(inv)}>
              <Wallet size={12} /> {remaining > 0 ? money(remaining) : 'Оплатить'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Payments ═══════════════ */
export default function AdminPayments() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Filter & pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;
  const [searchQuery, setSearchQuery] = useState('');

  // Pay modal
  const [pay, setPay] = useState(null);
  const [payParts, setPayParts] = useState([{ method: 'cash', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Ad-hoc modal
  const [showAdHoc, setShowAdHoc] = useState(false);
  const [adhocForm, setAdhocForm] = useState({ studentName: '', studentId: '', totalAmount: '', comment: '' });
  const [adhocParts, setAdhocParts] = useState([{ method: 'cash', amount: '' }]);
  const [studentSearch, setStudentSearch] = useState('');

  // Invoice detail modal
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('transactions');
  const [reverseTxId, setReverseTxId] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseMode, setReverseMode] = useState('refund');

  // Receipt upload
  const [uploadTxId, setUploadTxId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Store transactions from pay responses (keyed by invoice ID)
  const txStore = useRef({});
  const storeTx = useCallback((invoiceId, transactions) => {
    txStore.current[invoiceId] = [
      ...(txStore.current[invoiceId] || []),
      ...transactions,
    ];
  }, []);

  const qs = `?page=${page}&limit=${limit}`;
  const { data, isLoading, error, refetch } = useAdminInvoices(qs);
  const { data: studentsData } = useAdminStudents('?limit=100');

  const raw = data?.data || data || {};
  const allRows = raw.invoices || [];
  const meta = raw.meta || {};
  const totalPages = meta.totalPages || Math.ceil((meta.total || allRows.length) / limit) || 1;
  const students = studentsData?.data?.students || studentsData?.students || [];

  // Client-side search + status filter
  const rows = useMemo(() => {
    let result = allRows;
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((inv) => {
        const name = (inv.student || inv.studentName || '').toLowerCase();
        const group = (inv.group || inv.groupName || '').toLowerCase();
        return name.includes(q) || group.includes(q);
      });
    }
    return result;
  }, [allRows, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = allRows.reduce((s, inv) => s + Number(inv.totalAmount || inv.amount || 0), 0);
    return {
      total,
      paid: allRows.filter((inv) => inv.status === 'paid').length,
      waiting: allRows.filter((inv) => inv.status === 'pending' || inv.status === 'partially_paid').length,
      overdue: allRows.filter((inv) => inv.status === 'overdue').length,
    };
  }, [allRows]);

  /* ─── Pay Invoice ─── */
  const openPay = (inv) => {
    const remaining = Number(inv.totalAmount || inv.amount || 0) - Number(inv.paidAmount || inv.paid_amount || 0);
    setPay(inv);
    setPayParts([{ method: 'cash', amount: String(remaining) }]);
    setErr('');
  };
  const payPartsSum = payParts.reduce((s, p) => s + Number(p.amount || 0), 0);
  const submitPay = async () => {
    setBusy(true); setErr('');
    try {
      const res = await api.adminPayInvoice(token, pay.id, {
        parts: payParts.map((p) => ({ method: p.method, amount: Number(p.amount) })),
      });
      if (res.transactions) storeTx(pay.id, res.transactions);
      setPay(null);
      refetch();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  /* ─── Filtered students for ad-hoc search ─── */
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((s) => {
      const name = [s.firstName || '', s.lastName || ''].filter(Boolean).join(' ').toLowerCase();
      const date = s.createdAt || s.created_at || '';
      return name.includes(q) || date.includes(q);
    });
  }, [students, studentSearch]);

  /* ─── Ad-hoc Payment ─── */
  const adhocTotal = adhocParts.reduce((s, p) => s + Number(p.amount || 0), 0);
  const submitAdHoc = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        studentId: adhocForm.studentId,
        totalAmount: Number(adhocForm.totalAmount),
        parts: adhocParts.map((p) => ({ method: p.method, amount: Number(p.amount) })),
        comment: adhocForm.comment || undefined,
      };
      const res = await api.adminAdHocPayment(token, body);
      if (res.transactions) storeTx(res.invoice?.id || 'adhoc', res.transactions);
      setShowAdHoc(false);
      setAdhocForm({ studentName: '', studentId: '', totalAmount: '', comment: '' });
      setAdhocParts([{ method: 'cash', amount: '' }]);
      setStudentSearch('');
      refetch();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const selectStudent = (s) => {
    setAdhocForm((f) => ({
      ...f,
      studentId: s.id,
      studentName: [s.firstName || '', s.lastName || ''].filter(Boolean).join(' '),
    }));
    setStudentSearch('');
  };

  /* ─── Invoice Detail ─── */
  const openDetail = (inv) => {
    setDetail(inv);
    setDetailTab('transactions');
    setReverseTxId(null);
    setUploadTxId(null);
  };
  const invoiceTx = detail ? (txStore.current[detail.id] || []) : [];

  /* ─── Refund / Void ─── */
  const submitReverse = async () => {
    if (!reverseTxId || !reverseReason.trim()) return;
    setBusy(true);
    try {
      if (reverseMode === 'refund') {
        await api.adminRefundTransaction(token, reverseTxId, { reason: reverseReason });
      } else {
        await api.adminVoidTransaction(token, reverseTxId, { reason: reverseReason });
      }
      // Mark transaction locally
      const txs = txStore.current[detail?.id] || [];
      txStore.current[detail?.id] = txs.map((t) =>
        t.id === reverseTxId ? { ...t, status: reverseMode === 'refund' ? 'refunded' : 'voided' } : t
      );
      setReverseTxId(null);
      setReverseReason('');
      refetch();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  /* ─── Receipt Upload ─── */
  const handleReceiptFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTxId) return;
    setUploading(true);
    try {
      const { uploadUrl, receiptKey } = await api.adminReceiptUploadUrl(
        token, uploadTxId, file.name, file.type
      );
      // Upload file to presigned URL
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      // Attach receipt key to transaction
      await api.adminAttachReceipt(token, uploadTxId, receiptKey);
      // Update local store
      const txs = txStore.current[detail?.id] || [];
      txStore.current[detail?.id] = txs.map((t) =>
        t.id === uploadTxId ? { ...t, receiptKey, receiptUploaded: true } : t
      );
      setUploadTxId(null);
      setUploadFile(null);
    } catch (er) {
      setErr(er.message || 'Ошибка загрузки чека');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Платежи" subtitle="Счета и оплаты (наличные + карта)">
        <div className="flex items-center gap-3">
          {allRows.length > 0 && (
            <span className="text-sm text-[var(--text-muted)] tabular-nums">{meta.total || allRows.length} счетов</span>
          )}
          <button className="h-9 px-4 rounded-[10px] flex items-center gap-1.5 text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--accent)', color: '#000' }} onClick={() => { setShowAdHoc(true); setErr(''); setStudentSearch(''); }}>
            <Plus size={14} /> Разовый платёж
          </button>
        </div>
      </PageHeader>

      {/* ═══ Search & Filters ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" placeholder="Поиск по имени студента..."
            className="w-full h-10 pl-9 pr-4 rounded-[12px] text-[13px] font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_LIST.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`h-8 px-3 rounded-lg text-[12px] font-bold transition-all ${statusFilter === s
                ? 'bg-[var(--accent)] text-black shadow-sm'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)]/40'
              }`}>
              {STATUS_LABELS[s]}
              {s !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-70">{allRows.filter((inv) => inv.status === s).length}</span>
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
        <div className="mt-4"><RowSkeleton count={6} /></div>
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
              <InvoiceCard key={inv.id} inv={inv} onPay={openPay} onDetail={openDetail} onStudentClick={(inv) => {
                let sid = inv.studentId || inv.student_id;
                // Fallback: studentId bo'lmasa, student nomi bo'yicha students list dan qidiramiz
                if (!sid && students.length > 0) {
                  const name = (inv.student || inv.studentName || '').toLowerCase();
                  const found = students.find((s) => {
                    const full = [s.firstName || '', s.lastName || ''].filter(Boolean).join(' ').toLowerCase();
                    return full === name || full.includes(name) || name.includes(full);
                  });
                  if (found) sid = found.id;
                }
                if (sid) navigate(`/students/${sid}`);
              }} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-[var(--text-muted)] tabular-nums">Страница {meta.page || page} из {totalPages}</span>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" disabled={(meta.page || page) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /></button>
                <button className="btn btn-ghost btn-sm" disabled={(meta.page || page) >= totalPages}
                  onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════ MODAL: Pay Invoice ═══════════════ */}
      {/* ═══════════════ MODAL: Pay Invoice ═══════════════ */}
      {pay && createPortal(
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-1">Приём оплаты</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{pay.student} · {pay.group || '—'}</p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Счёт: {dateShort(pay.dueDate || pay.due_date)} · Остаток: {money(Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0))}
            </p>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <SplitPartsForm parts={payParts} onChange={(i, f, v) => {
              const u = [...payParts]; u[i] = { ...u[i], [f]: v }; setPayParts(u);
            }} onAdd={() => setPayParts([...payParts, { method: 'card', amount: '' }])}
              onRemove={(i) => setPayParts(payParts.filter((_, idx) => idx !== i))} />
            {payParts.length > 1 && (
              <p className="text-xs text-[var(--text-muted)] mt-2 tabular-nums">
                Итого: {money(payPartsSum)}
                {payPartsSum > Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0) && (
                  <span className="text-error ml-1">· Превышает остаток!</span>
                )}
              </p>
            )}
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setPay(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={submitPay}
                disabled={busy || payParts.some((p) => !p.amount || Number(p.amount) <= 0) || payPartsSum > Number(pay.totalAmount || pay.amount || 0) - Number(pay.paidAmount || pay.paid_amount || 0)}>
                {busy && <span className="loading loading-spinner loading-xs" />} Принять
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPay(null)} />
        </dialog>
      , document.body)}

      {/* ═══════════════ MODAL: Razoviy (Ad-hoc) Payment ═══════════════ */}
      {showAdHoc && createPortal(
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)] max-w-lg">
            <h3 className="font-bold text-lg mb-1">Разовый платёж</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Создать счёт и принять оплату вне графика начислений</p>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}

            <div className="space-y-3">
              {/* Searchable student selection */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Студент</label>
                {adhocForm.studentId && adhocForm.studentName ? (
                  <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Avatar name={adhocForm.studentName} size="sm" />
                      <span className="text-[13px] font-bold text-[var(--text)]">{adhocForm.studentName}</span>
                    </div>
                    <button className="btn btn-ghost btn-xs" onClick={() => {
                      setAdhocForm({ ...adhocForm, studentId: '', studentName: '' });
                      setStudentSearch('');
                    }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="text" className="w-full h-10 pl-9 pr-4 rounded-[10px] text-[13px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]" 
                      placeholder="Искать по имени, фамилии или дате..."
                      value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                      autoFocus />
                    {studentSearch && filteredStudents.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-[10px] border border-[var(--border)] shadow-lg z-50" style={{ background: 'var(--surface)' }}>
                        {filteredStudents.map((s) => (
                          <button key={s.id} type="button"
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0"
                            onClick={() => selectStudent(s)}>
                            <Avatar name={[s.firstName || '', s.lastName || ''].filter(Boolean).join(' ')} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-[var(--text)] truncate">{[s.firstName || '', s.lastName || ''].filter(Boolean).join(' ')}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">{s.groupName || '—'} · {s.createdAt ? dateShort(s.createdAt) : ''}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {studentSearch && filteredStudents.length === 0 && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1">Студент не найден</p>
                    )}
                  </div>
                )}
              </div>

              {/* Total amount */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Сумма счета</label>
                <input className="input input-bordered w-full h-10 text-[13px]" type="number" placeholder="Сумма"
                  value={adhocForm.totalAmount}
                  onChange={(e) => setAdhocForm((f) => ({ ...f, totalAmount: e.target.value }))} />
              </div>

              {/* Split parts */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Части оплаты</label>
                <SplitPartsForm parts={adhocParts}
                  onChange={(i, f, v) => {
                    const u = [...adhocParts]; u[i] = { ...u[i], [f]: v }; setAdhocParts(u);
                  }}
                  onAdd={() => setAdhocParts([...adhocParts, { method: 'card', amount: '' }])}
                  onRemove={(i) => setAdhocParts(adhocParts.filter((_, idx) => idx !== i))}
                  maxParts={5} />
              </div>

              {adhocParts.length > 1 && (
                <p className={`text-xs tabular-nums ${adhocTotal > Number(adhocForm.totalAmount) ? 'text-error' : 'text-[var(--text-muted)]'}`}>
                  Итого частей: {money(adhocTotal)}
                  {adhocTotal > Number(adhocForm.totalAmount) && (
                    <span className="ml-1">· Превышает сумму счёта!</span>
                  )}
                  {adhocTotal < Number(adhocForm.totalAmount) && (
                    <span className="ml-1 text-warning">· Остаток: {money(Number(adhocForm.totalAmount) - adhocTotal)}</span>
                  )}
                </p>
              )}

              {/* Comment */}
              <div>
                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">Комментарий</label>
                <input className="input input-bordered w-full h-10 text-[13px]" type="text" placeholder="Опционально"
                  value={adhocForm.comment}
                  onChange={(e) => setAdhocForm((f) => ({ ...f, comment: e.target.value }))} />
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setShowAdHoc(false); setErr(''); setStudentSearch(''); }} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={submitAdHoc}
                disabled={busy || !adhocForm.studentId || !adhocForm.totalAmount || Number(adhocForm.totalAmount) <= 0 || adhocTotal <= 0 || adhocTotal > Number(adhocForm.totalAmount)}>
                {busy && <span className="loading loading-spinner loading-xs" />} Создать
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowAdHoc(false); setErr(''); setStudentSearch(''); }} />
        </dialog>
      , document.body)}

      {/* ═══════════════ MODAL: Invoice Detail ═══════════════ */}
      {detail && createPortal(
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)] max-w-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{detail.student || '—'}</h3>
                <p className="text-sm text-[var(--text-muted)]">{detail.group || '—'}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ background: (STATUS[detail.status] || STATUS.pending).bg, color: (STATUS[detail.status] || STATUS.pending).text }}>
                {(STATUS[detail.status] || STATUS.pending).icon && (
                  <StatusIcon s={detail.status} />
                )}
                {(STATUS[detail.status] || STATUS.pending).label}
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="glass-strong rounded-[12px] p-3 text-center">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Сумма</div>
                <div className="text-[16px] font-extrabold tabular-nums">{money(Number(detail.totalAmount || detail.amount || 0))}</div>
              </div>
              <div className="glass-strong rounded-[12px] p-3 text-center">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Оплачено</div>
                <div className="text-[16px] font-extrabold tabular-nums" style={{ color: '#2ECC71' }}>{money(Number(detail.paidAmount || detail.paid_amount || 0))}</div>
              </div>
              <div className="glass-strong rounded-[12px] p-3 text-center">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Срок</div>
                <div className="text-[12px] font-bold tabular-nums">{dateShort(detail.dueDate || detail.due_date)}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-3 border-b border-[var(--border)] pb-2">
              <button className={`text-[12px] font-bold px-3 py-1 rounded-lg transition-all ${detailTab === 'transactions' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                onClick={() => setDetailTab('transactions')}>
                Транзакции ({invoiceTx.length})
              </button>
              <button className={`text-[12px] font-bold px-3 py-1 rounded-lg transition-all ${detailTab === 'reverse' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                onClick={() => setDetailTab('reverse')}>
                Возврат / Аннулирование
              </button>
              <button className={`text-[12px] font-bold px-3 py-1 rounded-lg transition-all ${detailTab === 'receipt' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                onClick={() => setDetailTab('receipt')}>
                Чек
              </button>
            </div>

            {/* ── Tab: Transactions ── */}
            {detailTab === 'transactions' && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {invoiceTx.length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Нет транзакций для этого счёта</p>
                ) : (
                  invoiceTx.map((tx, i) => (
                    <div key={tx.id || i} className="flex items-center justify-between p-2.5 rounded-[10px] bg-[var(--surface)]">
                      <div className="flex items-center gap-2">
                        {tx.method === 'cash' ? <Banknote size={14} className="text-[var(--text-muted)]" />
                          : tx.method === 'card' ? <CreditCard size={14} className="text-[var(--text-muted)]" />
                            : <Wallet size={14} className="text-[var(--text-muted)]" />}
                        <div>
                          <span className="text-[12px] font-bold text-[var(--text)]">{METHODS[tx.method] || tx.method}</span>
                          <span className={`ml-2 text-[11px] font-semibold ${tx.status === 'completed' ? 'text-success' : tx.status === 'refunded' ? 'text-error' : 'text-warning'}`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-[13px] font-bold tabular-nums">{money(Number(tx.amount))}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Refund / Void ── */}
            {detailTab === 'reverse' && (
              <div className="space-y-3">
                <p className="text-[12px] text-[var(--text-muted)]">Выберите завершённую транзакцию для возврата или аннулирования:</p>
                {invoiceTx.filter((t) => t.status === 'completed').length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Нет завершённых транзакций</p>
                ) : (
                  <select className="select select-bordered w-full text-[13px]"
                    value={reverseTxId || ''} onChange={(e) => setReverseTxId(e.target.value)}>
                    <option value="">Выберите транзакцию...</option>
                    {invoiceTx.filter((t) => t.status === 'completed').map((tx, i) => (
                      <option key={tx.id || i} value={tx.id}>
                        {METHODS[tx.method] || tx.method} — {money(Number(tx.amount))} ({tx.id?.slice(0, 8) || '—'})
                      </option>
                    ))}
                  </select>
                )}
                {reverseTxId && (
                  <>
                    <div className="flex gap-2">
                      <button className={`flex-1 h-9 rounded-[10px] text-[12px] font-bold transition-all ${reverseMode === 'refund' ? 'bg-error text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}
                        onClick={() => setReverseMode('refund')}>
                        <RotateCcw size={14} className="inline mr-1" /> Возврат (Refund)
                      </button>
                      <button className={`flex-1 h-9 rounded-[10px] text-[12px] font-bold transition-all ${reverseMode === 'void' ? 'bg-warning text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}
                        onClick={() => setReverseMode('void')}>
                        <Ban size={14} className="inline mr-1" /> Аннулировать (Void)
                      </button>
                    </div>
                    <input className="input input-bordered w-full text-[13px]" type="text"
                      placeholder="Причина (обязательно для возврата)" value={reverseReason}
                      onChange={(e) => setReverseReason(e.target.value)} />
                    <button className="btn btn-error btn-sm w-full" onClick={submitReverse}
                      disabled={busy || (reverseMode === 'refund' && !reverseReason.trim())}>
                      {busy && <span className="loading loading-spinner loading-xs" />}
                      {reverseMode === 'refund' ? 'Выполнить возврат' : 'Аннулировать'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Receipt ── */}
            {detailTab === 'receipt' && (
              <div className="space-y-3">
                <p className="text-[12px] text-[var(--text-muted)]">Загрузить чек для транзакции:</p>
                {invoiceTx.filter((t) => t.status === 'completed').length === 0 ? (
                  <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Нет завершённых транзакций</p>
                ) : (
                  <select className="select select-bordered w-full text-[13px]"
                    value={uploadTxId || ''} onChange={(e) => setUploadTxId(e.target.value)}>
                    <option value="">Выберите транзакцию...</option>
                    {invoiceTx.filter((t) => t.status === 'completed').map((tx, i) => (
                      <option key={tx.id || i} value={tx.id}>
                        {METHODS[tx.method] || tx.method} — {money(Number(tx.amount))}
                        {tx.receiptKey ? ' (✅ чек есть)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {uploadTxId && (
                  <div className="border-2 border-dashed border-[var(--border)] rounded-[12px] p-6 text-center hover:border-[var(--accent)]/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('receipt-file-input')?.click()}>
                    <Upload size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    <p className="text-[12px] text-[var(--text-muted)]">{uploadFile ? uploadFile.name : 'Нажмите для выбора файла'}</p>
                    <input id="receipt-file-input" type="file" accept="image/*,.pdf" className="hidden"
                      onChange={(e) => {
                        setUploadFile(e.target.files?.[0] || null);
                        handleReceiptFile(e);
                      }} />
                  </div>
                )}
                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--text-muted)]">
                    <span className="loading loading-spinner loading-xs" /> Загрузка...
                  </div>
                )}
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setDetail(null); setErr(''); }}>Закрыть</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setDetail(null); setErr(''); }} />
        </dialog>
      , document.body)}
    </div>
  );
}

/* Tiny helper for status icon */
function StatusIcon({ s }) {
  const st = STATUS[s] || STATUS.pending;
  const Ic = st.icon;
  return <Ic size={12} className="inline" />;
}
