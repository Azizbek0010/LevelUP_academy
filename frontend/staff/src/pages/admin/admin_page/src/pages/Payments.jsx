import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineDocumentText, HiOutlineXMark, HiOutlineChevronDown } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';

// ─── Backend model: transactions (fact payment), invoices (debt document) ───
// Tables: transactions { id, invoice_id, method(cash|card|transfer), status(completed|refunded|voided), amount, processed_by, created_at }
//          invoices { id, student_id, group_id, type(full|split|installment), status(pending|paid|overdue…), total_amount, paid_amount, due_date, period_month, comment }

const MOCK_STUDENTS = [
  { id: 's1', firstName: 'Abdulloh', lastName: 'Karimov', phone: '+998 90 123 45 67', groups: [{ id: 'g1', name: 'Frontend N13' }] },
  { id: 's2', firstName: 'Odiljon', lastName: 'Rahimov', phone: '+998 91 234 56 78', groups: [{ id: 'g2', name: 'Backend N7' }] },
  { id: 's3', firstName: 'Hamidulla', lastName: 'Sobirov', phone: '+998 93 345 67 89', groups: [{ id: 'g1', name: 'Frontend N13' }] },
  { id: 's4', firstName: 'Malika', lastName: 'Azizova', phone: '+998 90 456 78 90', groups: [{ id: 'g3', name: 'Design N2' }] },
  { id: 's5', firstName: 'Javohir', lastName: 'Toshmatov', phone: '+998 94 567 89 01', groups: [{ id: 'g2', name: 'Backend N7' }] },
  { id: 's6', firstName: 'Zarina', lastName: 'Nurmatova', phone: '+998 91 678 90 12', groups: [{ id: 'g1', name: 'Frontend N13' }] },
  { id: 's7', firstName: 'Dilmurod', lastName: 'Ergashev', phone: '+998 93 789 01 23', groups: [{ id: 'g3', name: 'Design N2' }] },
  { id: 's8', firstName: 'Sevara', lastName: 'Abdullaeva', phone: '+998 90 890 12 34', groups: [{ id: 'g2', name: 'Backend N7' }] },
  { id: 's9', firstName: 'Rustam', lastName: 'Yuldashev', phone: '+998 94 901 23 45', groups: [{ id: 'g1', name: 'Frontend N13' }] },
  { id: 's10', firstName: 'Nodira', lastName: 'Alimova', phone: '+998 91 012 34 56', groups: [{ id: 'g3', name: 'Design N2' }] },
  { id: 's11', firstName: 'Bexruz', lastName: 'Salimov', phone: '+998 93 123 45 67', groups: [{ id: 'g2', name: 'Backend N7' }] },
  { id: 's12', firstName: 'Gulnora', lastName: 'Rahimova', phone: '+998 90 234 56 78', groups: [{ id: 'g1', name: 'Frontend N13' }] },
];

const MOCK_PAYMENTS = [
  { id: 1, studentId: 's1', studentName: 'Abdulloh Karimov', amount: 1200000, date: '05.07.2026', method: 'naqt', status: 'paid', invoiceType: 'full', description: 'Iyul oyi to\'lovi', splitAmounts: null },
  { id: 2, studentId: 's2', studentName: 'Odiljon Rahimov', amount: 1200000, date: '04.07.2026', method: 'karta', status: 'paid', invoiceType: 'full', description: 'Iyul oyi to\'lovi', splitAmounts: null },
  { id: 3, studentId: 's3', studentName: 'Hamidulla Sobirov', amount: 600000, date: '01.07.2026', method: 'naqt', status: 'pending', invoiceType: 'split', description: '50% to\'lov', splitAmounts: null },
  { id: 4, studentId: 's4', studentName: 'Malika Azizova', amount: 1200000, date: '03.07.2026', method: 'otkazma', status: 'paid', invoiceType: 'full', description: 'To\'liq to\'lov', splitAmounts: null },
  { id: 5, studentId: 's5', studentName: 'Javohir Toshmatov', amount: 1200000, date: '28.06.2026', method: 'naqt', status: 'overdue', invoiceType: 'full', description: 'Iyun oyi to\'lovi', splitAmounts: null },
  { id: 6, studentId: 's6', studentName: 'Zarina Nurmatova', amount: 1200000, date: '02.07.2026', method: 'karta', status: 'paid', invoiceType: 'full', description: 'Iyul oyi to\'lovi', splitAmounts: null },
  { id: 7, studentId: 's7', studentName: 'Dilmurod Ergashev', amount: 600000, date: '30.06.2026', method: 'naqt', status: 'overdue', invoiceType: 'installment', description: 'Nasiya to\'lovi', splitAmounts: null },
  { id: 8, studentId: 's8', studentName: 'Sevara Abdullaeva', amount: 1200000, date: '06.07.2026', method: 'otkazma', status: 'pending', invoiceType: 'full', description: 'Kutilmoqda', splitAmounts: null },
];

const METHODS = [
  { value: 'naqt', label: 'Naqt' },
  { value: 'karta', label: 'Karta' },
  { value: 'otkazma', label: "O'tkazma" },
  { value: 'naqt+karta', label: 'Naqt + Karta' },
  { value: 'naqt+otkazma', label: "Naqt + O'tkazma" },
];

const METHOD_LABELS = Object.fromEntries(METHODS.map((m) => [m.value, m.label]));

function isCombinedMethod(method) {
  return ['naqt+karta', 'naqt+otkazma', 'karta+otkazma'].includes(method);
}

function getMethodsFromCombined(method) {
  return method.split('+');
}

const INVOICE_TYPE_LABELS = {
  full: 'To‘liq',
  split: 'Split',
  installment: 'Nasiya',
};

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + ' so‘m';
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
        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.phone.includes(q);
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
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ amount: '', method: 'naqt', description: '', splitAmounts: {} });

  const filtered = useMemo(() => payments.filter((p) => {
    if (filter !== 'All' && p.status !== filter.toLowerCase()) return false;
    if (search && !p.studentName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [payments, filter, search]);

  const filters = ['All', 'Paid', 'Pending', 'Overdue'];
  const filterCounts = useMemo(() => ({
    All: payments.length,
    Paid: payments.filter((p) => p.status === 'paid').length,
    Pending: payments.filter((p) => p.status === 'pending').length,
    Overdue: payments.filter((p) => p.status === 'overdue').length,
  }), [payments]);

  const openModal = () => {
    setSelectedStudent(null);
    setFormData({ amount: '', method: 'naqt', description: '', splitAmounts: {} });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedStudent) return;
    let totalAmount = 0;
    let splitAmounts = null;
    if (isCombinedMethod(formData.method)) {
      splitAmounts = {};
      const methods = getMethodsFromCombined(formData.method);
      methods.forEach((m) => {
        const val = Number(formData.splitAmounts[m] || 0);
        splitAmounts[m] = val;
        totalAmount += val;
      });
    } else {
      totalAmount = Number(formData.amount);
    }
    setPayments([
      ...payments,
      {
        id: Date.now(),
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        amount: totalAmount,
        date: new Date().toLocaleDateString('ru-RU'),
        method: formData.method,
        splitAmounts,
        status: 'paid',
        invoiceType: 'full',
        description: formData.description || 'To\'lov qabul qilindi',
      },
    ]);
    setModalOpen(false);
  };

  const getTotalFromSplit = useCallback(() => {
    if (!isCombinedMethod(formData.method)) return Number(formData.amount) || 0;
    const methods = getMethodsFromCombined(formData.method);
    return methods.reduce((sum, m) => sum + (Number(formData.splitAmounts[m] || 0)), 0);
  }, [formData]);

  return (
    <div>
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
          </div>
          <Button variant="primary" size="sm" onClick={openModal}>
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
        {/* Left: Payment table */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <EmptyState title="To‘lovlar topilmadi" description="Yangi to‘lov qo‘shing" action={{ label: 'To‘lov qilish', onClick: openModal }} />
          ) : (
            <div className="glass-strong rounded-[20px] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="px-5 py-3.5">Talaba</th>
                    <th className="px-5 py-3.5 text-right">Summa</th>
                    <th className="px-5 py-3.5">Sana</th>
                    <th className="px-5 py-3.5">Usul</th>
                    <th className="px-5 py-3.5">Turi</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPayment(p)}
                      className="border-t border-[var(--border)] text-[13px] transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                      style={selectedPayment?.id === p.id ? { background: 'rgba(198,255,52,0.06)' } : {}}
                    >
                      <td className="px-5 py-3.5 font-semibold text-[var(--text)]">{p.studentName}</td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)] tabular-nums">{p.date}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-semibold text-[var(--text-secondary)]">{METHOD_LABELS[p.method] || p.method}</span>
                        {p.splitAmounts && (
                          <div className="text-[9px] text-[var(--text-muted)] mt-0.5 space-y-0.5">
                            {Object.entries(p.splitAmounts).map(([m, val]) => {
                              const labels = { naqt: 'Naqt', karta: 'Karta', otkazma: "O'tkazma" };
                              return val > 0 ? <div key={m}>{labels[m]}: {Number(val).toLocaleString('uz-UZ')}</div> : null;
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: p.invoiceType === 'installment' ? 'rgba(245,158,11,0.14)' : 'var(--green-bg)',
                            color: p.invoiceType === 'installment' ? '#F59E0B' : 'var(--text-secondary)',
                          }}
                        >
                          {INVOICE_TYPE_LABELS[p.invoiceType]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Invoice Detail */}
        <div className={`${selectedPayment ? 'fixed inset-0 z-50 flex lg:static lg:z-auto' : 'hidden lg:block'} lg:w-[340px] lg:shrink-0`}>
          {selectedPayment && (
            <div className="fixed inset-0 bg-black/40 lg:hidden" onClick={() => setSelectedPayment(null)} />
          )}
          <div className={`relative z-10 w-full max-w-md mx-auto lg:max-w-none lg:sticky lg:top-0 ${selectedPayment ? 'px-4 py-6 lg:px-0 lg:py-0' : ''}`}>
            {selectedPayment ? (
              <div className="glass-strong rounded-[20px] p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineDocumentText className="w-5 h-5 text-[var(--green)]" />
                  <h3 className="text-[14px] font-bold text-[var(--text)]">To‘lov tafsilotlari</h3>
                  <button onClick={() => setSelectedPayment(null)} className="ml-auto lg:hidden text-[var(--text-secondary)] hover:text-[var(--text)] p-1 rounded-[8px] hover:bg-[var(--surface-hover)] transition-colors">
                    <HiOutlineXMark className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Talaba</span>
                    <span className="font-semibold text-[var(--text)] text-right">{selectedPayment.studentName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Summa</span>
                    <span className="font-semibold text-[var(--text)] tabular-nums">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Sana</span>
                    <span className="font-semibold text-[var(--text)]">{selectedPayment.date}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">To‘lov usuli</span>
                    <div className="text-right">
                      <span className="font-semibold text-[var(--text)]">{METHOD_LABELS[selectedPayment.method]}</span>
                      {selectedPayment.splitAmounts && (
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5 space-y-0.5">
                          {Object.entries(selectedPayment.splitAmounts).map(([m, val]) => {
                            const labels = { naqt: 'Naqt', karta: 'Karta', otkazma: "O'tkazma" };
                            return val > 0 ? <div key={m}>{labels[m]}: {Number(val).toLocaleString('uz-UZ')} so'm</div> : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Invoice turi</span>
                    <span className="font-semibold text-[var(--text)]">{INVOICE_TYPE_LABELS[selectedPayment.invoiceType]}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Status</span>
                    <Badge status={selectedPayment.status} />
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[var(--text-secondary)]">Izoh</span>
                    <span className="text-[var(--text)] text-right max-w-[200px]">{selectedPayment.description}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-strong rounded-[20px] p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                <HiOutlineDocumentText className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                <p className="text-[13px] text-[var(--text-secondary)]">To‘lovni tanlang</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">tafsilotlarni ko‘rish uchun</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Modal — aligns with backend POST /api/payments */}
      <Modal open={modalOpen} title="To‘lov qabul qilish" onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          {/* Student autocomplete — database dan qidirish */}
          <StudentAutocomplete
            students={MOCK_STUDENTS}
            selectedStudent={selectedStudent}
            onSelect={setSelectedStudent}
            onClear={() => setSelectedStudent(null)}
          />

          {/* Payment method selector */}
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

          {/* Amount input(s) */}
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

          {selectedStudent && (
            <div className="rounded-[12px] p-3" style={{ background: 'var(--green-bg)' }}>
              <p className="text-[11px] font-semibold text-[var(--text)]">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {selectedStudent.phone}
                {selectedStudent.groups?.[0] && ` · ${selectedStudent.groups[0].name}`}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!selectedStudent || !formData.amount}>
              To‘lovni qabul qilish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
