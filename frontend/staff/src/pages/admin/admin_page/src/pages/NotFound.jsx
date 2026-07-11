import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-6xl font-bold text-[var(--muted)]">404</h1>
      <p className="text-[var(--text-secondary)] text-[13px]">Page not found</p>
      <button
        onClick={() => navigate('/')}
        className="px-5 py-2.5 rounded-[12px] text-[12px] font-semibold"
        style={{ background: 'var(--green)', color: '#141B10' }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
