import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['main_admin', 'superadmin', 'admin', 'mentor', 'methodist', 'parent', 'student']).optional(),
  status: z.enum(['active', 'frozen', 'graduated', 'dropped']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    email: z.string().email().max(160).optional(),
    avatarKey: z.string().max(512).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });
