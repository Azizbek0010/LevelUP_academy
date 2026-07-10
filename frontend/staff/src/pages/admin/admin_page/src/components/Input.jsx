export default function Input({ label, value, onChange, type = 'text', placeholder, required, error, id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') : undefined);
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">
          {label}{required && ' *'}
        </label>
      )}
      {type === 'select' ? (
        <select
          id={inputId}
          name={inputId}
          value={value}
          onChange={onChange}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[13px] bg-[var(--bg)] text-[var(--text)] outline-none transition-colors appearance-none ${error ? 'border-[var(--danger)]' : 'border-[var(--border)] hover:border-[var(--green)] focus:border-[var(--green)]'}`}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={inputId}
          name={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[13px] bg-[var(--bg)] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-muted)] ${error ? 'border-[var(--danger)]' : 'border-[var(--border)] hover:border-[var(--green)] focus:border-[var(--green)]'}`}
          {...props}
        />
      )}
      {error && <p className="text-[10px] text-[var(--danger)] mt-1 font-semibold">{error}</p>}
    </div>
  );
}
