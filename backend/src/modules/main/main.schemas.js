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

// Main Admin заводит партнёра: организация + её Super Admin + домен (+ опц. из заявки)
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
