import { create } from 'zustand';
import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import clsx from 'clsx';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastEntry[];
  push: (kind: ToastKind, message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: Math.random().toString(36).slice(2), kind, message },
      ].slice(-5),
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
  warning: (message: string) => useToastStore.getState().push('warning', message),
};

const KIND_STYLE: Record<ToastKind, { cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { cls: 'bg-success/10 text-success border-success/30', Icon: CheckCircle2 },
  error: { cls: 'bg-error/10 text-error border-error/30', Icon: XCircle },
  info: { cls: 'bg-info/10 text-info border-info/30', Icon: Info },
  warning: { cls: 'bg-warning/10 text-warning border-warning/30', Icon: AlertTriangle },
};

export function Toaster(): React.ReactElement {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} entry={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  entry,
  onClose,
}: {
  entry: ToastEntry;
  onClose: () => void;
}): React.ReactElement {
  const { cls, Icon } = KIND_STYLE[entry.kind];
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={clsx(
        'pointer-events-auto rounded-lg border shadow-md bg-base-100 flex items-start gap-3 p-3 chart-rise',
        cls,
      )}
    >
      <Icon className="size-5 shrink-0 mt-0.5" />
      <div className="text-sm flex-1 text-base-content">{entry.message}</div>
      <button type="button" onClick={onClose} className="btn btn-ghost btn-xs btn-square shrink-0">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
