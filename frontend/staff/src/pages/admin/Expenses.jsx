import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Search, X, Eye, Pencil, MoreVertical,
  Banknote, CalendarDays, BarChart3, Download,
  ChevronDown, AlertTriangle, RefreshCw, SlidersHorizontal,
  Receipt, TrendingUp, DollarSign, Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { money, dateShort } from '../../format.js';
import { useAuth } from '../../auth.jsx';
import { useAdminExpenses } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// ─── Constants ───

const CATEGORIES = ['All', 'Rent', 'Salary', 'Materials', 'Utility', 'Other'];
const CATEGORY_COLORS = {
  Rent: '#3B82F6', Salary: '#2ECC71', Materials: '#F59E0B',
  Utility: '#E8543E', Other: '#8FA283',
};
const CATEGORY_COLORS_LIGHT = {
  Rent: 'rgba(59,130,246,0.12)', Salary: 'rgba(46,204,113,0.12)', Materials: 'rgba(245,158,11,0.12)',
  Utility: 'rgba(232,84,62,0.12)', Other: 'rgba(143,162,131,0.12)',
};

const STATUSES = ['All', 'Paid', 'Pending', 'Rejected', 'Cancelled'];
const STATUS_MAP = {
  paid: { bg: 'rgba(46,204,113,0.14)', color: '#2ECC71', label: "To'langan", dot: '#2ECC71' },
  pending: { bg: 'rgba(245,158,11,0.14)', color: '#F59E0B', label: 'Kutilmoqda', dot: '#F59E0B' },
  rejected: { bg: 'rgba(232,84,62,0.14)', color: '#E8543E', label: "Rad etilgan", dot: '#E8543E' },
  cancelled: { bg: 'rgba(143,162,131,0.14)', color: '#8FA283', label: 'Bekor qilingan', dot: '#8FA283' },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'oldest', label: 'Eng eski' },
  { value: 'amount-high', label: "Summa (katta)" },
  { value: 'amount-low', label: "Summa (kichik)" },
  { value: 'category', label: 'Kategoriya' },
];

const PAYMENT_METHODS = ['Naqt', 'Karta', "O'tkazma", 'Bank'];

// ─── Helpers ───

const formatCurrency = money;

function getStatusFromExpense(e) {
  if (e.status) return e.status;
  if (e.amount > 0 && e.spent_at) return 'paid';
  return 'paid';
}

function getPaymentMethod(e) {
  if (e.paymentMethod) return e.paymentMethod;
  const note = (e.note || '').toLowerCase();
  return note.includes('karta') ? 'Karta'
    : note.includes('naqt') ? 'Naqt'
    : note.includes('bank') ? 'Bank'
    : '—';
}

function getCreatedBy(e) {
  return e.createdBy || e.processedBy || e.createdByName || '—';
}

// ─── Chart Tooltip ───

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-3.5 py-2.5 text-xs shadow-lg">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tabular-nums font-semibold">{formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

// ─── Action Dropdown ───

function ActionDropdown({ expense, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="btn btn-ghost btn-xs btn-square"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-base-300 bg-base-100 shadow-xl py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onView(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <Eye size={14} />
            Ko'rish
          </button>
          <button
            onClick={() => { onEdit(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <Pencil size={14} />
            Tahrirlash
          </button>
          <div className="border-t border-base-300 my-1" />
          <button
            onClick={() => { onDelete(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 size={14} />
            O'chirish
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ───

function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || STATUS_MAP.paid;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ background: config.bg, color: config.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.dot }} />
      {config.label}
    </span>
  );
}

// ─── Category Badge ───

function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || '#8FA283';
  const bg = CATEGORY_COLORS_LIGHT[category] || 'rgba(143,162,131,0.12)';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap"
      style={{ background: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {category}
    </span>
  );
}

// ─── Select Filter ───

function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered select-sm w-full sm:w-[145px] text-xs pr-8"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
    </div>
  );
}

// ─── Stat Card ───

function StatCard({ title, value, icon: Icon, color, delta, deltaLabel }) {
  return (
    <div className="card bg-base-100 border border-base-200">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50">{title}</span>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={15} style={{ color }} />
          </span>
        </div>
        <div className="text-xl font-extrabold tabular-nums">{value}</div>
        {delta !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp
              size={12}
              className={delta >= 0 ? 'text-success' : 'text-error'}
              style={{ transform: delta >= 0 ? 'rotate(0deg)' : 'rotate(180deg)' }}
            />
            <span className={`text-[10px] font-semibold ${delta >= 0 ? 'text-success' : 'text-error'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
            </span>
            {deltaLabel && <span className="text-[9px] text-base-content/40">{deltaLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════

export default function AdminExpenses() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminExpenses();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Modal states
  const [form, setForm] = useState(null); // null | { ...form fields }
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const expenses = raw.expenses || raw.items || (Array.isArray(raw) ? raw : []);

  // ─── Filtering & Sorting ───

  const filtered = useMemo(() => {
    let result = [...expenses];

    if (filter !== 'All') {
      result = result.filter((e) => e.category === filter);
    }
    if (statusFilter !== 'All') {
      result = result.filter((e) => getStatusFromExpense(e) === statusFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        (e.note || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.title || '').toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((e) => e.spent_at && new Date(e.spent_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((e) => e.spent_at && new Date(e.spent_at) <= to);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.spent_at || 0) - new Date(b.spent_at || 0);
        case 'amount-high': return (b.amount || 0) - (a.amount || 0);
        case 'amount-low': return (a.amount || 0) - (b.amount || 0);
        case 'category': return (a.category || '').localeCompare(b.category || '');
        default: return new Date(b.spent_at || 0) - new Date(a.spent_at || 0);
      }
    });

    return result;
  }, [expenses, filter, search, statusFilter, dateFrom, dateTo, sortBy]);

  // ─── Statistics ───

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const now = new Date();
    const thisMonthExpenses = expenses.filter((e) => {
      if (!e.spent_at) return false;
      const d = new Date(e.spent_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonth = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthExpenses = expenses.filter((e) => {
      if (!e.spent_at) return false;
      const d = new Date(e.spent_at);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const trend = lastMonthTotal > 0 ? ((thisMonth - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    const pending = expenses
      .filter((e) => getStatusFromExpense(e) === 'pending')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const approved = expenses
      .filter((e) => getStatusFromExpense(e) === 'paid')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const avg = expenses.length > 0 ? Math.round(total / expenses.length) : 0;

    return { total, thisMonth, pending, approved, avg, trend, count: expenses.length };
  }, [expenses]);

  // ─── Chart Data ───

  const budgetData = useMemo(() =>
    CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
      name: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount || 0), 0),
      fill: CATEGORY_COLORS[cat],
    })),
  [expenses]);

  const monthlyData = useMemo(() => {
    const months = {};
    expenses.forEach((e) => {
      if (!e.spent_at) return;
      const d = new Date(e.spent_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + Number(e.amount || 0);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => {
        const [y, m] = key.split('-');
        const date = new Date(Number(y), Number(m) - 1);
        return {
          name: date.toLocaleDateString('ru-RU', { month: 'short' }),
          amount,
          fill: '#2ECC71',
        };
      });
  }, [expenses]);

  // ─── Handlers ───

  const openForm = (expense) => {
    if (expense) {
      setForm({
        id: expense.id,
        category: expense.category || 'Other',
        amount: String(expense.amount || ''),
        spentAt: expense.spent_at ? expense.spent_at.split('T')[0] : new Date().toISOString().split('T')[0],
        note: expense.note || '',
        paymentMethod: getPaymentMethod(expense) !== '—' ? getPaymentMethod(expense) : 'Naqt',
      });
    } else {
      setForm({
        id: null,
        category: 'Other',
        amount: '',
        spentAt: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'Naqt',
      });
    }
    setErr('');
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      await api.adminCreateExpense(token, {
        category: form.category,
        amount: Number(form.amount),
        spentAt: form.spentAt || undefined,
        note: form.note || undefined,
      });
      setForm(null);
      refetch();
    } catch (e) { setErr(e.message || 'Xatolik yuz berdi'); }
    finally { setBusy(false); }
  };

  const del = async () => {
    if (!deleteTarget) return;
    setBusy(true); setErr('');
    try {
      await api.adminDeleteExpense(token, deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch (e) { setErr(e.message || "O'chirishda xatolik"); }
    finally { setBusy(false); }
  };

  const handleExport = () => {
    const csv = [
      ['Kategoriya', 'Summa', 'Sana', 'Izoh', 'Status', "To'lov usuli"].join(','),
      ...filtered.map((e) =>
        [
          e.category,
          e.amount,
          e.spent_at ? dateShort(e.spent_at) : '',
          `"${(e.note || '').replace(/"/g, '""')}"`,
          getStatusFromExpense(e),
          getPaymentMethod(e),
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `xarajatlar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('All');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || filter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo || sortBy !== 'newest';
  const activeFilterCount = [filter !== 'All', statusFilter !== 'All', !!search, !!dateFrom, !!dateTo, sortBy !== 'newest'].filter(Boolean).length;
  const getCategoryCount = (cat) => cat === 'All' ? expenses.length : expenses.filter((e) => e.category === cat).length;
  const getStatusCount = (s) => s === 'All' ? expenses.length : expenses.filter((e) => getStatusFromExpense(e) === s.toLowerCase()).length;
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  // ═══════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6 pb-8">
      {/* ═══ Page Header ═══ */}
      <PageHeader title="Xarajatlar" subtitle="Tashkilot xarajatlarini kuzatish, boshqarish va tahlil qilish">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download size={15} />
            Eksport
          </button>
          <button
            className="btn btn-primary btn-sm gap-1"
            onClick={() => openForm(null)}
          >
            <Plus size={16} />
            Xarajat qo'shish
          </button>
        </div>
      </PageHeader>

      {/* ═══ Error Banner ═══ */}
      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={16} />
          <span>Xatolik: {error.message}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => refetch()}>
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* ═══ Statistics Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Jami xarajatlar" value={formatCurrency(stats.total)} icon={Banknote} color="#E8543E" />
        <StatCard
          title="Bu oy"
          value={formatCurrency(stats.thisMonth)}
          icon={CalendarDays}
          color="#F59E0B"
          delta={stats.trend}
          deltaLabel="o'tgan oyga nisbatan"
        />
        <StatCard title="Kutilmoqda" value={formatCurrency(stats.pending)} icon={Clock} color="#F59E0B" />
        <StatCard title="Tasdiqlangan" value={formatCurrency(stats.approved)} icon={DollarSign} color="#2ECC71" />
        <StatCard title="O'rtacha" value={formatCurrency(stats.avg)} icon={BarChart3} color="#3B82F6" />
      </div>

      {/* ═══ Filter Toolbar ═══ */}
      <div className="card bg-base-100 border border-base-200">
        <div className="card-body p-4 space-y-3">
          {/* Search + Desktop filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 w-full sm:max-w-xs">
              <Search size={14} className="opacity-50" />
              <input
                type="text"
                className="grow text-xs"
                placeholder="Xarajatlarni qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="opacity-50 hover:opacity-100">
                  <X size={14} />
                </button>
              )}
            </label>

            {/* Desktop filters */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <SelectFilter
                value={filter}
                onChange={setFilter}
                options={CATEGORIES.map((cat) => ({ value: cat, label: `${cat === 'All' ? 'Barcha' : cat} (${getCategoryCount(cat)})` }))}
              />
              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s === 'All' ? 'Barcha status' : `${STATUS_MAP[s.toLowerCase()]?.label || s} (${getStatusCount(s)})`,
                }))}
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input input-bordered input-sm w-[135px]"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input input-bordered input-sm w-[135px]"
              />
              <SelectFilter
                value={sortBy}
                onChange={setSortBy}
                options={SORT_OPTIONS}
              />
            </div>

            {/* Mobile filter toggle */}
            <div className="flex items-center gap-2 lg:hidden w-full sm:w-auto">
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className={`btn btn-xs gap-1 ${hasActiveFilters ? 'btn-primary' : 'btn-ghost'}`}
              >
                <SlidersHorizontal size={13} />
                Filtrlar
                {hasActiveFilters && (
                  <span className="badge badge-xs badge-ghost">{activeFilterCount}</span>
                )}
              </button>
              {hasActiveFilters && (
                <button className="btn btn-ghost btn-xs gap-1" onClick={clearFilters}>
                  <X size={13} />
                  Tozalash
                </button>
              )}
            </div>

            {/* Desktop clear */}
            {hasActiveFilters && (
              <button className="hidden lg:flex btn btn-ghost btn-xs gap-1" onClick={clearFilters}>
                <X size={13} />
                Tozalash
              </button>
            )}
          </div>

          {/* Mobile expanded filters */}
          {filtersExpanded && (
            <div className="lg:hidden space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <SelectFilter
                  value={filter}
                  onChange={setFilter}
                  options={CATEGORIES.map((cat) => ({ value: cat, label: `${cat === 'All' ? 'Barcha' : cat} (${getCategoryCount(cat)})` }))}
                />
                <SelectFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={STATUSES.map((s) => ({
                    value: s,
                    label: s === 'All' ? 'Barcha status' : `${STATUS_MAP[s.toLowerCase()]?.label || s} (${getStatusCount(s)})`,
                  }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="input input-bordered input-sm" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="input input-bordered input-sm" />
              </div>
              <SelectFilter value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
            </div>
          )}

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold opacity-50 uppercase tracking-wider mr-1">Kategoriya:</span>
            {CATEGORIES.map((cat) => {
              const isActive = filter === cat;
              const catColor = cat === 'All' ? '#2ECC71' : CATEGORY_COLORS[cat] || '#8FA283';
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    isActive
                      ? 'text-[#141B10] shadow-sm'
                      : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                  }`}
                  style={isActive ? { background: catColor, borderColor: catColor } : {}}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Main Content Area ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* ═══ Left: Table ═══ */}
        <div className="min-w-0">
          {isLoading && expenses.length === 0 ? (
            <SkeletonTable cols={4} />
          ) : filtered.length === 0 ? (
            <div className="card bg-base-100 border border-base-200">
              <div className="card-body items-center py-12">
                <Receipt size={48} className="opacity-20 mb-3" />
                <h3 className="font-bold text-lg">
                  {search || hasActiveFilters ? "Natija topilmadi" : "Hozircha xarajatlar yo'q"}
                </h3>
                <p className="text-sm text-base-content/50 mt-1">
                  {search || hasActiveFilters
                    ? "Boshqa qidiruv yoki filtr sozlamalarini sinab ko'ring"
                    : "Birinchi xarajatni qo'shish orqali boshlang"
                  }
                </p>
                {!search && !hasActiveFilters && (
                  <button className="btn btn-primary btn-sm gap-1 mt-4" onClick={() => openForm(null)}>
                    <Plus size={15} /> Xarajat qo'shish
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 border border-base-200">
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider opacity-60">
                      <th>Kategoriya</th>
                      <th>Izoh</th>
                      <th className="text-right">Summa</th>
                      <th className="hidden sm:table-cell">To'lov usuli</th>
                      <th>Sana</th>
                      <th className="hidden md:table-cell">Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} className="hover">
                        <td><CategoryBadge category={e.category} /></td>
                        <td className="max-w-[180px]">
                          <span className="truncate block text-sm" title={e.note || ''}>
                            {e.note || <span className="opacity-40 italic">—</span>}
                          </span>
                        </td>
                        <td className="text-right font-bold tabular-nums">{formatCurrency(e.amount)}</td>
                        <td className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-base-200 border border-base-300">
                            {getPaymentMethod(e)}
                          </span>
                        </td>
                        <td className="text-sm text-base-content/60 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} className="opacity-40" />
                            {dateShort(e.spent_at || e.created_at)}
                          </span>
                        </td>
                        <td className="hidden md:table-cell">
                          <StatusBadge status={getStatusFromExpense(e)} />
                        </td>
                        <td className="text-right">
                          <ActionDropdown
                            expense={e}
                            onView={setViewTarget}
                            onEdit={openForm}
                            onDelete={setDeleteTarget}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-base-200 bg-base-100/50">
                <span className="text-xs text-base-content/50">
                  {filtered.length} ta xarajat
                  {filtered.length !== expenses.length && (
                    <span className="opacity-60"> ({expenses.length} ta umumiy)</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Jami:</span>
                  <span className="text-sm font-extrabold tabular-nums">{formatCurrency(filteredTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Right: Chart Panel ═══ */}
        <div className="space-y-5">
          {/* Budget by Category */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Kategoriyalar bo'yicha</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-40">Byudjet</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-base-200 space-y-2.5">
                {budgetData.filter((item) => item.amount > 0).length === 0 ? (
                  <p className="text-xs text-base-content/50 text-center py-2">Xarajat ma'lumotlari mavjud emas</p>
                ) : (
                  budgetData.filter((item) => item.amount > 0).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                        <span className="text-base-content/70">{item.name}</span>
                      </div>
                      <span className="font-bold tabular-nums">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body p-5">
              <h3 className="text-sm font-bold mb-4">Oylik trend</h3>
              {monthlyData.length === 0 ? (
                <div className="h-[140px] flex items-center justify-center">
                  <p className="text-xs text-base-content/50">Trend ma'lumotlari mavjud emas</p>
                </div>
              ) : (
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                      <Bar dataKey="amount" radius={[5, 5, 0, 0]} barSize={28} fill="#2ECC71" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ View Detail Modal ═══ */}
      <dialog className={`modal ${viewTarget ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-1">Xarajat tafsilotlari</h3>
          {viewTarget && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 pb-4 border-b border-base-200">
                <CategoryBadge category={viewTarget.category} />
                <StatusBadge status={getStatusFromExpense(viewTarget)} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-base-200">
                  <span className="text-sm text-base-content/60">Summa</span>
                  <span className="text-lg font-extrabold tabular-nums">{formatCurrency(viewTarget.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-base-200">
                  <span className="text-sm text-base-content/60">Sana</span>
                  <span className="font-semibold">{dateShort(viewTarget.spent_at || viewTarget.created_at)}</span>
                </div>
                {getPaymentMethod(viewTarget) !== '—' && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-base-content/60">To'lov usuli</span>
                    <span className="font-semibold">{getPaymentMethod(viewTarget)}</span>
                  </div>
                )}
                {getCreatedBy(viewTarget) !== '—' && (
                  <div className="flex justify-between items-center py-2 border-b border-base-200">
                    <span className="text-sm text-base-content/60">Yaratgan</span>
                    <span className="font-semibold">{getCreatedBy(viewTarget)}</span>
                  </div>
                )}
                <div className="py-2">
                  <span className="text-sm text-base-content/60 block mb-1">Izoh</span>
                  <span className="text-sm">{viewTarget.note || <span className="italic opacity-50">Yo'q</span>}</span>
                </div>
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost btn-sm" onClick={() => setViewTarget(null)}>Yopish</button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-backdrop" onClick={() => setViewTarget(null)} />
      </dialog>

      {/* ═══ Add/Edit Modal ═══ */}
      <dialog className={`modal ${form ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Xarajat qo'shish</h3>
          {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 mb-2 block">Kategoriya *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                  const isActive = form?.category === cat;
                  const catColor = CATEGORY_COLORS[cat] || '#8FA283';
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        isActive ? 'text-[#141B10] shadow-sm' : 'bg-base-200 text-base-content/70 hover:bg-base-300'
                      }`}
                      style={isActive ? { background: catColor, borderColor: catColor } : {}}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 mb-1.5 block">Summa *</label>
                <input
                  className="input input-bordered w-full"
                  type="number"
                  value={form?.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 mb-1.5 block">Sana</label>
                <input
                  className="input input-bordered w-full"
                  type="date"
                  value={form?.spentAt || ''}
                  onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 mb-2 block">To'lov usuli</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: method })}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      form?.paymentMethod === method
                        ? 'bg-primary text-primary-content border-primary'
                        : 'bg-base-200 text-base-content/70 hover:bg-base-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-base-content/60 mb-1.5 block">Izoh</label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={form?.note || ''}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Xarajat haqida izoh"
                rows={2}
              />
            </div>
          </div>
          <div className="modal-action">
            <button className="btn btn-ghost btn-sm" onClick={() => setForm(null)} disabled={busy}>Bekor qilish</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={save}
              disabled={busy || !form?.amount}
            >
              {busy && <span className="loading loading-spinner loading-xs" />}
              Qo'shish
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => { if (!busy) setForm(null); }} />
      </dialog>

      {/* ═══ Delete Confirmation Modal ═══ */}
      <dialog className={`modal ${deleteTarget ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Xarajatni o'chirish</h3>
          <div className="flex items-start gap-4 mt-4">
            <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="font-bold mb-1">O'chirishni tasdiqlaysizmi?</p>
              <p className="text-sm text-base-content/60">
                <CategoryBadge category={deleteTarget?.category} />{' '}
                <span className="tabular-nums font-semibold">{formatCurrency(deleteTarget?.amount)}</span>{' '}
                xarajatni o'chirishni xohlaysizmi?
              </p>
            </div>
          </div>
          {err && <div className="alert alert-error mt-3 py-2 text-sm">{err}</div>}
          <div className="modal-action">
            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)} disabled={busy}>Bekor qilish</button>
            <button className="btn btn-error btn-sm" onClick={del} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-xs" />}
              O'chirish
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => { if (!busy) setDeleteTarget(null); }} />
      </dialog>
    </div>
  );
}
