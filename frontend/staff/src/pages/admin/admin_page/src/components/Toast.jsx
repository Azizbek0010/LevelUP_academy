import { useState, useEffect, useCallback } from 'react';
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineXMark } from 'react-icons/hi2';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(handleClose, duration);
    return () => clearTimeout(t);
  }, [handleClose, duration]);

  const bg = type === 'success' ? 'bg-[#2ECC71]' : type === 'error' ? 'bg-[#E8543E]' : 'bg-[#F59E0B]';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${bg} transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {type === 'success' ? <HiOutlineCheckCircle className="w-5 h-5 shrink-0" /> : <HiOutlineExclamationTriangle className="w-5 h-5 shrink-0" />}
      <span className="text-[12px] font-semibold">{message}</span>
      <button onClick={handleClose} className="ml-1 hover:opacity-70 transition-opacity">
        <HiOutlineXMark className="w-4 h-4" />
      </button>
    </div>
  );
}
