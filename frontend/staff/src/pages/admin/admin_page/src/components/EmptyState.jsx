export default function EmptyState({ icon, title, desc, description, onAction, action, children }) {
  // Support both 'desc' and 'description' prop names
  const descriptionText = desc || description || '';
  // Support both old pattern (action+onAction) and object pattern ({ label, onClick })
  const actionLabel = typeof action === 'object' && action !== null ? action.label : action || '';
  const actionHandler = typeof action === 'object' && action !== null ? action.onClick : onAction;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {icon && <div className="mb-4 text-[var(--text-muted)] opacity-60">{icon}</div>}
      <h3 className="text-[15px] font-bold text-[var(--text)] mb-1">{title || ''}</h3>
      {descriptionText && (
        <p className="text-[12px] text-[var(--text-secondary)] max-w-xs mb-5">{descriptionText}</p>
      )}
      {actionHandler && actionLabel && (
        <button
          onClick={actionHandler}
          className="px-5 py-2.5 bg-[var(--green)] text-[#141B10] font-bold text-[13px] rounded-[12px] hover:brightness-110 transition-all shadow-[0_4px_16px_var(--green-glow)]"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
