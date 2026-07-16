export const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Number(n ?? 0));

export const money = (n, cur = 'UZS') => `${fmt(n)} ${cur}`;

export const dateShort = (iso) =>
  iso
    ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
    : '—';

export const datetimeShort = (iso) =>
  iso
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн. назад`;
};

export const ATTENDANCE_STATUS = {
  present: { label: 'Присутствовал', color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
  absent: { label: 'Отсутствовал', color: '#ef4444', bg: 'rgba(239,68,68,.12)' },
  late: { label: 'Опоздал', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  excused: { label: 'По уважит.', color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
};
