import { X, Inbox } from 'lucide-react';

export function Skeleton({ h = 56, count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: h, marginBottom: 10 }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text }) {
  return (
    <div className="empty">
      <Icon size={34} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
