import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, FileCode2, X, Check } from 'lucide-react';
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
 */
export default function ExportDialog({ open, onClose, pageKey, data = [], filename }) {
  const config = PAGE_EXPORT_CONFIG[pageKey] || {};
  const [format, setFormat] = useState('excel');
  const [title, setTitle] = useState(config.title || 'Экспорт');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = useCallback(async () => {
    if (!data.length || busy) return;
    setBusy(true);
    try {
      const fn = filename || config.filenamePrefix || 'export';
      await exportData(format, data, config.columns || [], fn, title);
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export error:', err);
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
