import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifKind = 'payment' | 'rule' | 'delivery.failed' | 'branch' | 'student';

export interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

interface NotifState {
  items: Notification[];
  markAllRead: () => void;
  markRead: (id: string) => void;
  push: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  clear: () => void;
  ensureSeeded: () => void;
}

function isoAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const SEED: Notification[] = [
  {
    id: 'n-1',
    kind: 'payment',
    title: 'Платёж принят',
    body: 'Ходжаев Санжар · 600 000 сум · Frontend · Junior',
    createdAt: isoAgo(4),
    read: false,
    href: '/superadmin/reminders',
  },
  {
    id: 'n-2',
    kind: 'rule',
    title: 'Правило сработало',
    body: 'debt.overdue → 3 уведомления отправлены',
    createdAt: isoAgo(17),
    read: false,
    href: '/superadmin/reminders',
  },
  {
    id: 'n-3',
    kind: 'delivery.failed',
    title: 'Ошибка доставки в Telegram',
    body: 'Родитель Феруза Ибрагимовой не активировал бота',
    createdAt: isoAgo(42),
    read: false,
    href: '/superadmin/reminders',
  },
  {
    id: 'n-4',
    kind: 'branch',
    title: 'Юнусабад: админ не назначен',
    body: 'Прошло 3 дня без назначенного админа',
    createdAt: isoAgo(180),
    read: true,
    href: '/superadmin/branches',
  },
  {
    id: 'n-5',
    kind: 'student',
    title: 'Новый студент',
    body: 'Каримов Иброхим записан в Python · Middle',
    createdAt: isoAgo(320),
    read: true,
    href: '/superadmin/students',
  },
  {
    id: 'n-6',
    kind: 'payment',
    title: 'Платёж принят',
    body: 'Юсупова Малика · 750 000 сум · Python · Middle',
    createdAt: isoAgo(500),
    read: true,
    href: '/superadmin/reminders',
  },
];

export const useNotifStore = create<NotifState>()(
  persist(
    (set, get) => ({
      items: [],
      markAllRead: () =>
        set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      push: (n) =>
        set((s) => ({
          items: [
            {
              ...n,
              id: `n-${Date.now().toString(36)}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.items,
          ].slice(0, 50),
        })),
      clear: () => set({ items: [] }),
      ensureSeeded: () => {
        if (get().items.length === 0) set({ items: SEED });
      },
    }),
    { name: 'educrm-notifications' },
  ),
);
