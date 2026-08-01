import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, FileDown, X, Check, Table2 } from 'lucide-react';
import { exportData, PAGE_EXPORT_CONFIG } from '../utils/exportUtils.js';

const FORMAT_OPTIONS = [
  {
    key: 'excel',
    label: 'Excel',
    ext: '.xlsx',
    icon: FileSpreadsheet,
    color: '#217346',
    bg: 'rgba(33,115,70,0.08)',
    desc: 'Таблица с авто-колонками',
  },
  {
    key: 'pdf',
    label: 'PDF',
    ext: '.pdf',
    icon: FileDown,
    color: '#E8543E',
    bg: 'rgba(232,84,62,0.08)',
    desc: 'Документ с заголовком',
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

  const colCount = (config.columns || []).filter((c) => !c.hidden).length;
  const activeFormat = FORMAT_OPTIONS.find((f) => f.key === format) || FORMAT_OPTIONS[0];

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card !max-w-md !w-[26rem] overflow-hidden p-0 !border !border-[var(--glass-border)]"
           style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(14px)' }}>
        {/* ── Header ─────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
              >
                <Download size={17} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 className="font-bold text-[15px]" style={{ color: 'var(--text)' }}>Экспорт данных</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {data.length} {data.length === 1 ? 'запись' : data.length < 5 ? 'записи' : 'записей'}
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-xs btn-circle hover:!bg-[var(--surface-hover)]"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* ── Format selector ────────────────────────────── */}
        <div className="px-5 pt-4 pb-1">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Формат файла
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {FORMAT_OPTIONS.map((f) => {
              const active = format === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setFormat(f.key)}
                  className="relative flex items-center gap-3 p-3.5 rounded-[14px] transition-all duration-200 cursor-pointer"
                  style={{
                    border: `1.5px solid ${active ? f.color : 'var(--border)'}`,
                    background: active ? f.bg : 'var(--surface)',
                    boxShadow: active ? `0 0 0 3px ${f.bg}, 0 4px 14px rgba(0,0,0,0.06)` : 'none',
                  }}
                >
                  {active && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                      style={{ background: f.color }}
                    >
                      <Check size={11} className="text-white" strokeWidth={3.5} />
                    </div>
                  )}
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors duration-200"
                    style={{ background: active ? f.color : 'var(--surface-hover)', border: `1px solid ${active ? f.color : 'var(--border)'}` }}
                  >
                    <Icon size={19} style={{ color: active ? '#fff' : 'var(--text-secondary)' }} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[13px] font-bold leading-tight" style={{ color: active ? f.color : 'var(--text)' }}>
                      {f.label}
                    </div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {f.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Title input ────────────────────────────────── */}
        <div className="px-5 pt-4">
          <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
            Заголовок документа
          </label>
          <input
            className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите заголовок..."
          />
        </div>

        {/* ── Preview info ───────────────────────────────── */}
        <div className="px-5 pt-4">
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-hover)', border: '1px dashed var(--border)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Table2 size={13} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{data.length}</span> строк ·{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{colCount}</span> колонок ·{' '}
              <span className="font-semibold uppercase" style={{ color: activeFormat.color }}>{format}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────── */}
        <div className="px-5 py-4 mt-1 border-t flex justify-end items-center gap-2" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.4)' }}>
          <button
            className="px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 cursor-pointer"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onClick={onClose}
            disabled={busy}
          >
            Отмена
          </button>
          <button
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-white gap-1.5 flex items-center transition-all duration-200 cursor-pointer"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 12px rgba(64,131,59,0.3)' }}
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
