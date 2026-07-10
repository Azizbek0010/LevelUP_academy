import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from 'react-icons/hi2';

export default function StatCard({ title, value, delta, deltaLabel, icon, color = 'var(--green)', className = '' }) {
  const isUp = (delta || 0) >= 0;
  return (
    <div className={`glass-strong rounded-[20px] card-hover-premium p-5 group ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em]">{title}</span>
        <span className="text-[var(--text-muted)] group-hover:text-[var(--green)] transition-colors duration-300" style={{ color }}>
          {icon}
        </span>
      </div>
      <div className="text-[26px] font-extrabold text-[var(--text)] tabular-nums leading-tight tracking-[-0.02em]">{value}</div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${isUp ? 'text-[#2ECC71]' : 'text-[#E8543E]'}`}>
            {isUp ? <HiOutlineArrowTrendingUp className="w-3.5 h-3.5" /> : <HiOutlineArrowTrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
          {deltaLabel && <span className="text-[10px] text-[var(--text-secondary)]">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
