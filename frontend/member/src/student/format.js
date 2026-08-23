/* Дата/деньги/дедлайн — с учётом языка интерфейса: locale и слова-подписи
   зависят от lang ('ru' | 'uz' | 'en'), чтобы в узбекском/английском режиме
   не оставалось русских «сегодня»/«авг»/«сум». Сам язык приходит из
   useI18n().lang. */
const nf = new Intl.NumberFormat('ru-RU');

export const fmtNum = (n) => nf.format(Number(n) || 0);

const CURRENCY_WORD = { ru: 'сум', uz: "so'm", en: 'UZS' };
export const fmtMoney = (n, lang = 'ru') => `${nf.format(Number(n) || 0)} ${CURRENCY_WORD[lang] || CURRENCY_WORD.ru}`;

const LOCALES = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US' };
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
const DEADLINE_WORDS = {
  ru: { overdue: 'просрочено', today: 'сегодня', tomorrow: 'завтра', inDays: (n) => `через ${n} дн.` },
  uz: { overdue: 'muddati o‘tgan', today: 'bugun', tomorrow: 'ertaga', inDays: (n) => `${n} kundan keyin` },
  en: { overdue: 'overdue', today: 'today', tomorrow: 'tomorrow', inDays: (n) => `in ${n} days` },
};
export function deadlineLabel(deadline, lang = 'ru') {
  if (!deadline) return '';
  const words = DEADLINE_WORDS[lang] || DEADLINE_WORDS.ru;
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs < 0) return words.overdue;
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return words.today;
  if (days === 1) return words.tomorrow;
  return words.inDays(days);
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
