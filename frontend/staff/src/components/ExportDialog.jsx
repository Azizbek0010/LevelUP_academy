import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, FileCode2, X, Check, AlertTriangle } from 'lucide-react';
import { exportData, PAGE_EXPORT_CONFIG } from '../utils/exportUtils.js';

const FORMAT_OPTIONS = [
  {
    key: 'excel',
    label: 'Excel',
    ext: '.xlsx',
    icon: FileSpreadsheet,
    color: '#217346',
    bg: 'rgba(33,115,70,0.10)',
    desc: 'Таблица с авто-колонками',
  },
  {
    key: 'pdf',
    label: 'PDF',
    ext: '.pdf',
    icon: FileDown,
    color: '#E8543E',
    bg: 'rgba(232,84,62,0.10)',
    desc: 'Документ с заголовком',
  },
  {
    key: 'markdown',
    label: 'Markdown',
    ext: '.md',
    icon: FileCode2,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    desc: 'Текстовый файл (.md)',
  },
  {
    key: 'csv',
    label: 'CSV',
    ext: '.csv',
    icon: FileText,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.10)',
    desc: 'Текстовый файл (Cyrillic)',
  },
];

/**
 * ExportDialog — modal for choosing export format and triggering download.
 *
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   pageKey    — key into PAGE_EXPORT_CONFIG (e.g. 'students', 'groups', etc.)
 *   data       — array of current filtered rows to export
 *   filename   — optional override for filename (without extension)
 *   columns    — optional column defs, overriding the pageKey lookup. Needed by
 *                attendance, whose columns depend on the month and the group's
 *                schedule and so cannot be a fixed entry in the registry.
 *   title      — optional starting title, overriding the registry's
 */
export default function ExportDialog({ open, onClose, pageKey, data = [], filename, columns, title: titleProp }) {
  const config = PAGE_EXPORT_CONFIG[pageKey] || {};
  const cols = columns ?? config.columns ?? [];
  const [format, setFormat] = useState('excel');
  const [title, setTitle] = useState(titleProp || config.title || 'Экспорт');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleExport = useCallback(async () => {
    if (!data.length || busy) return;
    setBusy(true);
    setError('');
    setWarning('');
    try {
      const fn = filename || config.filenamePrefix || 'export';
      const result = await exportData(format, data, cols, fn, title);
      setDone(true);
      // PDF reports which font it ended up with. A helvetica fallback means
      // Cyrillic will not render — say so instead of handing over a broken file
      // that looks like a success. The file downloaded either way, so this is a
      // warning, not an error; keep the dialog open so it can actually be read.
      if (format === 'pdf' && result && result.hasCyrillic === false) {
        setWarning('Файл скачан, но шрифт кириллицы не загрузился — русский текст в PDF может отображаться неверно.');
        return;
      }
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export error:', err);
      setError(err?.message || 'Не удалось создать файл. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }, [format, data, config, title, filename, busy, onClose]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-primary/10">
              <Download size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-base-content">Экспорт данных</h3>
              <p className="text-[11px] text-base-content/45">{data.length} записей</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Format selector */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {FORMAT_OPTIONS.map((f) => {
            const active = format === f.key;
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-sm cursor-pointer"
                style={{
                  borderColor: active ? f.color : 'var(--border)',
                  background: active ? f.bg : 'var(--surface)',
                }}
              >
                {active && (
                  <div
                    className="absolute top-2 right-2 w-4.5 h-4.5 rounded-full flex items-center justify-center"
                    style={{ background: f.color }}
                  >
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: active ? f.color : 'var(--border)' }}
                >
                  <Icon size={18} style={{ color: active ? '#fff' : 'var(--text-secondary)' }} />
                </div>
                <div className="text-center">
                  <div className="text-[12px] font-bold" style={{ color: active ? f.color : 'var(--text)' }}>
                    {f.label}
                  </div>
                  <div className="text-[9px] text-base-content/45 mt-0.5">{f.ext}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Title input */}
        <div className="mb-5">
          <label className="text-[10px] font-bold text-base-content/70 uppercase tracking-wider mb-1.5 block">
            Заголовок документа
          </label>
          <input
            className="input input-bordered w-full text-[13px]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите заголовок..."
          />
        </div>

        {/* Preview info */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-base-200 mb-5">
          <div className="text-[11px] text-base-content/60">
            <span className="font-semibold">{data.length}</span> строк ·{' '}
            <span className="font-semibold">{(config.columns || []).filter((c) => !c.hidden).length}</span> колонок ·{' '}
            <span className="font-semibold uppercase">{format}</span>
          </div>
        </div>

        {/* ── Error / warning ────────────────────────────── */}
        {(error || warning) && (
          <div className="px-5 pt-3">
            <div
              className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{
                background: error ? 'rgba(220,38,38,0.08)' : 'rgba(180,83,9,0.08)',
                border: `1px solid ${error ? 'rgba(220,38,38,0.35)' : 'rgba(180,83,9,0.35)'}`,
              }}
            >
              <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: error ? '#dc2626' : '#b45309' }} />
              <div className="text-[11px] leading-snug" style={{ color: error ? '#dc2626' : '#b45309' }}>
                {error || warning}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────── */}
        <div className="px-5 py-4 mt-1 border-t flex justify-end items-center gap-2" style={{ borderColor: 'var(--border)', background: 'transparent' }}>
          <button
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 cursor-pointer"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            className="btn btn-primary gap-1.5"
            onClick={handleExport}
            disabled={busy || !data.length || done}
          >
            {busy ? (
              <span className="loading loading-spinner loading-xs" />
            ) : done ? (
              <Check size={14} />
            ) : (
              <Download size={14} />
            )}
            {done ? 'Готово!' : busy ? 'Создаём...' : 'Скачать'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
