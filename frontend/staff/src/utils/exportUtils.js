/**
 * Admin Panel Export Utilities
 * Supports: Excel (.xlsx), PDF
 * Uses: xlsx-js-style, jspdf + jspdf-autotable
 *
 * Money and counts go to Excel as real Numbers (so SUM/sort work) and to PDF as
 * formatted strings — see buildRows({ raw }).
 */

import { fmt, money, dateShort } from '../format.js';

// ═══════════════ Shared Helpers ═══════════════

/**
 * Build a flat 2D array from data + column definitions.
 *
 * Each column: {
 *   key: string,
 *   label: string,
 *   format?: (value, row, index) => string,   // display text (PDF, and Excel text cells)
 *   type?: 'number',                          // Excel writes a real number, not text
 *   value?: (row) => number,                  // how to read that number off the row
 * }
 *
 * @param {object} [opts]
 * @param {boolean} [opts.raw]  true → numeric columns return real Numbers (Excel).
 *                              false → everything is display text (PDF).
 *
 * Why the split: Excel must receive `1500000`, not the string "1 500 000".
 * A formatted string lands in the sheet as text, so СУММ returns 0 and sorting
 * goes alphabetical. PDF has no such notion — it only ever draws text.
 */
export function buildRows(data, columns, { raw = false } = {}) {
  const activeCols = columns.filter((c) => !c.hidden);
  const header = activeCols.map((c) => c.label);
  const rows = data.map((row, i) =>
    activeCols.map((c) => {
      if (raw && c.type === 'number') {
        const n = c.value ? c.value(row) : toNumber(getNestedValue(row, c.key));
        return Number.isFinite(n) ? n : null;
      }
      const value = getNestedValue(row, c.key);
      return c.format ? c.format(value, row, i) : (value ?? '—');
    })
  );
  return { header, rows, activeCols };
}

/** Dot-notation access: "mentor.name" → row.mentor?.name */
function getNestedValue(obj, path) {
  return path.split('.').reduce((cur, seg) => cur?.[seg], obj);
}

/**
 * Coerce a cell value to a number. Handles already-formatted strings
 * ("1 500 000" with NBSP separators) as a fallback, so a column that gains a
 * `type: 'number'` without a `value()` still exports as a number.
 */
function toNumber(v) {
  if (typeof v === 'number') return v;
  if (v == null || v === '' || v === '—') return null;
  // \s covers the NBSP (U+00A0) that Intl.NumberFormat('ru-RU') uses as its
  // thousands separator, plus thin/narrow spaces — verified, not assumed.
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Organization name for exported documents (PDF footer, CSV headers).
 * In mock mode the org lives in localStorage.mock_organization and is updated
 * by Super Admin Settings (PATCH /super/organization). With a live backend the
 * org name is not part of publicUser() yet, so we keep the brand fallback.
 */
export function getOrgName() {
  try {
    const org = JSON.parse(localStorage.getItem('mock_organization'));
    if (org?.name) return org.name;
  } catch { /* corrupted/absent value — fall through */ }
  return 'LevelUp Academy';
}

/** Filename-safe slug from the org name, e.g. "LevelUp Academy" → "levelup-academy" */
export function orgSlug() {
  return getOrgName().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
}

// ═══════════════ Excel (.xlsx) ═══════════════

export async function exportToExcel(data, columns, filename = `export_${today()}`) {
  const XLSX = await import('xlsx-js-style');
  // raw: numeric columns come back as real Numbers so Excel can sum/sort them
  const { header, rows, activeCols } = buildRows(data, columns, { raw: true });

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // ── Styling: brand header (green), theme-aware data cells ──
  //
  // Data cells must follow the VIEWER's Excel theme (light or dark), not ours.
  // Leaving the fill off was already right, but the text colour was pinned to
  // rgb 1F2937 — Excel renders an explicit rgb literally, so on a dark sheet
  // that was near-black text on a near-black background: unreadable.
  //
  // theme 1 is Excel's "Text 1" slot, the colour Excel itself flips between
  // black and white with the workbook theme. Verified against the written
  // styles.xml: the library emits <color theme="1"/> rather than baking an rgb.
  //
  // Borders can't use the same trick: theme index 0 ("Background 1") is falsy,
  // so xlsx-js-style drops the colour entirely and the border loses its style.
  // A neutral mid-grey is the honest choice — it reads as a quiet gridline on a
  // white sheet and on a dark one, without depending on theme resolution.
  const HEADER_FILL = '40833B';      // app --primary (LevelUp brand green)
  // The header keeps explicit white text: it sits on the fixed green brand
  // fill, so it must not flip to black when the viewer is in dark mode.
  const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 };
  const BODY_FONT = { color: { theme: 1 }, sz: 10 };
  const NUM_FMT = '#,##0';           // 1500000 → 1 500 000, still a number
  const BORDER_COLOR = { rgb: '9CA3AF' };  // neutral grey, visible either way
  const BORDER = {
    top:  { style: 'thin', color: BORDER_COLOR },
    bottom: { style: 'thin', color: BORDER_COLOR },
    left: { style: 'thin', color: BORDER_COLOR },
    right: { style: 'thin', color: BORDER_COLOR },
  };

  header.forEach((_, cIdx) => {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: cIdx })];
    if (!cell) return;
    cell.s = {
      fill: { fgColor: { rgb: HEADER_FILL }, patternType: 'solid' },
      font: HEADER_FONT,
      alignment: { horizontal: 'center', vertical: 'center' },
      border: BORDER,
    };
  });

  rows.forEach((row, rIdx) => {
    row.forEach((_, cIdx) => {
      const cell = ws[XLSX.utils.encode_cell({ r: rIdx + 1, c: cIdx })];
      if (!cell) return;
      const isNumber = activeCols[cIdx]?.type === 'number' && cell.t === 'n';
      // No fill at all → the sheet keeps the viewer's background, light or dark
      cell.s = {
        font: BODY_FONT,
        alignment: { vertical: 'middle', horizontal: isNumber ? 'right' : 'left' },
        border: BORDER,
        ...(isNumber ? { numFmt: NUM_FMT } : {}),
      };
      if (isNumber) cell.z = NUM_FMT;
    });
  });

  // Sort/filter dropdowns on the header row.
  // NOTE: a frozen header row is NOT possible here — xlsx-js-style@1.2.0 writes
  // <sheetView> self-closing and never emits a <pane> element, so the usual
  // ws['!freeze'] = { ySplit: 1 } is silently ignored. Autofilter gives the user
  // the practical part (sorting and filtering) without swapping the library.
  if (header.length) {
    ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(header.length - 1)}1` };
  }

  // Auto-size columns
  const colWidths = header.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => {
        const v = r[colIdx];
        if (typeof v === 'number') return new Intl.NumberFormat('ru-RU').format(v).length;
        return String(v ?? '').length;
      })
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Данные');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ═══════════════ PDF ═══════════════

/**
 * Leading bytes that mark a real font file.
 *
 * This check exists because it already went wrong: until 2026-08-10 both
 * public/fonts/DejaVuSans*.ttf were GitHub 404 HTML pages (they started with
 * CRLF and `<!DOCTYPE html>`) committed as if they were fonts. fetch() returned
 * 200 for them, so `res.ok` was true, the code registered the garbage and set
 * the font name — then jsPDF quietly kept helvetica and every Cyrillic glyph in
 * every exported PDF came out broken, for weeks, with nothing in the logs.
 * Validating the magic bytes turns that silent failure into a visible one.
 */
const FONT_MAGIC = [
  [0x00, 0x01, 0x00, 0x00], // TrueType outlines
  [0x74, 0x72, 0x75, 0x65], // 'true'
  [0x74, 0x74, 0x63, 0x66], // 'ttcf' — font collection
  [0x4f, 0x54, 0x54, 0x4f], // 'OTTO' — CFF outlines
];

function isFontBinary(bytes) {
  return bytes.length >= 4 && FONT_MAGIC.some((sig) => sig.every((b, i) => bytes[i] === b));
}

/** btoa needs a string; chunk it — one fromCharCode per byte crawls on a 750 KB font. */
function bytesToBase64(bytes) {
  const CHUNK = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Register DejaVuSans with jsPDF so Cyrillic renders.
 * Returns the font family the caller should use: 'DejaVuSans' when the real
 * font loaded, 'helvetica' otherwise. Callers must surface the fallback —
 * a PDF with unreadable Cyrillic that reports success is worse than an error.
 */
async function loadCyrillicFont(doc) {
  try {
    const [normalRes, boldRes] = await Promise.all([
      fetch('/fonts/DejaVuSans.ttf'),
      fetch('/fonts/DejaVuSans-Bold.ttf'),
    ]);
    if (!normalRes.ok || !boldRes.ok) {
      console.warn('PDF: /fonts/DejaVuSans*.ttf not reachable — falling back to helvetica');
      return 'helvetica';
    }

    const [normalBuf, boldBuf] = await Promise.all([normalRes.arrayBuffer(), boldRes.arrayBuffer()]);
    const normal = new Uint8Array(normalBuf);
    const bold = new Uint8Array(boldBuf);

    if (!isFontBinary(normal) || !isFontBinary(bold)) {
      console.warn('PDF: /fonts/DejaVuSans*.ttf is not a TrueType file (an HTML error page?) — falling back to helvetica');
      return 'helvetica';
    }

    doc.addFileToVFS('DejaVuSans.ttf', bytesToBase64(normal));
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', bytesToBase64(bold));
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
    return 'DejaVuSans';
  } catch (err) {
    console.warn('PDF: Cyrillic font load failed, using helvetica', err);
    return 'helvetica';
  }
}

export async function exportToPDF(data, columns, filename = `export_${today()}`, title = 'Отчёт') {
  // jsPDF v4.x exports { jsPDF } as named export
  const jspdfModule = await import('jspdf');
  const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default?.jsPDF ?? jspdfModule.default;
  if (!JsPDF) throw new Error('jsPDF not found in module');

  // jspdf-autotable v5.x: call autoTable(doc, options) — it mutates doc
  const autoTableMod = await import('jspdf-autotable');
  const autoTable = autoTableMod.default ?? autoTableMod.autoTable ?? autoTableMod;

  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleDateString('ru-RU');

  // PDF draws text only — format() output, no raw numbers
  const { header, rows, activeCols } = buildRows(data, columns);

  // Best-effort Cyrillic support; a fallback to helvetica is a VISIBLE state,
  // not a silent one — the caller (ExportDialog) shows the warning.
  const fontName = await loadCyrillicFont(doc);
  const hasCyrillic = fontName === 'DejaVuSans';

  doc.setFont(fontName);
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Дата: ${dateStr}  |  Записей: ${data.length}`, 14, 25);

  // Numeric columns align right — matches Excel and keeps figures readable.
  // They also get a minimum width: autoTable distributes space by content, and
  // a wide free-text column (an expense note) otherwise squeezes "1 500 000"
  // into a two-line "1 500 / 000" and a date into four lines.
  const columnStyles = {};
  activeCols.forEach((c, i) => {
    if (c.type === 'number') columnStyles[i] = { halign: 'right', cellWidth: 24 };
    else if (/дата|срок/i.test(c.label)) columnStyles[i] = { cellWidth: 26 };
  });

  const tableOpts = {
    startY: 30,
    head: [header],
    body: rows,
    columnStyles,
    // Keep a record on one page. Without this a row that lands on the page
    // boundary is sliced mid-cell: "1 500" prints at the bottom of one page and
    // "000" at the top of the next, which reads as two different amounts.
    rowPageBreak: 'avoid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      font: fontName,
      textColor: [31, 41, 55],
      lineColor: [209, 213, 219],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [64, 131, 59],  // app --primary (#40833B) — matches theme
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 5,
    },
    // No alternate-row fill — body rows stay transparent/colorless so the
    // report adapts to the viewer's theme instead of hardcoding white/gray
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      // Uzbek UI elsewhere; keep the page label consistent with it.
      // (Used to be "1-bet" while the rest of the report was Russian.)
      const footerText = `${getOrgName()}  |  ${pageNum}-bet`;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      // doc.getTextWidth() — jsPDF's own measurement, not a guessed char count
      const w = doc.getTextWidth(footerText);
      doc.text(footerText, (pageW - w) / 2, pageH - 8);
    },
  };

  // autoTable can be called as function(doc, opts) or doc.autoTable(opts)
  if (typeof autoTable === 'function') {
    autoTable(doc, tableOpts);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(tableOpts);
  } else {
    throw new Error('autoTable plugin not found');
  }

  doc.save(`${filename}.pdf`);
  return { fontName, hasCyrillic };
}


// ═══════════════ Main Dispatcher ═══════════════

export async function exportProfilePDF(person, columns, filename, title, pageKey) {
  const jspdfModule = await import('jspdf');
  const JsPDF = jspdfModule.jsPDF ?? jspdfModule.default?.jsPDF ?? jspdfModule.default;
  if (!JsPDF) throw new Error('jsPDF not found in module');

  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const fontName = await loadCyrillicFont(doc);
  const hasCyrillic = fontName === 'DejaVuSans';
  
  doc.setFont(fontName);
  
  // Header / Title
  doc.setFillColor(64, 131, 59); // Brand primary
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont(fontName, 'bold');
  const fullName = person.fullName || person.name || `${person.firstName || person.first_name || ''} ${person.lastName || person.last_name || ''}`.trim() || 'Без имени';
  doc.text(fullName, 20, 25);
  
  doc.setFontSize(12);
  doc.setFont(fontName, 'normal');
  doc.text(title, 20, 32);

  // Avatar placeholder
  doc.setFillColor(235, 244, 232);
  doc.roundedRect(150, 10, 40, 40, 3, 3, 'F');
  doc.setTextColor(64, 131, 59);
  doc.setFontSize(14);
  doc.text(fullName.charAt(0).toUpperCase(), 170, 33, { align: 'center' });

  // Draw details from columns
  let y = 65;
  doc.setTextColor(30, 30, 30);
  
  columns.forEach((c) => {
    if (c.hidden) return;
    const value = getNestedValue(person, c.key);
    const displayValue = String(c.format ? c.format(value, person, 0) : (value ?? '—'));
    
    doc.setFontSize(10);
    doc.setFont(fontName, 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(c.label.toUpperCase(), 20, y);
    
    doc.setFontSize(12);
    doc.setFont(fontName, 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(displayValue, 20, y + 6);
    
    y += 16;
    
    // Add page if needed
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString('ru-RU');
  doc.text(`${getOrgName()}  |  Сгенерировано: ${dateStr}`, 105, 290, { align: 'center' });

  doc.save(`${filename}.pdf`);
  return { fontName, hasCyrillic };
}

export async function exportData(format, data, columns, filename, title, pageKey) {
  switch (format) {
    case 'excel':
      return exportToExcel(data, columns, filename);
    case 'pdf':
      if ((pageKey === 'studentDetail' || pageKey === 'mentorDetail') && data.length === 1) {
        return exportProfilePDF(data[0], columns, filename, title, pageKey);
      }
      return exportToPDF(data, columns, filename, title);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

// ═══════════════ Page-Specific Column Definitions ═══════════════

/**
 * Format currency for display (PDF, and Excel text cells).
 * Columns marked `type: 'number'` bypass this in Excel and get the real number
 * instead, so the sheet can actually sum and sort them.
 */
const fmtMoney = (v) => v != null ? Number(v).toLocaleString('ru-RU') : '—';
const fmtDate = (v) => v ? dateShort(v) : '—';
const fmtFull = (s) => s?.fullName || [s?.firstName || s?.first_name, s?.lastName || s?.last_name].filter(Boolean).join(' ') || '—';

/** Read the first defined value among several possible field spellings. */
const pick = (row, ...keys) => {
  for (const k of keys) if (row?.[k] != null) return Number(row[k]);
  return null;
};

export const STUDENT_COLUMNS = [
  { key: 'fullName', label: 'Имя', format: (v, row) => fmtFull(row) },
  { key: 'login_code', label: 'Код', format: (v, row) => row.login_code || row.loginCode || '—' },
  { key: 'phone', label: 'Телефон' },
  { key: 'parentPhone', label: 'Тел. родителя', format: (v, row) => row.parentPhone || row.parent_phone || '—' },
  { key: 'groups', label: 'Группы', format: (v, row) => {
    const gs = row.groups || (row.groupName ? [{ name: row.groupName }] : []);
    return gs.map((g) => g.name).filter(Boolean).join(', ') || '—';
  } },
  { key: 'coins', label: 'Коины', type: 'number',
    value: (row) => pick(row, 'coins', 'coin_balance'),
    format: (v, row) => (row.coins ?? row.coin_balance) ?? '—' },
  { key: 'balance', label: 'Долг', type: 'number',
    value: (row) => pick(row, 'balance', 'total_debt') ?? 0,
    format: (v, row) => fmtMoney(row.balance ?? row.total_debt ?? 0) },
  { key: 'status', label: 'Статус', format: (v) => v === 'frozen' ? 'Заморожен' : v === 'archived' ? 'Архив' : 'Активен' },
];

export const GROUP_COLUMNS = [
  { key: 'name', label: 'Название' },
  { key: 'mentor.name', label: 'Ментор', format: (v, row) =>
    row.mentor?.name || row.mentorName || [row.mentor_first, row.mentor_last].filter(Boolean).join(' ') || '—' },
  { key: 'studentsCount', label: 'Студенты', type: 'number',
    value: (row) => pick(row, 'studentCount', 'studentsCount', 'students_count') ?? row.students?.length ?? 0,
    format: (v, row) =>
      String(row.studentCount ?? row.studentsCount ?? row.students_count ?? row.students?.length ?? 0) },
  { key: 'monthlyPrice', label: 'Цена', type: 'number',
    value: (row) => pick(row, 'monthlyPrice', 'monthly_price', 'price'),
    format: (v, row) => fmtMoney(row.monthlyPrice ?? row.monthly_price ?? row.price) },
  { key: 'maxStudents', label: 'Макс.', type: 'number',
    value: (row) => Number(row.maxStudents || 15),
    format: (v, row) => String(row.maxStudents || 15) },
  { key: 'isArchived', label: 'Статус', format: (v, row) =>
    (row.isArchived ?? row.is_archived ?? row.status === 'archived') ? 'Архив'
      : (row.status === 'frozen' ? 'Заморожена' : 'Активна') },
];

export const PAYMENT_COLUMNS = [
  { key: 'student', label: 'Студент', format: (v, row) => row.student || row.studentName || '—' },
  { key: 'group', label: 'Группа', format: (v, row) => row.group || row.groupName || '—' },
  { key: 'totalAmount', label: 'Сумма', type: 'number',
    value: (row) => pick(row, 'totalAmount', 'amount'),
    format: (v, row) => fmtMoney(row.totalAmount || row.amount) },
  { key: 'paidAmount', label: 'Оплачено', type: 'number',
    value: (row) => pick(row, 'paidAmount', 'paid_amount'),
    format: (v, row) => fmtMoney(row.paidAmount || row.paid_amount) },
  { key: 'status', label: 'Статус', format: (v) => {
    const m = { paid: 'Оплачен', pending: 'Ожидает', partially_paid: 'Частично', overdue: 'Просрочен', cancelled: 'Отменён', void: 'Аннулирован' };
    return m[v] || v || '—';
  }},
  { key: 'dueDate', label: 'Срок', format: (v, row) => fmtDate(row.dueDate || row.due_date) },
];

export const REPORT_COLUMNS = [
  { key: 'name', label: 'Группа', format: (v, row) => row.name || row.groupName || '—' },
  { key: 'students', label: 'Ученики', type: 'number',
    value: (row) => pick(row, 'students', 'studentsCount') ?? 0,
    format: (v, row) => String(row.students ?? row.studentsCount ?? 0) },
  { key: 'revenue', label: 'Доход', type: 'number',
    value: (row) => pick(row, 'revenue'),
    format: (v) => fmtMoney(v) },
  { key: 'debt', label: 'Долг', type: 'number',
    value: (row) => pick(row, 'debt', 'outstandingDebt'),
    format: (v, row) => fmtMoney(row.debt || row.outstandingDebt) },
];

export const EXPENSE_COLUMNS = [
  { key: 'category', label: 'Категория' },
  { key: 'amount', label: 'Сумма', type: 'number',
    value: (row) => pick(row, 'amount'),
    format: (v) => fmtMoney(v) },
  { key: 'spentAt', label: 'Дата', format: (v, row) => fmtDate(row.spentAt ?? row.spent_at) },
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
  { key: 'status', label: 'Статус', format: (v) => v === 'frozen' ? 'Заморожен' : v === 'archived' ? 'Архив' : 'Активен' },
];

/**
 * Students as seen from inside a group (GroupDetail), not the branch-wide list.
 * Narrower than STUDENT_COLUMNS on purpose: the group is already known, so its
 * name adds nothing, while joinedAt and coinBalance — which the API already
 * returns for group members and the page never showed — do.
 */
export const GROUP_STUDENT_COLUMNS = [
  { key: 'fullName', label: 'Ученик', format: (v, row) => fmtFull(row) },
  { key: 'login_code', label: 'Код', format: (v, row) => row.login_code || row.loginCode || '—' },
  { key: 'phone', label: 'Телефон', format: (v, row) => row.phone || row.phoneNumber || '—' },
  { key: 'coinBalance', label: 'Коины', type: 'number',
    value: (row) => pick(row, 'coinBalance', 'coin_balance', 'coins'),
    format: (v, row) => (row.coinBalance ?? row.coin_balance ?? row.coins) ?? '—' },
  { key: 'totalDebt', label: 'Долг', type: 'number',
    value: (row) => pick(row, 'totalDebt', 'total_debt', 'debt') ?? 0,
    format: (v, row) => fmtMoney(row.totalDebt ?? row.total_debt ?? row.debt ?? 0) },
  { key: 'joinedAt', label: 'В группе с', format: (v, row) => fmtDate(row.joinedAt ?? row.joined_at) },
  { key: 'status', label: 'Статус', format: (v) => v === 'frozen' ? 'Заморожен' : v === 'archived' ? 'Архив' : 'Активен' },
];

// ═══════════════ Раздатка логинов/паролей группы (PDF с QR) ═══════════════

const MEMBER_URL = import.meta.env.VITE_MEMBER_URL || 'https://member.levelup-academy.uz';

/**
 * PDF-раздатка на группу: карточка на студента — QR (сканирует камерой,
 * входит сразу, см. auth/qr-login.service.js) + логин-код + пароль. Сетка
 * 3×3 на лист, чтобы разрезать и раздать — формат по образцу карточек
 * школьных пропусков (запрос Karis, 08.08.2026).
 */
export async function exportGroupCredentialsPDF({ groupName, mentorName, students }) {
  const [{ jsPDF }, QRCodeMod] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = QRCodeMod.default ?? QRCodeMod;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const orgName = getOrgName();

  // Встроенный helvetica, без загрузки DejaVuSans: на этой карточке (см. образец
  // 299.pdf) всё содержимое латиницей — orgName/ID/password/лейблы, а сам
  // DejaVuSans.ttf у jsPDF валится "No unicode cmap for font" именно в этом
  // сценарии (addFont вне autoTable) и молча срывает всю генерацию PDF —
  // проверено live, файл не создавался вообще. Кириллица здесь не нужна.
  const fontName = 'helvetica';

  // Брендовые цвета — те же, что в exportToPDF (headStyles.fillColor) и Excel
  // (HEADER_FILL '40833B') — раздатка выглядит частью той же системы, не самопалом.
  const BRAND = [64, 131, 59];       // #40833B
  const BRAND_DARK = [31, 41, 26];
  const BRAND_TINT = [235, 244, 232]; // светлая заливка label-ячеек
  const GRAY = [110, 116, 108];
  const BORDER = [222, 227, 219];

  const MARGIN = 15;
  const COLS = 3;
  const ROWS = 3;
  const GAP = 6;
  const CARD_W = (210 - MARGIN * 2 - GAP * (COLS - 1)) / COLS;
  const CARD_H = 74;
  const QR_SIZE = 38;
  const TITLE_H = 38;
  const HEADER_H = 8;
  const RADIUS = 2.5;

  doc.setFont(fontName, 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...BRAND_DARK);
  doc.text(groupName || '—', 105, 20, { align: 'center' });

  // короткий акцентный штрих под заголовком вместо казённой линейки во всю ширину
  doc.setFillColor(...BRAND);
  doc.roundedRect(95, 24, 20, 1.2, 0.6, 0.6, 'F');

  doc.setFont(fontName, 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  doc.text(`Teacher: ${mentorName || '-'}`, 105, 31, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text(`${orgName}  ·  ${new Date().toLocaleDateString('en-CA')}`, 105, 36, { align: 'center' });

  const qrDataUrls = await Promise.all(students.map((s) => {
    const url = `${MEMBER_URL}/qr-login?token=${encodeURIComponent(s.qrToken)}`;
    return QRCode.toDataURL(url, { width: 240, margin: 0, color: { dark: '#1a2e17', light: '#ffffff' } });
  }));

  const perPage = COLS * ROWS;
  students.forEach((s, i) => {
    const pageIndex = Math.floor(i / perPage);
    const posInPage = i % perPage;
    if (pageIndex > 0 && posInPage === 0) doc.addPage();

    const col = posInPage % COLS;
    const row = Math.floor(posInPage / COLS);
    const gridTop = pageIndex === 0 ? MARGIN + TITLE_H : MARGIN;
    const x = MARGIN + col * (CARD_W + GAP);
    const y = gridTop + row * (CARD_H + GAP);

    // card — тонкая рамка с закруглением на всю карточку...
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, CARD_W, CARD_H, RADIUS, RADIUS, 'S');
    // ...брендовая шапка поверх (закруглённые только у неё будут видны сверху)
    doc.setFillColor(...BRAND);
    doc.roundedRect(x, y, CARD_W, HEADER_H, RADIUS, RADIUS, 'F');
    doc.rect(x, y + RADIUS, CARD_W, HEADER_H - RADIUS, 'F'); // добиваем низ шапки прямыми углами

    doc.setFont(fontName, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(orgName.toUpperCase(), x + CARD_W / 2, y + HEADER_H / 2 + 1.2, { align: 'center' });

    doc.setFont(fontName, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    // `maxWidth` в doc.text() гоняет jsPDF через splitTextToSize — на кастомных
    // TTF это падало с "Cannot read properties of undefined (reading 'widths')";
    // здесь шрифт стандартный, но обрезаем сами всё равно — надёжнее и предсказуемее.
    let fullName = `${s.lastName || ''} ${s.firstName || ''}`.trim() || '—';
    if (fullName.length > 22) fullName = `${fullName.slice(0, 21)}…`;
    doc.text(fullName, x + CARD_W / 2, y + HEADER_H + 7, { align: 'center' });

    const qrX = x + (CARD_W - QR_SIZE) / 2;
    const qrY = y + HEADER_H + 10;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(qrX - 1.5, qrY - 1.5, QR_SIZE + 3, QR_SIZE + 3, 1.5, 1.5, 'FD');
    doc.addImage(qrDataUrls[i], 'PNG', qrX, qrY, QR_SIZE, QR_SIZE);

    const tableY = qrY + QR_SIZE + 4;
    const rowH = 6.5;
    const labelW = CARD_W * 0.4;
    const tableH = rowH * 2;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(x + 2, tableY, CARD_W - 4, tableH, 1.2, 1.2, 'S');
    doc.line(x + 2, tableY + rowH, x + CARD_W - 2, tableY + rowH);
    doc.line(x + labelW, tableY, x + labelW, tableY + tableH);

    doc.setFontSize(7.5);
    [['ID', s.loginCode || '—'], ['pass', s.password || '—']].forEach(([label, value], r) => {
      const ry = tableY + r * rowH;
      doc.setFillColor(...BRAND_TINT);
      // заливка только под лейбл-ячейкой — значение остаётся белым/прозрачным
      if (r === 0) doc.rect(x + 2.1, ry + 0.1, labelW - 2, rowH - 0.2, 'F');
      else doc.rect(x + 2.1, ry, labelW - 2, rowH - 0.1, 'F');
      doc.setFont(fontName, 'bold');
      doc.setTextColor(...GRAY);
      doc.text(label, x + 4, ry + rowH / 2 + 1.1);
      doc.setFont(fontName, 'normal');
      doc.setTextColor(...BRAND_DARK);
      doc.text(String(value), x + labelW + 2, ry + rowH / 2 + 1.1);
    });
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFont(fontName, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`${orgName}  |  ${p}/${pageCount}`, 105, 293, { align: 'center' });
  }

  const slug = (groupName || 'gruppa').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, '-');
  doc.save(`login-parollar_${slug}_${today()}.pdf`);
}

/** Page config registry — maps route → { columns, title, filenamePrefix } */
export const PAGE_EXPORT_CONFIG = {
  students: { columns: STUDENT_COLUMNS, title: 'Список студентов', filenamePrefix: 'студенты' },
  groups: { columns: GROUP_COLUMNS, title: 'Список групп', filenamePrefix: 'группы' },
  payments: { columns: PAYMENT_COLUMNS, title: 'Платежи', filenamePrefix: 'платежи' },
  reports: { columns: REPORT_COLUMNS, title: 'Отчёт — Доходы и долги', filenamePrefix: 'отчёт' },
  expenses: { columns: EXPENSE_COLUMNS, title: 'Отчёт по расходам', filenamePrefix: 'расходы' },
  mentors: { columns: MENTOR_COLUMNS, title: 'Список менторов', filenamePrefix: 'менторы' },
  mentorDetail: { columns: MENTOR_COLUMNS, title: 'Профиль ментора', filenamePrefix: 'ментор' },
  groupStudents: { columns: GROUP_STUDENT_COLUMNS, title: 'Ученики группы', filenamePrefix: 'ученики-группы' },
  studentDetail: { columns: STUDENT_COLUMNS, title: 'Профиль ученика', filenamePrefix: 'ученик' },
};

// ═══════════════ Attendance (dynamic month grid) ═══════════════

/** Single-letter marks — a month grid has no room for "Пришёл"/"Опоздал". */
export const ATTENDANCE_MARK = {
  present: '+',
  late: 'О',      // Опоздал
  absent: '-',
  null: '·',      // lesson day, not marked
};

/**
 * Build rows + columns for an attendance export.
 *
 * Attendance is a matrix whose width depends on the month and the group's
 * schedule, so it cannot live in PAGE_EXPORT_CONFIG (those are fixed column
 * lists). Callers pass the days they are showing and get back a {data, columns}
 * pair ready for exportData().
 *
 * @param {object[]} students   group members, in display order
 * @param {number[]} days       days of month actually holding a lesson, e.g. [2,4,6]
 * @param {object}   marks      flat map: `${studentId}_${YYYY-MM-DD}` → status
 * @param {number}   year
 * @param {number}   month      0-based, as JS Date uses
 */
export function buildAttendanceExport(students, days, marks, year, month) {
  const pad2 = (n) => String(n).padStart(2, '0');
  const dateKey = (day) => `${year}-${pad2(month + 1)}-${pad2(day)}`;

  const columns = [
    { key: 'student', label: 'Ученик' },
    ...days.map((d) => ({
      key: `d${d}`,
      // Weekday under the date helps the reader see which column is which
      // lesson without counting — the on-screen grid shows the same.
      label: `${pad2(d)}.${pad2(month + 1)}`,
    })),
    // Attended counts late as present: the student was in the room.
    { key: 'attended', label: 'Посетил', type: 'number', value: (row) => row.attended },
    { key: 'total', label: 'Всего', type: 'number', value: (row) => row.total },
  ];

  const data = students.map((s) => {
    const sid = s.id || s.studentId || s.student_id;
    const row = {
      student: s.fullName
        || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ')
        || '—',
      attended: 0,
      total: days.length,
    };
    days.forEach((d) => {
      const status = marks[`${sid}_${dateKey(d)}`] ?? null;
      row[`d${d}`] = ATTENDANCE_MARK[status] ?? ATTENDANCE_MARK.null;
      if (status === 'present' || status === 'late') row.attended++;
    });
    return row;
  });

  return { data, columns };
}
