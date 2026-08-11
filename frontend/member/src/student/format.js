/* Дата/деньги/дедлайн — с учётом языка интерфейса: locale и слова-подписи
   зависят от lang ('ru' | 'uz'), чтобы в узбекском режиме не оставалось
   русских «сегодня»/«авг»/«сум». Сам язык приходит из useI18n().lang. */
const nf = new Intl.NumberFormat('ru-RU');

export const fmtNum = (n) => nf.format(Number(n) || 0);

export const fmtMoney = (n, lang = 'ru') => `${nf.format(Number(n) || 0)} ${lang === 'uz' ? "so'm" : 'сум'}`;

const LOCALES = { ru: 'ru-RU', uz: 'uz-UZ' };
/* Браузер без данных узбекской локали (редкие окружения) выбросит RangeError
   на toLocaleDateString('uz-UZ') — тогда молча откатываемся на русскую. */
const localeOf = (lang) => {
  const loc = LOCALES[lang] ?? 'ru-RU';
  try {
    new Intl.DateTimeFormat(loc).format(new Date());
    return loc;
  } catch {
    return 'ru-RU';
  }
};

export function fmtDate(value, lang = 'ru') {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value, lang = 'ru') {
  if (!value) return '—';
  return new Date(value).toLocaleString(localeOf(lang), {
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
export function deadlineLabel(deadline, lang = 'ru') {
  if (!deadline) return '';
  const uz = lang === 'uz';
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs < 0) return uz ? 'muddati o‘tgan' : 'просрочено';
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return uz ? 'bugun' : 'сегодня';
  if (days === 1) return uz ? 'ertaga' : 'завтра';
  return uz ? `${days} kundan keyin` : `через ${days} дн.`;
}

/** 158000 → «154 КБ», 3400000 → «3.2 МБ» */
export function fmtFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export const initials = (firstName = '', lastName = '') =>
  `${(firstName[0] || '').toUpperCase()}${(lastName[0] || '').toUpperCase()}` || '?';
