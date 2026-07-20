import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email');

// :id в пути
export const idParam = z.object({ id: z.string().uuid('Invalid id') });

// редактирование организации (Settings) — частичное; domain может быть пустым => null
const orgDomainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2, 'Too short').max(160),
    domain: z
      .union([
        z.string().trim().toLowerCase().regex(orgDomainRegex, 'Invalid domain'),
        z.literal(''),
        z.null(),
      ])
      .transform((v) => (v ? v : null)),
    // длительность урока (минуты) — применяется ко всем группам организации
    lessonDurationMin: z.coerce.number().int().min(10, 'Min 10 min').max(600, 'Max 600 min'),
    /* Сколько коинов ментор вправе выдать одному ученику за месяц. Бюджет
       группы = это число × её размер; 0 = раздача коинов запрещена. Потолок
       здесь только чтобы отсечь опечатку вида «1000000». */
    coinsPerStudent: z.coerce.number().int().min(0, 'Cannot be negative').max(1000, 'Max 1000'),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// редактирование филиала — частичное (хотя бы одно поле)
export const updateBranchSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().max(500),
    phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone'),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// редактирование админа — частичное (email/пароль тут не меняем)
export const updateAdminSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    branchId: z.string().uuid('Invalid branchId'),
    phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone'),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// заморозка / разморозка админа
export const freezeSchema = z.object({ frozen: z.boolean() });

// Super Admin создаёт филиал в своей организации
export const createBranchSchema = z.object({
  name: z.string().trim().min(2, 'Too short').max(120),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone').optional(),
});

// Super Admin создаёт админа и назначает в свой филиал.
// Логин (email) и пароль задаёт сам Super Admin (не генерятся).
export const createAdminSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  branchId: z.string().uuid('Invalid branchId'),
  phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone').optional(),
});

// ---------- методисты (без branchId — на уровне организации) ----------

export const createMethodistSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone').optional(),
});

export const updateMethodistSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone'),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const freezeMethodistSchema = z.object({ frozen: z.boolean() });

// ---------- объявления организации ----------

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
  targetType: z.enum(['all-staff', 'all-admins', 'all-mentors', 'all-parents', 'all-students']),
});

// ---------- статистика: период ----------

export const statsQuery = z.object({
  period: z.enum(['7d', '30d', '90d']).optional(),
});
