import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Search, Plus, Trash2, DollarSign, CalendarDays, BarChart3,
  RefreshCw, MoreVertical, Eye, Pencil, X, Banknote,
  Clock, ChevronDown, AlertTriangle, Download, SlidersHorizontal,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useAdminExpenses } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SearchInput, RowSkeleton, Kpi } from '../mentor/_ui.jsx';

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
  paid: { bg: 'rgba(46,204,113,0.14)', color: '#2ECC71', label: 'Оплачен', dot: '#2ECC71' },
  pending: { bg: 'rgba(245,158,11,0.14)', color: '#F59E0B', label: 'Ожидает', dot: '#F59E0B' },
  rejected: { bg: 'rgba(232,84,62,0.14)', color: '#E8543E', label: 'Отклонён', dot: '#E8543E' },
  cancelled: { bg: 'rgba(143,162,131,0.14)', color: '#8FA283', label: 'Отменён', dot: '#8FA283' },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'amount-high', label: 'Сумма (большая)' },
  { value: 'amount-low', label: 'Сумма (малая)' },
  { value: 'category', label: 'Категория' },
];

const PAYMENT_METHODS = ['Наличные', 'Карта', 'Перевод', 'Банк'];

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('ru-RU') + ' сум';
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ru-RU');
}

function getMonthName(date) {
  return date.toLocaleDateString('ru-RU', { month: 'short' });
}

function getStatusFromExpense(e) {
  if (e.status) return e.status;
  if (e.amount > 0 && e.spentAt) return 'paid';
  return 'paid';
}

function getPaymentMethod(e) {
  if (e.paymentMethod) return e.paymentMethod;
  const note = (e.note || '').toLowerCase();
  if (note.includes('karta') || note.includes('карта')) return 'Карта';
  if (note.includes('naqt') || note.includes('наличные')) return 'Наличные';
  if (note.includes('bank') || note.includes('банк')) return 'Банк';
  if (note.includes("o'tkazma") || note.includes('перевод')) return 'Перевод';
  return '—';
}

function getCreatedBy(e) {
  return e.createdBy || e.processedBy || e.createdByName || '—';
}

// ─── Chart Tooltip ───
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="card bg-base-100 px-3.5 py-2.5 text-[11px] shadow-[0_8px_24px_var(--shadow-lg)]">
      <p className="font-bold text-base-content mb-1.5 text-[12px]">{label}</p>
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
        className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base-content/45 hover:text-base-content hover:bg-base-200 transition-all duration-200"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[170px] rounded-[12px] border border-base-300 bg-base-100 shadow-[0_8px_24px_var(--shadow-lg)] py-1.5 animate-scale-in origin-top-right"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onView(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center"><Eye className="w-4 h-4" /></span>
            Просмотр
          </button>
          <button
            onClick={() => { onEdit(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center"><Pencil className="w-4 h-4" /></span>
            Редактировать
          </button>
          <div className="border-t border-base-300 my-1" />
          <button
            onClick={() => { onDelete(expense); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-error hover:bg-[rgba(232,84,62,0.08)] transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center"><Trash2 className="w-4 h-4" /></span>
            Удалить
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
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: config.dot }} />
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap"
      style={{ background: bg, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {category}
    </span>
  );
}

// ═══════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════
export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [formData, setFormData] = useState({ category: 'Other', amount: '', spentAt: '', note: '', paymentMethod: 'Наличные' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const { token } = useAuth();

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Uses api.adminExpenses(token) from api.js → proper named method
      const res = await api.adminExpenses(token);
      const data = res.data?.data || res.data || res || {};
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError(err.response?.data?.message || err.message || 'Ошибка загрузки расходов');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

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
      result = result.filter((e) => {
        const note = (e.note || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        return note.includes(q) || cat.includes(q) || title.includes(q);
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((e) => e.spentAt && new Date(e.spentAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((e) => e.spentAt && new Date(e.spentAt) <= to);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.spentAt || 0) - new Date(b.spentAt || 0);
        case 'amount-high': return (b.amount || 0) - (a.amount || 0);
        case 'amount-low': return (a.amount || 0) - (b.amount || 0);
        case 'category': return (a.category || '').localeCompare(b.category || '');
        default: return new Date(b.spentAt || 0) - new Date(a.spentAt || 0);
      }
    });

    return result;
  }, [expenses, filter, search, statusFilter, dateFrom, dateTo, sortBy]);

  // ─── Statistics ───
  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const now = new Date();
    const thisMonthExpenses = expenses.filter((e) => {
      if (!e.spentAt) return false;
      const d = new Date(e.spentAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonth = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthExpenses = expenses.filter((e) => {
      if (!e.spentAt) return false;
      const d = new Date(e.spentAt);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const trend = lastMonthTotal > 0 ? ((thisMonth - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    const pendingAmount = expenses
      .filter((e) => getStatusFromExpense(e) === 'pending')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const approvedAmount = expenses
      .filter((e) => getStatusFromExpense(e) === 'paid')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const avgAmount = expenses.length > 0 ? Math.round(total / expenses.length) : 0;

    return { total, thisMonth, pendingAmount, approvedAmount, avgAmount, trend, count: expenses.length, thisMonthCount: thisMonthExpenses.length };
  }, [expenses]);

  // ─── Chart Data ───
  const budgetData = useMemo(() => CATEGORIES.filter((c) => c !== 'All').map((cat) => ({
    name: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    fill: CATEGORY_COLORS[cat],
  })), [expenses]);

  const monthlyData = useMemo(() => {
    const months = {};
    expenses.forEach((e) => {
      if (!e.spentAt) return;
      const d = new Date(e.spentAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + (e.amount || 0);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, amount]) => {
        const [y, m] = key.split('-');
        const date = new Date(Number(y), Number(m) - 1);
        return { name: getMonthName(date), amount, fill: 'var(--green)' };
      });
  }, [expenses]);

  // ─── Modal handlers ───
  const openModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ category: 'Other', amount: '', spentAt: today, note: '', paymentMethod: 'Наличные' });
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openViewModal = (expense) => {
    setViewTarget(expense);
    setViewModalOpen(true);
  };

  const openEditModal = (expense) => {
    setFormData({
      category: expense.category || 'Other',
      amount: String(expense.amount || ''),
      spentAt: expense.spentAt ? expense.spentAt.split('T')[0] : new Date().toISOString().split('T')[0],
      note: expense.note || '',
      paymentMethod: getPaymentMethod(expense) !== '—' ? getPaymentMethod(expense) : 'Наличные',
    });
    setEditingId(expense.id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        category: formData.category,
        amount: Number(formData.amount),
        spentAt: formData.spentAt || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        note: formData.note || undefined,
      };

      if (editingId) {
        // Backendda hali PATCH /admin/expenses/:id yo'q — Karisga aytish kerak
        await api.adminUpdateExpense(token, editingId, body);
      } else {
        await api.adminCreateExpense(token, body);
      }
      setEditingId(null);
      setModalOpen(false);
      await loadExpenses();
    } catch (err) {
      console.error('Save expense failed:', err);
      const msg = err.response?.data?.message || err.message;
      if (editingId && err.status === 404) {
        setError("Редактирование пока не работает — на бэкенде нет PATCH. Сообщите Карису.");
      } else {
        setError(msg || "Ошибка сохранения расхода");
      }
    } finally {
      setSaving(false);
    }
  }, [editingId, formData, loadExpenses, token]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      // Uses api.adminDeleteExpense(token, id) from api.js
      await api.adminDeleteExpense(token, deleteTarget.id);
      setDeleteTarget(null);
      await loadExpenses();
    } catch (err) {
      console.error('Delete expense failed:', err);
      setError(err.response?.data?.message || err.message || "Ошибка удаления");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, loadExpenses, token]);

  const filteredTotal = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const dateStr = new Date().toLocaleDateString('ru-RU');

      // Header
      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text('Отчёт по расходам', 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Дата: ${dateStr}  |  Итого: ${formatCurrency(filteredTotal)}  |  Кол-во: ${filtered.length}`, 14, 25);

      // Table
      const statusLabel = (s) => {
        const m = { paid: 'Оплачен', pending: 'Ожидает', rejected: 'Отклонён', cancelled: 'Отменён' };
        return m[s?.toLowerCase()] || s || '—';
      };

      autoTable.default(doc, {
        startY: 30,
        head: [['#', 'Категория', 'Сумма', 'Дата', 'Примечание', 'Статус', 'Способ оплаты']],
        body: filtered.map((e, i) => [
          i + 1,
          e.category || '—',
          Number(e.amount || 0).toLocaleString('ru-RU'),
          e.spentAt ? new Date(e.spentAt).toLocaleDateString('ru-RU') : '—',
          e.note || '—',
          statusLabel(getStatusFromExpense(e)),
          getPaymentMethod(e),
        ]),
        foot: [['', 'ИТОГО', formatCurrency(filteredTotal), '', '', '', '']],
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: [30, 30, 30],
          lineColor: [220, 229, 212],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [67, 137, 62],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        footStyles: {
          fillColor: [245, 248, 241],
          textColor: [30, 30, 30],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [248, 251, 245] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 28 },
          2: { cellWidth: 32, halign: 'right' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 26, halign: 'center' },
          6: { cellWidth: 24, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer on every page
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(7);
          doc.setTextColor(160, 160, 160);
          doc.text(`LevelUp Academy  |  Стр. ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW / 2, pageH - 8, { align: 'center' });
        },
      });

      doc.save(`расходы_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  }, [filtered, filteredTotal]);

  const clearFilters = () => {
    setSearch('');
    setFilter('All');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || filter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo || sortBy !== 'newest';

  const getCategoryCount = (cat) =>
    cat === 'All' ? expenses.length : expenses.filter((e) => e.category === cat).length;

  const getStatusCount = (status) =>
    status === 'All' ? expenses.length : expenses.filter((e) => getStatusFromExpense(e) === status.toLowerCase()).length;

  // ═══════════════════════════════════════════
  //  Render
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-6 page-enter pb-8">

      {/* ═══ Error Banner ═══ */}
      {error && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-[16px] text-[13px] font-semibold animate-slide-up"
          style={{ background: 'rgba(232,84,62,0.10)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.18)' }}
        >
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(232,84,62,0.12)' }}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="flex-1">{error}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => loadExpenses()}
              className="flex items-center gap-1.5 px-3 h-7 rounded-[8px] text-[11px] font-semibold hover:bg-[rgba(232,84,62,0.12)] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Обновить
            </button>
            <button onClick={() => setError(null)} className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-[rgba(232,84,62,0.1)] transition-all shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[28px] font-extrabold text-base-content tracking-[-0.035em] leading-none">Расходы</h1>
          </div>
          <p className="text-[13px] text-base-content/70">
            Учёт, управление и анализ расходов организации
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="btn btn-ghost btn-sm gap-1.5" onClick={handleExport} disabled={exporting || filtered.length === 0}>
            <Download className="w-4 h-4" />
            {exporting ? 'Экспорт...' : 'Экспорт'}
          </button>
          <button className="btn btn-primary btn-sm gap-1.5" onClick={openModal}>
            <Plus className="w-4 h-4" />
            Добавить расход
          </button>
        </div>
      </div>

      {/* ═══ Statistics Cards ═══ */}
      {/* Раньше это была локальная копия KPI-плитки, и только у «Bu oy» была
          строка тренда «+0.0% o'tgan oyga nisbatan» — из-за неё одна карточка
          оказывалась выше остальных четырёх, и ряд ехал. Теперь общий Kpi без
          тренда: все плитки одной высоты, как в панели ментора. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi Icon={Banknote} title="Все расходы" value={formatCurrency(stats.total)} tone="neutral" />
        <Kpi Icon={CalendarDays} title="В этом месяце" value={formatCurrency(stats.thisMonth)} tone="neutral" />
        <Kpi Icon={Clock} title="Ожидает" value={formatCurrency(stats.pendingAmount)} tone="warning" />
        <Kpi Icon={DollarSign} title="Одобрено" value={formatCurrency(stats.approvedAmount)} tone="success" />
        <Kpi Icon={BarChart3} title="Средний расход" value={formatCurrency(stats.avgAmount)} tone="neutral" />
      </div>

      {/* ═══ Filter Toolbar ═══ */}
      <div className="card bg-base-100 overflow-hidden card-hover-premium">
        {/* Primary filter row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/45 pointer-events-none" />
            <input
              placeholder="Поиск расходов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-10 rounded-[12px] border border-base-300 bg-base-100 text-[13px] text-base-content outline-none placeholder:text-base-content/45 hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/45 hover:text-base-content transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Desktop quick filters */}
          <div className="hidden lg:flex items-center gap-2.5 flex-wrap">
            <SelectFilter
              value={filter}
              onChange={setFilter}
              options={CATEGORIES.map((cat) => ({ value: cat, label: `${cat} (${getCategoryCount(cat)})` }))}
              placeholder="Категория"
            />
            <SelectFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUSES.map((s) => ({
                value: s,
                label: s === 'All' ? 'Все статусы' : `${STATUS_MAP[s.toLowerCase()]?.label || s} (${getStatusCount(s)})`,
              }))}
              placeholder="Статус"
            />
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="appearance-none w-[140px] h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:light] cursor-pointer"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="appearance-none w-[140px] h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:light] cursor-pointer"
              />
            </div>
            <SelectFilter
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              placeholder="Сортировка"
            />
          </div>

          {/* Mobile filter toggle + clear */}
          <div className="flex items-center gap-2 lg:hidden flex-nowrap">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] border text-[12px] font-semibold transition-all shrink-0 ${
                filtersExpanded || hasActiveFilters
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-base-300 text-base-content/70 hover:border-base-content/45'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary text-[#141B10] text-[9px] font-bold flex items-center justify-center">
                  {[filter !== 'All', statusFilter !== 'All', !!search, !!dateFrom, !!dateTo, sortBy !== 'newest'].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Desktop clear filters — moved to category pills row */}
        </div>

        {/* Mobile expanded filters */}
        {filtersExpanded && (
          <div className="px-4 pb-4 lg:hidden space-y-2.5 animate-slide-up">
            <div className="grid grid-cols-2 gap-2.5">
              <SelectFilter
                value={filter}
                onChange={setFilter}
                options={CATEGORIES.map((cat) => ({ value: cat, label: `${cat} (${getCategoryCount(cat)})` }))}
                placeholder="Категория"
              />
              <SelectFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s === 'All' ? 'Все статусы' : `${STATUS_MAP[s.toLowerCase()]?.label || s} (${getStatusCount(s)})`,
                }))}
                placeholder="Статус"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="С"
                className="w-full h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary [color-scheme:light] transition-all"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="По"
                className="w-full h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[12px] text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary [color-scheme:light] transition-all"
              />
            </div>
            <SelectFilter
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              placeholder="Сортировка"
            />
          </div>
        )}

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap px-4 pb-4">
          <span className="text-[9px] font-bold text-base-content/45 uppercase tracking-[0.08em] mr-0.5">Категория:</span>
          {CATEGORIES.map((cat) => {
            const isActive = filter === cat;
            const catColor = cat === 'All' ? 'var(--green)' : CATEGORY_COLORS[cat] || '#8FA283';
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-[#141B10] shadow-sm'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                }`}
                style={{
                  background: isActive ? catColor : 'var(--surface)',
                  border: `1px solid ${isActive ? catColor : 'var(--border)'}`,
                }}
              >
                {cat}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[11px] font-semibold text-base-content/45 hover:text-base-content hover:bg-base-200 transition-all ml-auto shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* ═══ Main Content Area ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* ═══ Left: Table ═══ */}
        <div className="min-w-0">
          {loading && expenses.length === 0 ? (
            <div className="card bg-base-100 overflow-hidden">
              <div className="p-5 border-b border-base-300">
                <div className="flex gap-6">
                  <div className="skeleton h-3 w-24 rounded-[6px]" />
                  <div className="skeleton h-3 w-32 rounded-[6px]" />
                  <div className="skeleton h-3 w-20 rounded-[6px]" />
                  <div className="skeleton h-3 w-20 rounded-[6px]" />
                  <div className="skeleton h-3 w-24 rounded-[6px]" />
                  <div className="skeleton h-3 w-16 rounded-[6px]" />
                </div>
              </div>
              <div className="p-5 space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="skeleton h-4 w-24 rounded-[6px]" />
                    <div className="skeleton h-4 w-32 rounded-[6px]" />
                    <div className="skeleton h-4 w-20 rounded-[6px]" />
                    <div className="skeleton h-4 w-20 rounded-[6px]" />
                    <div className="skeleton h-4 w-24 rounded-[6px]" />
                    <div className="skeleton h-4 w-8 rounded-[6px]" />
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card bg-base-100">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-base-100 flex items-center justify-center mb-4">
                  <Banknote className="w-8 h-8 text-base-content/45" />
                </div>
                <h3 className="text-[15px] font-bold text-base-content mb-1.5">
                  {search || hasActiveFilters ? 'Ничего не найдено' : 'Пока нет расходов'}
                </h3>
                <p className="text-[12px] text-base-content/70 max-w-[280px] mb-5">
                  {search || hasActiveFilters ? 'Попробуйте изменить параметры поиска или фильтров' : 'Добавьте первый расход, чтобы начать'}
                </p>
                {!search && !hasActiveFilters && (
                  <button className="btn btn-primary btn-sm gap-1.5" onClick={openModal}>
                    <Plus className="w-4 h-4" />
                    Добавить расход
                  </button>
                )}
                {!search && !hasActiveFilters && (
                  <div className="mt-6 opacity-20">
                    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="15" y="25" width="110" height="55" rx="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <line x1="15" y1="42" x2="125" y2="42" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="45" cy="58" r="5" fill="currentColor" opacity="0.3" />
                      <circle cx="70" cy="52" r="7" fill="currentColor" opacity="0.5" />
                      <circle cx="95" cy="62" r="4" fill="currentColor" opacity="0.2" />
                      <line x1="35" y1="72" x2="35" y2="82" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="70" y1="72" x2="70" y2="82" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="105" y1="72" x2="105" y2="82" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 overflow-hidden">
              {/* Table wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-[0.07em] text-base-content/45 bg-base-100">
                      <th className="px-5 py-4">Категория</th>
                      <th className="px-5 py-4">Примечание</th>
                      <th className="px-5 py-4 text-right">Сумма</th>
                      <th className="px-5 py-4">Способ оплаты</th>
                      <th className="px-5 py-4">Дата</th>
                      <th className="px-5 py-4">Статус</th>
                      <th className="px-5 py-4 hidden md:table-cell">Создал</th>
                      <th className="px-5 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, idx) => (
                      <tr
                        key={e.id}
                        className="group border-t border-base-300 text-[13px] transition-all duration-150 hover:bg-base-200"
                        style={{ animationDelay: `${idx * 0.025}s` }}
                      >
                        <td className="px-5 py-4">
                          <CategoryBadge category={e.category} />
                        </td>
                        <td className="px-5 py-4 max-w-[220px]">
                          <span className="text-base-content font-medium truncate block" title={e.note || ''}>
                            {e.note || <span className="text-base-content/45 italic">—</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-base-content tabular-nums whitespace-nowrap text-[14px]">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] font-medium text-base-content/70 bg-base-100 border border-base-300">
                            {getPaymentMethod(e)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-base-content/70 tabular-nums whitespace-nowrap text-[12px]">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3 text-base-content/45" />
                            {formatDate(e.spentAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={getStatusFromExpense(e)} />
                        </td>
                        <td className="px-5 py-4 text-base-content/70 text-[12px] hidden md:table-cell">
                          {getCreatedBy(e)}
                        </td>
                        <td className="px-5 py-4">
                          <ActionDropdown
                            expense={e}
                            onView={openViewModal}
                            onEdit={openEditModal}
                            onDelete={(exp) => { setDeleteTarget(exp); setError(null); }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-base-300 bg-base-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-base-content/45">
                    {filtered.length} расходов
                  </span>
                  {filtered.length !== expenses.length && (
                    <span className="text-[10px] text-base-content/45 opacity-60">
                      ({expenses.length} всего)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-base-content/45 uppercase tracking-[0.06em]">Итого:</span>
                  <span className="text-[13px] font-extrabold text-base-content tabular-nums">
                    {formatCurrency(filteredTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && expenses.length > 0 && (
            <div className="flex items-center justify-center gap-2.5 py-4 text-[12px] text-base-content/45">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Обновление...
            </div>
          )}
        </div>

        {/* ═══ Right: Chart Panel ═══ */}
        <div className="space-y-5">
          {/* Budget by Category */}
          <div className="card bg-base-100 p-5 card-hover-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-base-content">По категориям</h3>
              <span className="text-[9px] font-bold text-base-content/45 uppercase tracking-[0.08em]">Бюджет</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-base-300 space-y-2.5">
              {budgetData.filter((item) => item.amount > 0).length === 0 ? (
                <p className="text-[11px] text-base-content/45 text-center py-2">Данные о расходах отсутствуют</p>
              ) : (
                budgetData.filter((item) => item.amount > 0).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] group/chart">
                    <div className="flex items-center gap-2.5 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.fill }} />
                      <span className="text-base-content/70 group-hover/chart:text-base-content transition-colors">{item.name}</span>
                    </div>
                    <span className="font-bold text-base-content tabular-nums">{formatCurrency(item.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card bg-base-100 p-5 card-hover-premium">
            <h3 className="text-[14px] font-bold text-base-content mb-5">Тренд по месяцам</h3>
            {monthlyData.length === 0 ? (
              <div className="h-[140px] flex items-center justify-center">
                <p className="text-[11px] text-base-content/45">Данные о тренде отсутствуют</p>
              </div>
            ) : (
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
                    <Bar dataKey="amount" radius={[5, 5, 0, 0]} barSize={28} isAnimationActive={false} fill="var(--green)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ View Detail Modal ═══ */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setViewModalOpen(false); setViewTarget(null); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="modal-box card bg-base-100 max-w-lg relative z-10" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => { setViewModalOpen(false); setViewTarget(null); }}><X className="w-4 h-4" /></button>
          <h3 className="font-bold text-[16px] text-base-content mb-4">Xarajat tafsilotlari</h3>
          {viewTarget && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <CategoryBadge category={viewTarget.category} />
                <StatusBadge status={getStatusFromExpense(viewTarget)} />
              </div>

              <div className="space-y-0">
                <div className="flex justify-between items-center py-3 border-b border-base-300">
                  <span className="text-[12px] text-base-content/70 font-medium">Summa</span>
                  <span className="text-[18px] font-extrabold text-base-content tabular-nums">{formatCurrency(viewTarget.amount)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-base-300">
                  <span className="text-[12px] text-base-content/70 font-medium">Sana</span>
                  <span className="text-[13px] font-semibold text-base-content">{formatDate(viewTarget.spentAt)}</span>
                </div>
                {getPaymentMethod(viewTarget) !== '—' && (
                  <div className="flex justify-between items-center py-3 border-b border-base-300">
                    <span className="text-[12px] text-base-content/70 font-medium">To'lov usuli</span>
                    <span className="text-[13px] font-semibold text-base-content">{getPaymentMethod(viewTarget)}</span>
                  </div>
                )}
                {getCreatedBy(viewTarget) !== '—' && (
                  <div className="flex justify-between items-center py-3 border-b border-base-300">
                    <span className="text-[12px] text-base-content/70 font-medium">Yaratgan</span>
                    <span className="text-[13px] font-semibold text-base-content">{getCreatedBy(viewTarget)}</span>
                  </div>
                )}
                <div className="flex justify-between items-start py-3">
                  <span className="text-[12px] text-base-content/70 font-medium pt-0.5">Izoh</span>
                  <span className="text-[13px] text-base-content text-right max-w-[250px] leading-relaxed">{viewTarget.note || <span className="text-base-content/45 italic">Yo'q</span>}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-base-300">
                <button className="btn btn-ghost btn-sm" onClick={() => { setViewModalOpen(false); setViewTarget(null); }}>
                  Yopish
                </button>
                <button className="btn btn-primary btn-sm gap-1.5" onClick={() => { setViewModalOpen(false); setViewTarget(null); openEditModal(viewTarget); }}>
                  <Pencil className="w-4 h-4" />
                  Tahrirlash
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* ═══ Add/Edit Modal ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { if (!saving) setModalOpen(false); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="modal-box card bg-base-100 max-w-lg relative z-10" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" disabled={saving} onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></button>
          <h3 className="font-bold text-[16px] text-base-content mb-4">{editingId ? 'Xarajatni tahrirlash' : 'Xarajat qo\'shish'}</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-base-content/70 mb-2 uppercase tracking-[0.06em]">Kategoriya *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                  const isActive = formData.category === cat;
                  const catColor = CATEGORY_COLORS[cat] || '#8FA283';
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className="px-3 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200"
                      style={{
                        background: isActive ? catColor : 'var(--surface)',
                        color: isActive ? '#141B10' : 'var(--text-secondary)',
                        borderColor: isActive ? catColor : 'var(--border)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-base-content/70 mb-2 uppercase tracking-[0.06em]">Summa *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="500000"
                  className="w-full h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[13px] text-base-content outline-none placeholder:text-base-content/45 hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-base-content/70 mb-2 uppercase tracking-[0.06em]">Sana</label>
                <input
                  type="date"
                  value={formData.spentAt}
                  onChange={(e) => setFormData({ ...formData, spentAt: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[13px] text-base-content outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 [color-scheme:light]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-base-content/70 mb-2 uppercase tracking-[0.06em]">To'lov usuli</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                    className="px-4 py-2.5 rounded-[12px] text-[12px] font-semibold border transition-all duration-200"
                    style={{
                      background: formData.paymentMethod === method ? 'var(--green)' : 'var(--surface)',
                      color: formData.paymentMethod === method ? '#141B10' : 'var(--text-secondary)',
                      borderColor: formData.paymentMethod === method ? 'var(--green)' : 'var(--border)',
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-base-content/70 mb-2 uppercase tracking-[0.06em]">Izoh</label>
              <input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Xarajat haqida izoh"
                className="w-full h-10 px-3.5 rounded-[12px] border border-base-300 bg-base-100 text-[13px] text-base-content outline-none placeholder:text-base-content/45 hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              />
            </div>

            {error && (
              <div
                className="text-[12px] text-error font-semibold rounded-[12px] px-4 py-3 flex items-center gap-2.5"
                style={{ background: 'rgba(232,84,62,0.08)', border: '1px solid rgba(232,84,62,0.15)' }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)} disabled={saving}>Bekor qilish</button>
              <button className="btn btn-primary btn-sm gap-1.5" onClick={handleSave} disabled={saving || !formData.amount}>
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saqlanmoqda...
                  </span>
                ) : editingId ? "Saqlash" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { if (!saving) setDeleteTarget(null); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="modal-box card bg-base-100 max-w-md relative z-10" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" disabled={saving} onClick={() => setDeleteTarget(null)}><X className="w-4 h-4" /></button>
          <h3 className="font-bold text-[16px] text-base-content mb-4">Xarajatni o'chirish</h3>
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-[14px] bg-[rgba(232,84,62,0.12)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-base-content mb-1.5">O'chirishni tasdiqlaysizmi?</p>
                <p className="text-[12px] text-base-content/70 leading-relaxed">
                  <CategoryBadge category={deleteTarget?.category} />{' '}
                  <span className="tabular-nums font-semibold text-base-content">{formatCurrency(deleteTarget?.amount)}</span>{' '}
                  xarajatni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="text-[12px] text-error font-semibold rounded-[12px] px-4 py-3 flex items-center gap-2.5"
                style={{ background: 'rgba(232,84,62,0.08)', border: '1px solid rgba(232,84,62,0.15)' }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-base-300">
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(null)} disabled={saving}>Bekor qilish</button>
              <button className="btn btn-error btn-sm gap-1.5 text-white" onClick={handleDelete} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    O'chirilmoqda...
                  </span>
                ) : "O'chirish"}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Select Filter ───
function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full sm:w-[145px] h-10 px-3.5 pr-9 rounded-[12px] border border-base-300 bg-base-100 text-[12px] font-semibold text-base-content/70 outline-none hover:border-base-content/45 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/45 pointer-events-none" />
    </div>
  );
}
