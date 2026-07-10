const statusConfig = {
  active: { label: 'Faol', bg: 'rgba(46,204,113,0.14)', color: '#2ECC71' },
  paid: { label: "To'langan", bg: 'rgba(46,204,113,0.14)', color: '#2ECC71' },
  pending: { label: 'Kutilmoqda', bg: 'rgba(245,158,11,0.14)', color: '#F59E0B' },
  overdue: { label: "Muddati o'tgan", bg: 'rgba(232,84,62,0.14)', color: '#E8543E' },
  full: { label: "To'liq", bg: 'rgba(198,255,52,0.2)', color: '#141B10' },
  starting: { label: 'Boshlanadi', bg: 'rgba(245,158,11,0.14)', color: '#F59E0B' },
  frozen: { label: 'Muzlatilgan', bg: 'rgba(245,158,11,0.14)', color: '#F59E0B' },
  archived: { label: 'Arxiv', bg: 'rgba(245,158,11,0.14)', color: '#F59E0B' },
  inactive: { label: 'Faol emas', bg: 'rgba(232,84,62,0.12)', color: '#E8543E' },
};

export default function Badge({ status, customLabel, className = '' }) {
  const config = statusConfig[status] || { label: customLabel || status, bg: 'rgba(198,255,52,0.2)', color: '#141B10' };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
