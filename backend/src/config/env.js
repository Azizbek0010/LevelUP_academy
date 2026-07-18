import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1),
  // managed Postgres (Neon и т.п.) требует TLS — на локальном docker оставляем false
  DB_SSL: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().default('levelup'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASS: z.string().optional().or(z.literal('')),
  SMTP_FROM: z.string().default('no-reply@levelup.local'),

  SMS_API_URL: z.string().url().optional().or(z.literal('')),
  SMS_API_TOKEN: z.string().optional().or(z.literal('')),

  TELEGRAM_BOT_TOKEN: z.string().optional().or(z.literal('')),
  TELEGRAM_BOT_USERNAME: z.string().optional().or(z.literal('')),

  // Google/Firebase вход: Web client ID (из Firebase → Auth → Google → Web SDK).
  // Публичное значение. Пусто → /api/auth/google отдаёт 503.
  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal('')),

  // за сколько дней до due_date слать родителям напоминание payment.due_soon
  DUE_SOON_REMINDER_DAYS: z.coerce.number().int().positive().default(2),

  SEED_MAIN_ADMIN_PHONE: z.string().default('+998900000000'),
  SEED_MAIN_ADMIN_EMAIL: z.string().email().default('hp8187081014laptop@gmail.com'),
  SEED_MAIN_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
  SEED_SUPERADMIN_EMAIL: z.string().email().default('azizbekamangeldiev.2010@gmail.com'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // fail-fast: приложение не должно стартовать с битым окружением
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
