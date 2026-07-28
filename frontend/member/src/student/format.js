const nf = new Intl.NumberFormat('ru-RU');

export const fmtNum = (n) => nf.format(Number(n) || 0);

export const fmtMoney = (n) => `${nf.format(Number(n) || 0)} сум`;

export function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 125 сек → «2:05» */
export function fmtDuration(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Дедлайн относительно now: «через 3 дня» / «сегодня» / «просрочено». */
export function deadlineLabel(deadline) {
  if (!deadline) return '';
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs < 0) return 'просрочено';
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  return `через ${days} дн.`;
}

export const initials = (firstName = '', lastName = '') =>
  `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}` || '?';
