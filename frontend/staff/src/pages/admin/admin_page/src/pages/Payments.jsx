import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineDocumentText, HiOutlineXMark,
  HiOutlineChevronDown, HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineArrowUturnLeft,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  fetchInvoices as apiFetchInvoices,
  createPayment as apiCreatePayment,
  payInvoice as apiPayInvoice,
  refundTransaction as apiRefundTransaction,
  fetchStudents as apiFetchStudents,
} from '../services/adminService.js';

// ─── Constants ──────────────────────────────────────────────
const METHODS = [
  { value: 'naqt', label: 'Naqt' },
  { value: 'karta', label: 'Karta' },
  { value: 'otkazma', label: "O'tkazma" },
  { value: 'naqt+karta', label: 'Naqt + Karta' },
  { value: 'naqt+otkazma', label: "Naqt + O'tkazma" },
];

const METHOD_LABELS = Object.fromEntries(METHODS.map((m) => [m.value, m.label]));

const INVOICE_TYPE_LABELS = {
  full: 'To‘liq',
  split: 'Split',
  installment: 'Nasiya',
};

function isCombinedMethod(method) {
  return ['naqt+karta', 'naqt+otkazma', 'karta+otkazma'].includes(method);
}

function getMethodsFromCombined(method) {
  return method.split('+');
}

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + ' so‘m';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

// ─── Student Autocomplete ───
function StudentAutocomplete({ students, selectedStudent, onSelect, onClear }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? students.filter((s) => {
        const q = query.toLowerCase();
        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.phone || '').includes(q);
      })
    : students;

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">
        Talaba <span className="text-[var(--danger)]">*</span>
      </label>
      {selectedStudent ? (
        <div className="flex items-center justify-between h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[var(--green-bg)] flex items-center justify-center text-[9px] font-bold text-[var(--text)]">
              {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
            </div>
            <span className="text-[13px] font-semibold text-[var(--text)]">
              {selectedStudent.firstName} {selectedStudent.lastName}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">{selectedStudent.phone}</span>
            {selectedStudent.groups?.[0] && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-[4px]" style={{ background: 'var(--green-bg)', color: 'var(--text-secondary)' }}>
                {selectedStudent.groups[0].name}
              </span>
            )}
          </div>
          <button onClick={onClear} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Ism yoki telefon orqali qidirish..."
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        </div>
      )}

      {open && !selectedStudent && (
        <div className="absolute z-50 mt-1 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_var(--shadow-lg)] max-h-[240px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-[12px] text-[var(--text-muted)] text-center">Talaba topilmadi</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { onSelect(s); setQuery(''); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-b-0"
              >
                <div className="w-8 h-8 rounded-[8px] bg-[var(--green-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--text)] shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[var(--text)]">{s.firstName} {s.lastName}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{s.phone}</div>
                </div>
                {s.groups?.[0] && (
                  <span className="text-[9px] px-2 py-0.5 rounded-[4px] shrink-0" style={{ background: 'var(--green-bg)', color: 'var(--text-secondary)' }}>
                    {s.groups[0].name}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
export default function Payments() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ amount: '', method: 'naqt', description: '', splitAmounts: {} });
  const [payForm, setPayForm] = useState({ amount: '', method: 'naqt' });

  // ─── Data loading ────────────────────────────────
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchInvoices({ limit: 100 });
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError(err.response?.data?.message || err.message || "To'lovlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const data = await apiFetchStudents({ limit: 100 });
      setStudents(data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    loadStudents();
  }, [loadInvoices, loadStudents]);

  // ─── Filters ──────────────────────────────────────
  const filtered = useMemo(() => invoices.filter((inv) => {
    if (filter !== 'All' && inv.status !== filter.toLowerCase()) return false;
    if (search) {
      const fullName = `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`.toLowerCase();
      if (!fullName.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [invoices, filter, search]);

  const filters = ['All', 'Paid', 'Pending', 'Overdue'];
  const filterCounts = useMemo(() => ({
    All: invoices.length,
    Paid: invoices.filter((i) => i.status === 'paid').length,
    Pending: invoices.filter((i) => i.status === 'pending').length,
    Overdue: invoices.filter((i) => i.status === 'overdue').length,
  }), [invoices]);

  // ─── Modal handlers ───────────────────────────────
  const openAddModal = () => {
    setSelectedStudent(null);
    setFormData({ amount: '', method: 'naqt', description: '', splitAmounts: {} });
    setError(null);
    setModalOpen(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedStudent) return;
    let totalAmount = 0;
    const splitAmounts = {};
    if (isCombinedMethod(formData.method)) {
      const methods = getMethodsFromCombined(formData.method);
      methods.forEach((m) => {
        const val = Number(formData.splitAmounts[m] || 0);
        splitAmounts[m] = val;
        totalAmount += val;
      });
    } else {
      totalAmount = Number(formData.amount);
    }
    if (!totalAmount || totalAmount <= 0) return;

    setSaving(true);
    setError(null);
    try {
      await apiCreatePayment({
        studentId: selectedStudent.id,
        amount: totalAmount,
        method: formData.method,
        description: formData.description || "To'lov qabul qilindi",
        splitAmounts: Object.keys(splitAmounts).length > 0 ? splitAmounts : undefined,
      });
      setModalOpen(false);
      setSuccessMsg("To'lov muvaffaqiyatli qabul qilindi");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInvoices();
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.message || err.message || "To'lovni amalga oshirishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const openPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    const remaining = (invoice.total_amount || 0) - (invoice.paid_amount || 0);
    setPayForm({ amount: String(remaining), method: 'naqt' });
    setError(null);
    setPayModalOpen(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setSaving(true);
    setError(null);
    try {
      await apiPayInvoice(selectedInvoice.id, {
        amount: Number(payForm.amount),
        method: payForm.method,
      });
      setPayModalOpen(false);
      setSelectedInvoice(null);
      setSuccessMsg("To'lov muvaffaqiyatli amalga oshirildi");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInvoices();
    } catch (err) {
      console.error('Pay invoice failed:', err);
      setError(err.response?.data?.message || err.message || "To'lovni amalga oshirishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setSaving(true);
    setError(null);
    try {
      await apiRefundTransaction(refundTarget.id, refundReason);
      setRefundTarget(null);
      setRefundReason('');
      setSuccessMsg("To'lov qaytarildi");
      setTimeout(() => setSuccessMsg(null), 3000);
      await loadInvoices();
    } catch (err) {
      console.error('Refund failed:', err);
      setError(err.response?.data?.message || err.message || "Qaytarishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const getTotalFromSplit = useCallback(() => {
    if (!isCombinedMethod(formData.method)) return Number(formData.amount) || 0;
    const methods = getMethodsFromCombined(formData.method);
    return methods.reduce((sum, m) => sum + (Number(formData.splitAmounts[m] || 0)), 0);
  }, [formData]);

  // ─── Render ───────────────────────────────────────
  return (
    <div>
      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold mb-4"
          style={{ background: 'rgba(46,204,113,0.12)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.2)' }}
        >
          <HiOutlineCheckCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-70 transition-opacity">
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold mb-4"
          style={{ background: 'rgba(232,84,62,0.12)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.2)' }}
        >
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top controls */}
      <div className="space-y-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              placeholder="To‘lovlarni qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] outline-none focus:border-[var(--green)] transition-colors"
              style={{ color: 'var(--text)', background: 'var(--surface)' }}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <HiOutlineArrowPath className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
              </div>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <HiOutlinePlus className="w-4 h-4" />
            To‘lov qabul qilish
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
              style={{
                background: filter === f ? 'var(--green)' : 'var(--surface)',
                color: filter === f ? '#141B10' : 'var(--text-secondary)',
                border: `1px solid ${filter === f ? 'var(--green)' : 'var(--border)'}`,
              }}
            >
              {f === 'All' && 'Barchasi'}
              {f === 'Paid' && 'To‘langan'}
              {f === 'Pending' && 'Kutilmoqda'}
              {f === 'Overdue' && 'Muddati o‘tgan'}
              {' '}({filterCounts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Invoice table */}
        <div className="flex-1 min-w-0">
          {loading && invoices.length === 0 ? (
            <div className="glass-strong rounded-[20px] p-12 flex flex-col items-center justify-center">
              <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
              <p className="text-[13px] text-[var(--text-secondary)]">To‘lovlar yuklanmoqda...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="To‘lovlar topilmadi" description="Yangi to‘lov qo‘shing" action={{ label: 'To‘lov qilish', onClick: openAddModal }} />
          ) : (
            <div className="glass-strong rounded-[20px] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="px-5 py-3.5">Talaba</th>
                    <th className="px-5 py-3.5 text-right">Summa</th>
                    <th className="px-5 py-3.5 text-right">To‘langan</th>
                    <th className="px-5 py-3.5 text-right">Qoldiq</th>
                    <th className="px-5 py-3.5">Sana</th>
                    <th className="px-5 py-3.5">Turi</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const remaining = (inv.total_amount || 0) - (inv.paid_amount || 0);
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="border-t border-[var(--border)] text-[13px] transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                        style={selectedInvoice?.id === inv.id ? { background: 'rgba(198,255,52,0.06)' } : {}}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-[var(--text)]">
                            {inv.student?.firstName} {inv.student?.lastName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(inv.total_amount)}</td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-[var(--text-secondary)]">{formatCurrency(inv.paid_amount)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-semibold tabular-nums ${remaining > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                            {remaining > 0 ? formatCurrency(remaining) : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[var(--text-secondary)] tabular-nums">{formatDate(inv.due_date)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: inv.type === 'installment' ? 'rgba(245,158,11,0.14)' : 'var(--green-bg)',
                              color: inv.type === 'installment' ? '#F59E0B' : 'var(--text-secondary)',
                            }}
                          >
                            {INVOICE_TYPE_LABELS[inv.type] || inv.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status={inv.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Invoice Detail */}
        <div className={`${selectedInvoice ? 'fixed inset-0 z-50 flex lg:static lg:z-auto' : 'hidden lg:block'} lg:w-[340px] lg:shrink-0`}>
          {selectedInvoice && (
            <div className="fixed inset-0 bg-black/40 lg:hidden" onClick={() => setSelectedInvoice(null)} />
          )}
          <div className={`relative z-10 w-full max-w-md mx-auto lg:max-w-none lg:sticky lg:top-0 ${selectedInvoice ? 'px-4 py-6 lg:px-0 lg:py-0' : ''}`}>
            {selectedInvoice ? (
              <div className="glass-strong rounded-[20px] p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineDocumentText className="w-5 h-5 text-[var(--green)]" />
                  <h3 className="text-[14px] font-bold text-[var(--text)]">Invoice tafsilotlari</h3>
                  <button onClick={() => setSelectedInvoice(null)} className="ml-auto lg:hidden text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors">
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Talaba</span>
                    <span className="font-semibold text-[var(--text)] text-right">
                      {selectedInvoice.student?.firstName} {selectedInvoice.student?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Guruh</span>
                    <span className="font-semibold text-[var(--text)]">{selectedInvoice.group?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Jami summa</span>
                    <span className="font-semibold text-[var(--text)] tabular-nums">{formatCurrency(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">To‘langan</span>
                    <span className="font-semibold text-[var(--success)] tabular-nums">{formatCurrency(selectedInvoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Qoldiq</span>
                    <span className={`font-semibold tabular-nums ${(selectedInvoice.total_amount || 0) - (selectedInvoice.paid_amount || 0) > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                      {formatCurrency((selectedInvoice.total_amount || 0) - (selectedInvoice.paid_amount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Muddat</span>
                    <span className="font-semibold text-[var(--text)]">{formatDate(selectedInvoice.due_date)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Invoice turi</span>
                    <span className="font-semibold text-[var(--text)]">{INVOICE_TYPE_LABELS[selectedInvoice.type] || selectedInvoice.type}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Status</span>
                    <Badge status={selectedInvoice.status} />
                  </div>
                  {selectedInvoice.comment && (
                    <div className="flex justify-between py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-secondary)]">Izoh</span>
                      <span className="text-[var(--text)] text-right max-w-[200px]">{selectedInvoice.comment}</span>
                    </div>
                  )}

                  {/* Transactions (to'lov tarixi) */}
                  {selectedInvoice.transactions?.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em] mb-2">
                        To‘lov tarixi ({selectedInvoice.transactions.length})
                      </p>
                      <div className="space-y-2">
                        {selectedInvoice.transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between py-1.5 px-3 rounded-[8px]"
                            style={{ background: 'var(--surface)' }}
                          >
                            <div>
                              <span className="text-[11px] font-semibold text-[var(--text)]">
                                {formatCurrency(tx.amount)}
                              </span>
                              <span className="text-[9px] text-[var(--text-muted)] ml-2">
                                {METHOD_LABELS[tx.method] || tx.method}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge status={tx.status === 'completed' ? 'paid' : tx.status} />
                              {tx.status === 'completed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setRefundTarget(tx); setRefundReason(''); }}
                                  className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                  title="Qaytarish"
                                >
                                  <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pay button (if not fully paid) */}
                  {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                    <div className="pt-3">
                      <Button variant="primary" size="sm" className="w-full" onClick={() => openPayModal(selectedInvoice)}>
                        <HiOutlineCurrencyDollar className="w-4 h-4" />
                        {selectedInvoice.paid_amount > 0 ? 'Qolgan qismini to‘lash' : 'To‘lash'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-strong rounded-[20px] p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                <HiOutlineDocumentText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                <p className="text-[13px] text-[var(--text-secondary)]">Invoiceni tanlang</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">tafsilotlarni ko‘rish uchun</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      <Modal open={modalOpen} title="To‘lov qabul qilish" onClose={() => { if (!saving) setModalOpen(false); }}>
        <div className="space-y-4">
          <StudentAutocomplete
            students={students}
            selectedStudent={selectedStudent}
            onSelect={setSelectedStudent}
            onClear={() => setSelectedStudent(null)}
          />

          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">To‘lov usuli</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, method: m.value, splitAmounts: {} })}
                  className="px-3 py-2 rounded-[10px] text-[11px] font-semibold border transition-all"
                  style={{
                    background: formData.method === m.value ? 'var(--green)' : 'var(--surface)',
                    color: formData.method === m.value ? '#141B10' : 'var(--text-secondary)',
                    borderColor: formData.method === m.value ? 'var(--green)' : 'var(--border)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {isCombinedMethod(formData.method) ? (
            <div className="space-y-3 p-4 rounded-[16px]" style={{ background: 'var(--surface)' }}>
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em]">Summalarni kiriting</p>
              {getMethodsFromCombined(formData.method).map((m) => {
                const labels = { naqt: 'Naqt', karta: 'Karta', otkazma: "O'tkazma" };
                return (
                  <div key={m}>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">{labels[m]}</label>
                    <input
                      type="number"
                      value={formData.splitAmounts[m] || ''}
                      onChange={(e) => setFormData({ ...formData, splitAmounts: { ...formData.splitAmounts, [m]: e.target.value } })}
                      placeholder={`${labels[m]} summa...`}
                      className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--bg)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
                    />
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Jami:</span>
                <span className="text-[14px] font-bold text-[var(--text)] tabular-nums">
                  {formatCurrency(getTotalFromSplit())}
                </span>
              </div>
            </div>
          ) : (
            <Input
              label="Summa"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="1200000"
            />
          )}

          <Input
            label="Izoh"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="To‘lov sababi (ixtiyoriy)"
          />

          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handleCreatePayment} disabled={saving || !selectedStudent}>
              {saving ? 'Yuborilmoqda...' : 'To‘lovni qabul qilish'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Pay Invoice Modal ── */}
      <Modal open={payModalOpen} title="Invoiceni to‘lash" onClose={() => { if (!saving) setPayModalOpen(false); }}>
        <div className="space-y-4">
          <div className="rounded-[12px] p-3" style={{ background: 'var(--green-bg)' }}>
            <p className="text-[12px] font-semibold text-[var(--text)]">
              {selectedInvoice?.student?.firstName} {selectedInvoice?.student?.lastName}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Jami: {formatCurrency(selectedInvoice?.total_amount)} · To‘langan: {formatCurrency(selectedInvoice?.paid_amount)}
            </p>
          </div>

          <Input
            label="To‘lov summasi"
            type="number"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
            placeholder="Summani kiriting"
          />

          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">To‘lov usuli</label>
            <div className="grid grid-cols-3 gap-1.5">
              {['naqt', 'karta', 'otkazma'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayForm({ ...payForm, method: m })}
                  className="px-3 py-2 rounded-[10px] text-[11px] font-semibold border transition-all"
                  style={{
                    background: payForm.method === m ? 'var(--green)' : 'var(--surface)',
                    color: payForm.method === m ? '#141B10' : 'var(--text-secondary)',
                    borderColor: payForm.method === m ? 'var(--green)' : 'var(--border)',
                  }}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setPayModalOpen(false)} disabled={saving}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handlePayInvoice} disabled={saving || !payForm.amount || Number(payForm.amount) <= 0}>
              {saving ? 'Yuborilmoqda...' : 'To‘lash'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Refund Confirmation Modal ── */}
      <Modal open={!!refundTarget} title="To‘lovni qaytarish" onClose={() => { if (!saving) { setRefundTarget(null); setRefundReason(''); } }}>
        <div className="space-y-5">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {refundTarget ? formatCurrency(refundTarget.amount) : ''} sum miqdoridagi to‘lovni qaytarishni xohlaysizmi?
          </p>
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">
              Qaytarish sababi <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Sababni kiriting..."
              rows={3}
              className="w-full px-4 py-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors resize-none"
            />
          </div>
          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}
            >
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setRefundTarget(null); setRefundReason(''); }} disabled={saving}>Bekor qilish</Button>
            <Button variant="danger" size="sm" onClick={handleRefund} disabled={saving || !refundReason.trim()}>
              {saving ? 'Qaytarilmoqda...' : 'Qaytarish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
