import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/AppError.js';
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
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));
  app.use(createRateLimiter({ keyPrefix: 'rl:api', points: 300, duration: 60 }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

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
