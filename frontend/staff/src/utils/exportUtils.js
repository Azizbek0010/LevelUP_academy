/**
 * Admin Panel Export Utilities
 * Supports: Excel (.xlsx), PDF
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
  const { header, rows } = buildRows(data, columns);

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // ── Styling: brand header (green), transparent data cells ──
  // Cell fills follow the app theme: header = app --primary (#40833B).
  // Data rows get NO fill at all (transparent/colorless) — no white, no zebra —
  // so the exported sheet adapts to the viewer's Excel theme (light or dark)
  // instead of hardcoding white/light backgrounds.
  const HEADER_FILL = '40833B';      // app --primary (LevelUp brand green)
  const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 };
  const BORDER = {
    top:  { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left: { style: 'thin', color: { rgb: 'D1D5DB' } },
    right: { style: 'thin', color: { rgb: 'D1D5DB' } },
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
      // No fill on data cells → transparent/colorless, matches app theme
      cell.s = {
        font: { color: { rgb: '1F2937' }, sz: 10 },
        alignment: { vertical: 'middle' },
        border: BORDER,
      };
    });
  });

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

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

/** Load DejaVuSans TTF from public/fonts and register with jsPDF for Cyrillic support */
async function loadCyrillicFont(doc) {
  try {
    const [normalRes, boldRes] = await Promise.all([
      fetch('/fonts/DejaVuSans.ttf'),
      fetch('/fonts/DejaVuSans-Bold.ttf'),
    ]);

    if (!normalRes.ok || !boldRes.ok) {
      console.warn('DejaVuSans font files not found, falling back to Helvetica (Cyrillic may not render)');
      return;
    }

    const [normalBuf, boldBuf] = await Promise.all([
      normalRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);

    const normalArr = new Uint8Array(normalBuf);
    const boldArr = new Uint8Array(boldBuf);

    // Convert to base64
    const toBase64 = (arr) => {
      let binary = '';
      for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      return btoa(binary);
    };

    doc.addFileToVFS('DejaVuSans.ttf', toBase64(normalArr));
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFileToVFS('DejaVuSans-Bold.ttf', toBase64(boldArr));
    doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');

    doc.setFont('DejaVuSans');
  } catch (err) {
    console.warn('Failed to load Cyrillic font:', err);
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
  const dateStr = new Date().toLocaleDateString('ru-RU');
  const { header, rows } = buildRows(data, columns);

  // Load Cyrillic font — best-effort, falls back to helvetica
  let fontName = 'helvetica';
  try {
    const [nr, br] = await Promise.all([
      fetch('/fonts/DejaVuSans.ttf'),
      fetch('/fonts/DejaVuSans-Bold.ttf'),
    ]);
    if (nr.ok && br.ok) {
      const toB64 = async (r) => {
        const buf = await r.arrayBuffer();
        const arr = new Uint8Array(buf);
        let s = '';
        for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
        return btoa(s);
      };
      const [nb, bb] = await Promise.all([toB64(nr), toB64(br)]);
      doc.addFileToVFS('DejaVuSans.ttf', nb);
      doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
      doc.addFileToVFS('DejaVuSans-Bold.ttf', bb);
      doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');
      fontName = 'DejaVuSans';
    }
  } catch (e) {
    console.warn('PDF: Cyrillic font load failed, using helvetica', e);
  }

  doc.setFont(fontName);
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Дата: ${dateStr}  |  Записей: ${data.length}`, 14, 25);

  const tableOpts = {
    startY: 30,
    head: [header],
    body: rows,
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
      const pageH = doc.internal.pageSize.getHeight();
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      const footerText = `${getOrgName()}  |  ${pageNum}-bet`;
      const approxW = footerText.length * 7 * 0.6 / 2.834;
      doc.setFont(fontName, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(footerText, pageW / 2 - approxW / 2, pageH - 8);
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
}


// ═══════════════ Main Dispatcher ═══════════════

export async function exportData(format, data, columns, filename, title) {
  switch (format) {
    case 'excel':
      return exportToExcel(data, columns, filename);
    case 'pdf':
      return exportToPDF(data, columns, filename, title);
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
};
