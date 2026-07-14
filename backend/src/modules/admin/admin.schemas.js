import { z } from 'zod';

// ---------- переиспользуемые примитивы ----------
const phone = z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone');
const name = (min = 1, max = 80) => z.string().trim().min(min).max(max);
// NUMERIC(12,2) — максимум 9 999 999 999.99
const money = z.coerce.number().positive().max(9_999_999_999);
const moneyNonNeg = z.coerce.number().nonnegative().max(9_999_999_999);

export const idParam = z.object({ id: z.string().uuid('Invalid id') });

export const groupStudentParams = z.object({
  id: z.string().uuid('Invalid id'),
  studentId: z.string().uuid('Invalid studentId'),
});

// ---------- расходы ----------
export const createExpenseSchema = z.object({
  category: z.string().trim().min(1).max(60),
  amount: money,
  spentAt: z.coerce.date().optional(),
  note: z.string().trim().max(1000).optional(),
});

export const listExpensesQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ---------- студенты ----------
// Admin заводит ученика: логин-код + пароль генерятся на бэке.
// Родитель опционален — если заведён, получает свой логин-код+пароль и привязывается.
export const createStudentSchema = z.object({
  firstName: name(),
  lastName: name(),
  phone,
  birthDate: z.coerce.date().optional(),
  groupId: z.string().uuid('Invalid groupId').optional(),
  parent: z
    .object({
      firstName: name(),
      lastName: name(),
      phone,
    })
    .optional(),
});

export const updateStudentSchema = z
  .object({
    firstName: name(),
    lastName: name(),
    phone,
    birthDate: z.coerce.date(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const freezeStudentSchema = z.object({
  frozen: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

export const listStudentsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().trim().max(120).optional(),
  groupId: z.string().uuid('Invalid groupId').optional(),
});

// ---------- менторы (Admin заводит в своём филиале, вход по email) ----------
const email = z.string().trim().toLowerCase().email('Invalid email');

export const createMentorSchema = z.object({
  firstName: name(),
  lastName: name(),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: phone.optional(),
});

export const freezeMentorSchema = z.object({ frozen: z.boolean() });

export const updateMentorSchema = z
  .object({
    firstName: name(),
    lastName: name(),
    phone,
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// ---------- группы ----------
const scheduleItem = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
});

export const createGroupSchema = z.object({
  name: name(2, 120),
  subject: name(1, 120),
  mentorId: z.string().uuid('Invalid mentorId'),
  monthlyPrice: moneyNonNeg,
  schedule: z.array(scheduleItem).max(14).optional(),
  room: z.string().trim().max(60).optional(),
});

export const updateGroupSchema = z
  .object({
    name: name(2, 120),
    subject: name(1, 120),
    mentorId: z.string().uuid('Invalid mentorId'),
    monthlyPrice: moneyNonNeg,
    schedule: z.array(scheduleItem).max(14),
    room: z.string().trim().max(60),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const addGroupStudentSchema = z.object({
  studentId: z.string().uuid('Invalid studentId'),
});

export const listGroupsQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
