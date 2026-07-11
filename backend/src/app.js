import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import coinsRoutes from './modules/coins/coins.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import mentorRoutes from './modules/mentor/mentor.routes.js';
import studentRoutes from './modules/student/student.routes.js';
import parentRoutes from './modules/parent/parent.routes.js';
import mainRoutes from './modules/main/main.routes.js';
import leadsRoutes from './modules/main/leads.routes.js';
import superRoutes from './modules/super/super.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import methodistRoutes from './modules/methodist/methodist.routes.js';

export function createApp() {
  const app = express();

  // за прокси Render/облака: доверяем 1 хопу, чтобы req.ip читался из
  // X-Forwarded-For (иначе rate-limiter считает всех клиентов одним IP).
  app.set('trust proxy', 1);

  app.use(helmet());
  // credentials: true требует конкретный Origin в ответе, а не '*' (браузер иначе блокирует
  // credentialed-запросы) — origin: true отражает Origin запроса динамически, то есть фактически
  // открыто для любого фронта, но остаётся совместимо с httpOnly refresh-cookie.
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(createRateLimiter({ keyPrefix: 'rl:api', points: 300, duration: 60 }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // --- API docs (swagger-jsdoc + swagger-ui-express) ---
  // No auth gate exists elsewhere for docs-style routes in this codebase, so we
  // default to the safer option: serve only outside production. In dev/test the
  // UI is fully public (no authenticate()) so partners' onboarding devs can browse
  // it without a token; in production it's not mounted at all (avoids exposing the
  // full endpoint/schema surface of a multi-tenant payments API to the internet).
  if (env.NODE_ENV !== 'production') {
    // helmet()'s default CSP blocks the inline <script>/<style> that
    // swagger-ui-express injects into its HTML page — relax it only for this path.
    const relaxCspForDocs = (_req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:;",
      );
      next();
    };
    app.use('/api/docs', relaxCspForDocs, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
  }

  // --- modules ---
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/leads', leadsRoutes); // ПУБЛИЧНЫЙ приём заявок с лендинга (без токена)
  app.use('/api/main', mainRoutes);   // Main Admin: онбординг партнёров, дашборд платформы
  app.use('/api/super', superRoutes); // Super Admin: филиалы + админы своей организации
  app.use('/api/admin', adminRoutes); // K-ADMIN: филиал — дашборд, расходы, студенты, группы
  app.use('/api/methodist', methodistRoutes); // METHODIST: тесты, ДЗ, аналитика
  app.use('/api/coins', coinsRoutes);       // AB: студент — баланс/история коинов
  app.use('/api/users', usersRoutes);       // AB-SHARED: профиль, список филиала
  app.use('/api/mentor', mentorRoutes);     // AB-MENTOR: davomat, ДЗ, тесты, зарплата
  app.use('/api/student', studentRoutes);   // AB-STUDENT: home, магазин, ДЗ, тесты, видео, лидерборд
  app.use('/api/parent', parentRoutes);     // AB-PARENT: обзор ребёнка (посещаемость/оценки/долг/коины)

  // 404 → errorHandler
  app.use((req, _res, next) => {
    next(new AppError(404, `Route ${req.method} ${req.path} not found`));
  });

  app.use(errorHandler); // всегда последним

  return app;
}
