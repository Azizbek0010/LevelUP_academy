export const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Number(n ?? 0));

export const money = (n, cur = 'UZS') => `${fmt(n)} ${cur}`;

export const dateShort = (iso) =>
  iso ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)) : '—';

// С временем — для журнала действий, где важна не дата, а точный момент.
export const dateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso))
    : '—';

export const LEAD_STATUS = {
  new: { label: 'Новая', cls: 'badge-info' },
  contacted: { label: 'Связались', cls: 'badge-warning' },
  onboarded: { label: 'Онбординг', cls: 'badge-success' },
  rejected: { label: 'Отклонена', cls: 'badge-error' },
};

export const ORG_STATUS = {
  active: { label: 'Активен', cls: 'badge-success' },
  trial: { label: 'Триал', cls: 'badge-warning' },
  frozen: { label: 'Заморожен', cls: 'badge-error' },
};
