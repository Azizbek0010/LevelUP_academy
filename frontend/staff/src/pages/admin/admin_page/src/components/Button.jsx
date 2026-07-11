import { useCallback, useState } from 'react';

const variants = {
  primary: 'bg-[var(--green)] text-[#141B10] font-bold hover:brightness-110 shadow-[0_4px_16px_var(--green-glow)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] font-semibold hover:bg-[var(--surface-hover)]',
  ghostGreen: 'bg-transparent text-[var(--text-secondary)] font-semibold hover:bg-[var(--green-bg)] hover:text-[var(--green)]',
  danger: 'bg-[var(--danger)] text-white font-bold hover:brightness-110',
};

const sizes = {
  sm: 'px-3 py-1.5 text-[11px] rounded-[10px]',
  md: 'px-4 py-2.5 text-[13px] rounded-[10px]',
  lg: 'px-5 py-3 text-[14px] rounded-[12px]',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, onClick, ...props }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden inline-flex items-center justify-center gap-2 transition-all duration-200 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{ left: r.x, top: r.y, width: 4, height: 4, marginLeft: -2, marginTop: -2 }}
        />
      ))}
    </button>
  );
}
