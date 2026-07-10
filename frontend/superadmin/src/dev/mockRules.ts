import { loadMock } from './persist';

export interface MockRule {
  id: string;
  event: 'debt.overdue' | 'payment.received' | 'homework.due' | 'attendance.missed';
  eventLabel: string;
  description: string;
  channel: 'telegram';
  template: string;
  enabled: boolean;
  triggeredCount: number;
  lastTriggered: string | null;
}

const NOW = Date.now();

const DEFAULT_RULES: MockRule[] = [
  {
    id: 'rule-debt-overdue',
    event: 'debt.overdue',
    eventLabel: 'Просрочка оплаты',
    description: 'Срабатывает через 3 дня после начала периода без платежа',
    channel: 'telegram',
    template:
      'Здравствуйте! У {student} просрочена оплата за {period}. Долг: {debt} сум. Пожалуйста, оплатите как можно скорее.',
    enabled: true,
    triggeredCount: 47,
    lastTriggered: new Date(NOW - 2 * 3600_000).toISOString(),
  },
  {
    id: 'rule-payment-received',
    event: 'payment.received',
    eventLabel: 'Платёж получен',
    description: 'Отправляется родителю сразу после проведения платежа',
    channel: 'telegram',
    template:
      'Здравствуйте! Оплата {amount} сум за {student} за {period} принята. Спасибо!',
    enabled: true,
    triggeredCount: 128,
    lastTriggered: new Date(NOW - 45 * 60_000).toISOString(),
  },
  {
    id: 'rule-homework-due',
    event: 'homework.due',
    eventLabel: 'Дедлайн ДЗ',
    description: 'За 24 часа до срока сдачи домашнего задания',
    channel: 'telegram',
    template:
      'Здравствуйте! Завтра {student} должен сдать домашнее задание по группе {group}. Проверьте, пожалуйста.',
    enabled: true,
    triggeredCount: 62,
    lastTriggered: new Date(NOW - 18 * 3600_000).toISOString(),
  },
  {
    id: 'rule-attendance-missed',
    event: 'attendance.missed',
    eventLabel: 'Пропуск занятия',
    description: 'В течение часа после занятия, если студент отмечен как отсутствующий',
    channel: 'telegram',
    template:
      'Здравствуйте! {student} сегодня пропустил занятие в группе {group}. Всё ли в порядке?',
    enabled: false,
    triggeredCount: 0,
    lastTriggered: null,
  },
];

export const MOCK_RULES: MockRule[] = loadMock('rules', DEFAULT_RULES);
