export const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Number(n ?? 0));

export const money = (n, cur = 'UZS') => `${fmt(n)} ${cur}`;

/** Format Uzbek phone numbers: +998901112233 → +998 90 111 22 33 */
export const formatPhone = (raw) => {
  if (!raw) return '—';
  const s = String(raw).replace(/\D/g, '');
  // Expect 998XXXXXXXXX (12 digits) or 90XXXXXXXX (9 digits, local)
  let m;
  if (s.startsWith('998') && s.length === 12) m = s.match(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
  else if (s.length === 9) m = `998${s}`.match(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (m) return `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`;
  return raw;
};

export const dateShort = (iso) =>
  iso ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';

/** Format Uzbek phone number: +998XXXXXXXXX → +998 XX XXX XX XX */
export const formatPhone = (phone) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  // +998XXXXXXXXX (12 digits with country code) or 9XXXXXXXXX (9 digits local)
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }
  if (digits.length === 9) {
    return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  return phone; // fallback: return as-is
};

export const ORG_STATUS = {
  active: { label: 'Активен', cls: 'badge-success' },
  trial: { label: 'Триал', cls: 'badge-warning' },
  frozen: { label: 'Заморожен', cls: 'badge-error' },
};

export const USER_STATUS = {
  active: { label: 'Активен', cls: 'badge-success' },
  frozen: { label: 'Заморожен', cls: 'badge-error' },
  dropped: { label: 'Удалён', cls: 'badge-ghost' },
};

export const ADMIN_STATUS = {
  active: { label: 'Активен', cls: 'badge-success' },
  frozen: { label: 'Заморожен', cls: 'badge-error' },
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Администратор',
  mentor: 'Ментор',
  methodist: 'Методист',
};

export const LEAD_STATUS = {
  new: { label: 'Новая', cls: 'badge-info' },
  contacted: { label: 'Связались', cls: 'badge-warning' },
  onboarded: { label: 'Онбординг', cls: 'badge-success' },
  rejected: { label: 'Отклонена', cls: 'badge-error' },
};
