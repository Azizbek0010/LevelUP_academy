export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6 animate-page-enter">
      <div className="flex items-center gap-3">
        {/* Green accent bar */}
        <div className="w-1 h-7 rounded-full bg-[var(--green)] shrink-0" />
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text)' }}>{title}</h1>
          {subtitle && (
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
