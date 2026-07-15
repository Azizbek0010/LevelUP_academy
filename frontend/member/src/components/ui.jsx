export function EmptyState({ icon = '📭', title = 'Пусто', message = 'Данных пока нет' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-base-content/50 max-w-xs">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Произошла ошибка', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <h3 className="text-lg font-bold mb-1">Ошибка</h3>
      <p className="text-sm text-base-content/50 max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button className="btn btn-primary btn-sm" onClick={onRetry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-base-100 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h3 className="font-bold">{title}</h3>
          <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
