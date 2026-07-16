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
        <button className="btn btn-primary btn-sm rounded-xl" onClick={onRetry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
}

export function ProgressRing({ value = 0, size = 80, stroke = 6, color = '#C6FF34', bg = '#e7eede' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export function ProgressBar({ value = 0, color = '#C6FF34', height = 6 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#e7eede' }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(value, 100)}%`, background: color }}
      />
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color, className = '' }) {
  return (
    <div className={`card bg-base-100 hover:shadow-lg transition-shadow ${className}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ background: `${color}18`, color }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-base-content/50 truncate">{label}</p>
            <p className="text-lg font-extrabold tracking-tight leading-tight">{value}</p>
            {sub && <p className="text-[11px] text-base-content/40 mt-0.5">{sub}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
