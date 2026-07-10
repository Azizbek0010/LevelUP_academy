import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  hints?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  hints,
  size = 'md',
}: ModalProps): React.ReactElement | null {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener('close', handler);
    return () => dialog.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog ref={ref} className="modal">
      <div className={`modal-box ${SIZE[size]} p-0 overflow-hidden shadow-2xl border border-base-300`}>
        <header className="flex items-center justify-between px-5 py-2.5 border-b border-base-300 bg-base-200/30">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-mono text-base-content/30 text-sm select-none">┌</span>
            <h3 className="font-medium text-[13px] tracking-wide truncate">{title}</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="size-3.5" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {(footer || hints) && (
          <footer className="px-5 py-2.5 border-t border-base-300 bg-base-200/40 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">{hints}</div>
            {footer && <div className="flex items-center gap-2 shrink-0">{footer}</div>}
          </footer>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
