import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  pending = false,
}: ConfirmDialogProps): React.ReactElement {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${danger ? 'btn-error' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <span className="loading loading-spinner loading-xs" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`inline-flex size-10 items-center justify-center rounded-full shrink-0 ${
            danger ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
          }`}
        >
          <AlertTriangle className="size-5" />
        </div>
        <p className="text-sm text-base-content/80 pt-1">{message}</p>
      </div>
    </Modal>
  );
}
