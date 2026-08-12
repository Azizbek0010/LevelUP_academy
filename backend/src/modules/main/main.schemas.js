import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Invalid email');
const domain = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, 'Invalid domain (например marsit-school.us)');

// Main Admin меняет цены платформы (все суммы в сумах, целые, ≥ 0).
// partial — можно прислать только те поля, что меняются.
export const updatePricingSchema = z
  .object({
    baseFirstBranch: z.number().int().nonnegative(),
    perExtraBranch: z.number().int().nonnegative(),
    perStudent: z.number().int().nonnegative(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// Main Admin заводит партнёра: организация + её SEO + домен (+ опц. из заявки)
export const onboardPartnerSchema = z.object({
  organizationName: z.string().trim().min(2, 'Too short').max(160),
  domain: domain.optional(),
  leadId: z.string().uuid('Invalid leadId').optional(),
  admin: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email,
    phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone').optional(),
  }),
});

// ---- заявки с лендинга (leads) ----

const LEAD_STATUSES = ['new', 'contacted', 'onboarded', 'rejected'];

// ПУБЛИЧНАЯ форма лендинга (без токена). name+phone обязательны.
export const leadSubmitSchema = z.object({
  name: z.string().trim().min(2, 'Too short').max(120),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,32}$/, 'Invalid phone'),
  centerName: z.string().trim().max(160).optional(),
  centerSize: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
});

// фильтр списка заявок по статусу (?status=new) — опционально
export const leadListQuery = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
});

// Main Admin меняет статус/заметку заявки (partial, хотя бы одно поле)
export const leadUpdateSchema = z
  .object({
    status: z.enum(LEAD_STATUSES),
    notes: z.string().trim().max(2000),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

// id в пути
export const idParam = z.object({ id: z.string().uuid('Invalid id') });

// Main Admin активирует/замораживает организацию-партнёра
export const partnerStatusSchema = z.object({
  status: z.enum(['active', 'frozen']),
});

// ---- каталог платных фич ----

export const createAddonFeatureSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(80),
  price: z.number().int().nonnegative(),
});

export const updateAddonFeatureSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    price: z.number().int().nonnegative(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const featureKeyParam = z.object({ key: z.string().trim().min(1).max(60) });
export const partnerFeatureKeyParam = z.object({ id: z.string().uuid('Invalid id'), key: z.string().trim().min(1).max(60) });

export const setPartnerFeatureSchema = z.object({ enabled: z.boolean() });

// ---- биллинг партнёра ----

export const recordPaymentSchema = z.object({
  amount: z.number().int().nonnegative(),
  method: z.enum(['cash', 'card', 'transfer', 'other']),
  periodCovered: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format: YYYY-MM'),
});

export const grantBonusSchema = z.object({
  months: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

// ---- собственные расходы платформы ----

// ---- заявки SEO на фичи ----

export const featureRequestListQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const decideFeatureRequestSchema = z.object({
  decision: z.enum(['approve', 'reject']),
});

export const createExpenseSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(160),
  amount: z.number().int().positive(),
  category: z.string().trim().max(60).optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD').optional(),
});

// ---- объявления платформы ----

// Аудитории совпадают с enum `platform_announcement_target` в БД.
// 'specific' — точечно на список партнёров, organizationIds обязателен и непуст.
export const createAnnouncementSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    body: z.string().trim().min(1, 'Body is required'),
    targetType: z.enum(['all-partners', 'all-seo', 'specific']),
    organizationIds: z.array(z.string().uuid()).optional(),
  })
  .refine((v) => v.targetType !== 'specific' || (v.organizationIds && v.organizationIds.length > 0), {
    message: 'organizationIds is required and non-empty when targetType is "specific"',
    path: ['organizationIds'],
  });

// ---- профиль main_admin ----

// partial: приходит только то, что реально меняют.
// email нельзя стереть в null — он идентификатор входа main_admin (Google OAuth тоже по нему).
export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email,
    phone: z.string().trim().regex(/^\+?\d{7,20}$/, 'Invalid phone'),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });
