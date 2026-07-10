import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import Button from './Button.jsx';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-[rgba(232,84,62,0.12)] flex items-center justify-center mb-4">
        <HiOutlineExclamationTriangle className="w-7 h-7 text-[var(--danger)]" />
      </div>
      <h3 className="text-[15px] font-bold text-[var(--text)] mb-1">Xatolik yuz berdi</h3>
      <p className="text-[12px] text-[var(--text-secondary)] max-w-sm mb-5">{message || 'Iltimos, qaytadan urinib ko\'ring'}</p>
      {onRetry && <Button variant="primary" size="md" onClick={onRetry}>Qayta urinish</Button>}
    </div>
  );
}
