import { HiOutlineMagnifyingGlass, HiOutlineBell, HiOutlineBars3, HiOutlineXMark } from 'react-icons/hi2';

export default function Header({ title, subtitle, onMenuToggle, sidebarOpen }) {
  return (
    <header className="shrink-0 glass rounded-none px-4 lg:px-6 h-[60px] flex items-center justify-between gap-3 border-b border-[var(--border)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] transition-all shrink-0"
        >
          {sidebarOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
        </button>
        <div className="min-w-0">
          <h1 className="text-[15px] font-extrabold text-[var(--text)] tracking-[-0.02em] truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-[var(--text-secondary)] truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--green)] transition-all text-[11px]">
          <HiOutlineMagnifyingGlass className="w-4 h-4" />
          <span className="hidden md:inline">Qidirish</span>
          <kbd className="text-[9px] text-[var(--text-muted)] bg-[var(--bg)] px-1.5 py-0.5 rounded-[6px] font-bold hidden md:inline">⌘K</kbd>
        </button>
        <button className="sm:hidden w-9 h-9 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--green)] transition-all">
          <HiOutlineMagnifyingGlass className="w-4 h-4" />
        </button>
        <div className="relative">
          <button className="w-9 h-9 rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--green)] transition-all relative">
            <HiOutlineBell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[7px] font-bold flex items-center justify-center hidden md:flex">3</span>
          </button>
        </div>
      </div>
    </header>
  );
}
