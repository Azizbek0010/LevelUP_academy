import { useState, useMemo, useCallback, useEffect } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineTrash, HiOutlineCurrencyDollar, HiOutlineCalendarDays, HiOutlineChartBarSquare, HiOutlineArrowPath } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchExpenses as apiFetchExpenses, createExpense as apiCreateExpense, deleteExpense as apiDeleteExpense } from '../services/adminService.js';

const CATEGORIES = ['All', 'Rent', 'Salary', 'Materials', 'Utility', 'Other'];
const CATEGORY_COLORS = { Rent: '#3B82F6', Salary: '#2ECC71', Materials: '#F59E0B', Utility: '#E8543E', Other: '#8FA283' };

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ru-RU');
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-[12px] px-3 py-2 text-[11px]">
      <p className="font-bold text-[var(--text)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: 'Other', amount: '', spentAt: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchExpenses({ limit: 100 });
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError(err.response?.data?.message || err.message || 'Xarajatlarni yuklashda xatolik');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const filtered = useMemo(() => expenses.filter((e) => {
    if (filter !== 'All' && e.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const note = (e.note || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      if (!note.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  }), [expenses, filter, search]);

  const totalAmount = useMemo(() => filtered.reduce((sum, e) => sum + (e.amount || 0), 0), [filtered]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return filtered.filter((e) => {
      if (!e.spentAt) return false;
      const d = new Date(e.spentAt);
      return d.getMonth() === m && d.getFullYear() === y;
    }).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filtered]);
  const avgDaily = useMemo(() => expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0, [totalAmount, expenses.length]);

  const budgetData = useMemo(() => CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
    name: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    fill: CATEGORY_COLORS[cat],
  })), [expenses]);

  const openModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ category: 'Other', amount: '', spentAt: today, note: '' });
    setModalOpen(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await apiCreateExpense({
        category: formData.category,
        amount: Number(formData.amount),
        spentAt: formData.spentAt || undefined,
        note: formData.note || undefined,
      });
      setModalOpen(false);
      await loadExpenses();
    } catch (err) {
      console.error('Create expense failed:', err);
      setError(err.response?.data?.message || err.message || 'Xarajat qo\'shishda xatolik');
    } finally {
      setSaving(false);
    }
  }, [formData, loadExpenses]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await apiDeleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      await loadExpenses();
    } catch (err) {
      console.error('Delete expense failed:', err);
      setError(err.response?.data?.message || err.message || 'O\'chirishda xatolik');
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, loadExpenses]);

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold mb-4"
          style={{ background: 'rgba(232,84,62,0.12)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.2)' }}
        >
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <span className="text-[16px]">&times;</span>
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-fade-in stagger-1">
          <StatCard title="Jami xarajatlar" value={formatCurrency(totalAmount)} icon={<HiOutlineCurrencyDollar className="w-4 h-4" />} color="#E8543E" />
        </div>
        <div className="animate-fade-in stagger-2">
          <StatCard title="Bu oy" value={formatCurrency(thisMonth)} icon={<HiOutlineCalendarDays className="w-4 h-4" />} color="#F59E0B" />
        </div>
        <div className="animate-fade-in stagger-3">
          <StatCard title="O'rtacha/kun" value={formatCurrency(avgDaily)} icon={<HiOutlineChartBarSquare className="w-4 h-4" />} color="#3B82F6" />
        </div>
      </div>

      {/* Search + Filter Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            placeholder="Xarajatlarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <HiOutlineArrowPath className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={openModal}>
          <HiOutlinePlus className="w-4 h-4" />
          Xarajat qo'shish
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const count = cat === 'All' ? expenses.length : expenses.filter((e) => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
              style={{
                background: filter === cat ? 'var(--green)' : 'var(--surface)',
                color: filter === cat ? '#141B10' : 'var(--text-secondary)',
                border: `1px solid ${filter === cat ? 'var(--green)' : 'var(--border)'}`,
              }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Table */}
        <div className="glass-strong rounded-[20px] overflow-hidden min-w-0">
          {loading && expenses.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
              <p className="text-[13px] text-[var(--text-secondary)]">Xarajatlar yuklanmoqda...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8"><EmptyState title="Xarajatlar topilmadi" description={search ? 'Qidiruvni o\'zgartiring' : 'Yangi xarajat qo\'shing'} action={search ? undefined : { label: "Qo'shish", onClick: openModal }} /></div>
          ) : (
            <>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="px-5 py-3.5">Kategoriya</th>
                    <th className="px-5 py-3.5 text-right">Summa</th>
                    <th className="px-5 py-3.5">Sana</th>
                    <th className="px-5 py-3.5">Izoh</th>
                    <th className="px-5 py-3.5 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-t border-[var(--border)] text-[13px] transition-colors hover:bg-[var(--surface-hover)]">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold"
                          style={{ background: `${CATEGORY_COLORS[e.category] || '#8FA283'}20`, color: CATEGORY_COLORS[e.category] || '#8FA283' }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[var(--text)]">{formatCurrency(e.amount)}</td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)]">{formatDate(e.spentAt)}</td>
                      <td className="px-5 py-3.5 text-[var(--text-secondary)] max-w-[200px] truncate">{e.note || '—'}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setDeleteTarget(e)}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[rgba(232,84,62,0.1)] transition-all">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="glass-strong rounded-[20px] p-5 min-w-0">
          <h3 className="text-[14px] font-bold text-[var(--text)] mb-4">Budget Forecast</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={false} fill="#C6FF34" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {budgetData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.fill }} />
                  {item.name}
                </span>
                <span className="font-semibold text-[var(--text)]">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <Modal title="Xarajat qo'shish" onClose={() => { if (!saving) setModalOpen(false); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Kategoriya *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)]">
                {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Summa *" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="500000" />
            <Input label="Sana" type="date" value={formData.spentAt} onChange={(e) => setFormData({ ...formData, spentAt: e.target.value })} />
            <Input label="Izoh" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Xarajat haqida izoh" />
            {error && (
              <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
                style={{ background: 'rgba(232,84,62,0.08)' }}
              >
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Bekor qilish</Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !formData.amount}>Qo'shish</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} title="Xarajatni o'chirish" onClose={() => { if (!saving) setDeleteTarget(null); }}>
        <div className="space-y-5">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text)]">{deleteTarget?.category}</span> — {formatCurrency(deleteTarget?.amount)} xarajatni o'chirishni xohlaysizmi?
          </p>
          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}
            >
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={saving}>Bekor qilish</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
              {saving ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
