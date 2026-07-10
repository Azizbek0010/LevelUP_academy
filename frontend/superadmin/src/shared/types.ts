export const ROLES = ['student', 'parent', 'mentor', 'admin', 'superadmin'] as const;
export type Role = (typeof ROLES)[number];

export const ATTENDANCE_STATUSES = ['present', 'absent', 'unknown'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'card', 'split'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const GROUP_STATUSES = ['active', 'archived'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
