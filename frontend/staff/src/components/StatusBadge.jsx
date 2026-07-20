/**
 * StatusBadge — единый компонент для статусных пилюль во всех панелях.
 *
 * Поддерживает предопределённые маппинги статус → цвет + опциональную метку.
 * Если label не передан, используется `status` как есть.
 *
 * Цветовые группы:
 *   green: active, success, paid, completed
 *   amber: pending, warning, partially_paid, waiting
 *   red:   failed, inactive, error, cancelled, frozen, overdue, rejected
 *   blue:  sent, info
 *   gray:  всё остальное (по умолчанию)
 */

const COLOR_MAP = {
  /* ── Green (success) ── */
  active:       { bg: '#2ECC7115', text: '#2ECC71', dot: '#2ECC71' },
  success:      { bg: '#2ECC7115', text: '#2ECC71', dot: '#2ECC71' },
  paid:         { bg: '#2ECC7115', text: '#2ECC71', dot: '#2ECC71' },
  completed:    { bg: '#2ECC7115', text: '#2ECC71', dot: '#2ECC71' },
  present:      { bg: '#2ECC7115', text: '#2ECC71', dot: '#2ECC71' },

  /* ── Amber (warning) ── */
  pending:      { bg: '#F59E0B15', text: '#F59E0B', dot: '#F59E0B' },
  warning:      { bg: '#F59E0B15', text: '#F59E0B', dot: '#F59E0B' },
  partially_paid: { bg: '#F59E0B15', text: '#F59E0B', dot: '#F59E0B' },
  waiting:      { bg: '#F59E0B15', text: '#F59E0B', dot: '#F59E0B' },
  late:         { bg: '#F59E0B15', text: '#F59E0B', dot: '#F59E0B' },

  /* ── Red (danger) ── */
  failed:       { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  inactive:     { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  error:        { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  cancelled:    { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  frozen:       { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  overdue:      { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  rejected:     { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },
  absent:       { bg: '#E8543E15', text: '#E8543E', dot: '#E8543E' },

  /* ── Gray (neutral) ── */
  archived:     { bg: '#6B728010', text: '#6B7280', dot: '#6B7280' },

  /* ── Blue (info) ── */
  sent:         { bg: '#3B82F615', text: '#3B82F6', dot: '#3B82F6' },
  info:         { bg: '#3B82F615', text: '#3B82F6', dot: '#3B82F6' },
};

const DEFAULT_COLOR = { bg: '#6B728010', text: '#6B7280', dot: '#6B7280' };

export const STATUS_LABELS = {
  active: 'Активен',
  frozen: 'Заморожен',
  paid: 'Оплачен',
  partially_paid: 'Частично',
  pending: 'Ожидает',
  overdue: 'Просрочен',
  cancelled: 'Отменён',
  completed: 'Завершён',
  sent: 'Отправлено',
  failed: 'Ошибка',
  rejected: 'Отклонён',
  archived: 'Архив',
  absent: 'Отсутствует',
  present: 'Присутствует',
  late: 'Опоздал',
};

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  showDot = true,
  className = '',
}) {
  const config = COLOR_MAP[status?.toLowerCase()] || DEFAULT_COLOR;
  const displayLabel = label ?? (STATUS_LABELS[status?.toLowerCase()] || status || '—');

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap leading-none ${sizeClasses} ${className}`}
      style={{ background: config.bg, color: config.text }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: config.dot }}
        />
      )}
      {displayLabel}
    </span>
  );
}
