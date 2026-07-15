export const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Number(n ?? 0));

export const money = (n, cur = 'UZS') => `${fmt(n)} ${cur}`;

export const dateShort = (iso) =>
  iso ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';

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
};

export const LEAD_STATUS = {
  new: { label: 'Новая', cls: 'badge-info' },
  contacted: { label: 'Связались', cls: 'badge-warning' },
  onboarded: { label: 'Онбординг', cls: 'badge-success' },
  rejected: { label: 'Отклонена', cls: 'badge-error' },
};
