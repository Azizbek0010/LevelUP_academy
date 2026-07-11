import { Router } from 'express';
import { createTelegramController } from './telegram.controller.js';

export function createTelegramRoutes({ authenticate, redis, botUsername, AppError }) {
  const router = Router();
  const controller = createTelegramController({ redis, botUsername, AppError });

  router.post('/bind-token', authenticate, controller.createBindToken);

  return router;
}
