import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function Modal({ open, onClose, title, children, wide = false }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-[999] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
        <div
          className={`glass-strong rounded-[20px] max-h-[90vh] overflow-y-auto w-full ${wide ? 'max-w-2xl' : 'max-w-md'} animate-scale-in`}
          onClick={e => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[16px] font-extrabold text-[var(--text)]">{title}</h2>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors p-1 rounded-[8px] hover:bg-[var(--surface-hover)]">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}
