/**
 * Admin Panel Export Utilities
 * Supports: Excel (.xlsx), PDF, CSV
 * Uses: xlsx (SheetJS), jspdf + jspdf-autotable
 */

import { fmt, money, dateShort } from '../format.js';

// ═══════════════ Shared Helpers ═══════════════

/**
 * Build a flat 2D array from data + column definitions.
 * Each column: { key: string, label: string, format?: (value, row) => string }
 */
export function buildRows(data, columns) {
  const activeCols = columns.filter((c) => !c.hidden);
  const header = activeCols.map((c) => c.label);
  const rows = data.map((row, i) =>
    activeCols.map((c) => {
      const raw = getNestedValue(row, c.key);
      return c.format ? c.format(raw, row, i) : (raw ?? '—');
    })
  );
  return { header, rows };
}

/** Dot-notation access: "mentor.name" → row.mentor?.name */
function getNestedValue(obj, path) {
  return path.split('.').reduce((cur, seg) => cur?.[seg], obj);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════ Excel (.xlsx) ═══════════════

export async function exportToExcel(data, columns, filename = `export_${today()}`) {
  const XLSX = await import('xlsx');
  const { header, rows } = buildRows(data, columns);

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = header.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => String(r[colIdx] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Данные');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ═══════════════ PDF ═══════════════

export async function exportToPDF(data, columns, filename = `export_${today()}`, title = 'Отчёт') {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const dateStr = new Date().toLocaleDateString('ru-RU');
  const { header, rows } = buildRows(data, columns);

  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Дата: ${dateStr}  |  Записей: ${data.length}`, 14, 25);

  // Table
  autoTable.default(doc, {
    startY: 30,
    head: [header],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [220, 229, 212],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 251, 245] },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text(
        `LevelUp Academy  |  Стр. ${doc.internal.getCurrentPageInfo().pageNumber}`,
        pageW / 2,
        pageH - 8,
        { align: 'center' }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ═══════════════ CSV ═══════════════

export function exportToCSV(data, columns, filename = `export_${today()}`) {
  const { header, rows } = buildRows(data, columns);

  const escapeCSV = (val) => {
    const str = String(val ?? '—');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    header.map(escapeCSV).join(','),
    ...rows.map((r) => r.map(escapeCSV).join(',')),
  ].join('\n');

  // Add BOM for proper Cyrillic support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ═══════════════ Markdown (.md) ═══════════════

export function exportToMarkdown(data, columns, filename = `export_${today()}`, title = 'Отчёт') {
  const { header, rows } = buildRows(data, columns);
  const dateStr = new Date().toLocaleDateString('ru-RU');

  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`> 📅 Дата: ${dateStr}  |  📊 Записей: ${data.length}`);
  lines.push('');

  // Table header
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);

  // Table rows
  for (const row of rows) {
    const escaped = row.map((cell) => {
      const str = String(cell ?? '—');
      return str.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    });
    lines.push(`| ${escaped.join(' | ')} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('*LevelUp Academy — Exported Report*');

  const md = lines.join('\n');
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

// ═══════════════ Main Dispatcher ═══════════════

export async function exportData(format, data, columns, filename, title) {
  switch (format) {
    case 'excel':
      return exportToExcel(data, columns, filename);
    case 'pdf':
      return exportToPDF(data, columns, filename, title);
    case 'csv':
      return exportToCSV(data, columns, filename);
    case 'markdown':
      return exportToMarkdown(data, columns, filename, title);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

// ═══════════════ Page-Specific Column Definitions ═══════════════

/** Format currency for export */
const fmtMoney = (v) => v != null ? Number(v).toLocaleString('ru-RU') : '—';
const fmtDate = (v) => v ? dateShort(v) : '—';
const fmtFull = (s) => s?.fullName || [s?.firstName || s?.first_name, s?.lastName || s?.last_name].filter(Boolean).join(' ') || '—';

export const STUDENT_COLUMNS = [
  { key: 'fullName', label: 'Имя', format: (v, row) => fmtFull(row) },
  { key: 'login_code', label: 'Код', format: (v, row) => row.login_code || row.loginCode || '—' },
  { key: 'phone', label: 'Телефон' },
  { key: 'parentPhone', label: 'Тел. родителя', format: (v, row) => row.parentPhone || row.parent_phone || '—' },
  { key: 'groups', label: 'Группы', format: (v) => (v || []).map((g) => g.name).filter(Boolean).join(', ') || '—' },
  { key: 'coins', label: 'Коины', format: (v) => v != null ? v : '—' },
  { key: 'status', label: 'Статус', format: (v) => v === 'frozen' ? 'Заморожен' : 'Активен' },
  { key: 'age', label: 'Возраст' },
  { key: 'gender', label: 'Пол', format: (v) => v === 'female' ? 'Женский' : v === 'male' ? 'Мужской' : '—' },
];

export const GROUP_COLUMNS = [
  { key: 'name', label: 'Название' },
  { key: 'mentor.name', label: 'Ментор', format: (v, row) => row.mentor?.name || row.mentorName || '—' },
  { key: 'studentsCount', label: 'Студенты', format: (v, row) => String(row.studentsCount ?? row.students_count ?? row.students?.length ?? 0) },
  { key: 'maxStudents', label: 'Макс.', format: (v, row) => String(row.maxStudents || 15) },
  { key: 'isArchived', label: 'Статус', format: (v, row) => (row.isArchived ?? row.is_archived) ? 'Архив' : 'Активна' },
];

export const PAYMENT_COLUMNS = [
  { key: 'student', label: 'Студент', format: (v, row) => row.student || row.studentName || '—' },
  { key: 'group', label: 'Группа', format: (v, row) => row.group || row.groupName || '—' },
  { key: 'totalAmount', label: 'Сумма', format: (v, row) => fmtMoney(row.totalAmount || row.amount) },
  { key: 'paidAmount', label: 'Оплачено', format: (v, row) => fmtMoney(row.paidAmount || row.paid_amount) },
  { key: 'status', label: 'Статус', format: (v) => {
    const m = { paid: 'Оплачен', pending: 'Ожидает', partially_paid: 'Частично', overdue: 'Просрочен', cancelled: 'Отменён' };
    return m[v] || v || '—';
  }},
  { key: 'dueDate', label: 'Срок', format: (v, row) => fmtDate(row.dueDate || row.due_date) },
];

export const REPORT_COLUMNS = [
  { key: 'name', label: 'Группа', format: (v, row) => row.name || row.groupName || '—' },
  { key: 'students', label: 'Ученики', format: (v, row) => String(row.students ?? row.studentsCount ?? 0) },
  { key: 'revenue', label: 'Доход', format: (v) => fmtMoney(v) },
  { key: 'debt', label: 'Долг', format: (v, row) => fmtMoney(row.debt || row.outstandingDebt) },
];

export const EXPENSE_COLUMNS = [
  { key: 'category', label: 'Категория' },
  { key: 'amount', label: 'Сумма', format: (v) => fmtMoney(v) },
  { key: 'spentAt', label: 'Дата', format: (v) => fmtDate(v) },
  { key: 'note', label: 'Примечание' },
  { key: 'status', label: 'Статус', format: (v, row) => {
    const status = row.status || (row.paid ? 'paid' : row.approved ? 'approved' : 'pending');
    const m = { paid: 'Оплачен', approved: 'Одобрен', pending: 'Ожидает', rejected: 'Отклонён', cancelled: 'Отменён' };
    return m[status?.toLowerCase()] || status || '—';
  }},
  { key: 'paymentMethod', label: 'Способ оплаты', format: (v, row) => {
    const method = v || row.payment_method || row.method;
    const m = { cash: 'Наличные', card: 'Карта', transfer: 'Перевод' };
    return m[method?.toLowerCase()] || method || '—';
  }},
];

export const MENTOR_COLUMNS = [
  { key: 'firstName', label: 'Имя', format: (v, row) => fmtFull(row) },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'grade', label: 'Грейд', format: (v) => {
    if (!v) return '—';
    return v.charAt(0).toUpperCase() + v.slice(1);
  }},
  { key: 'status', label: 'Статус', format: (v) => v === 'frozen' ? 'Заморожен' : 'Активен' },
];

/** Page config registry — maps route → { columns, title, filenamePrefix } */
export const PAGE_EXPORT_CONFIG = {
  students: { columns: STUDENT_COLUMNS, title: 'Список студентов', filenamePrefix: 'студенты' },
  groups: { columns: GROUP_COLUMNS, title: 'Список групп', filenamePrefix: 'группы' },
  payments: { columns: PAYMENT_COLUMNS, title: 'Платежи', filenamePrefix: 'платежи' },
  reports: { columns: REPORT_COLUMNS, title: 'Отчёт — Доходы и долги', filenamePrefix: 'отчёт' },
  expenses: { columns: EXPENSE_COLUMNS, title: 'Отчёт по расходам', filenamePrefix: 'расходы' },
  mentors: { columns: MENTOR_COLUMNS, title: 'Список менторов', filenamePrefix: 'менторы' },
};
