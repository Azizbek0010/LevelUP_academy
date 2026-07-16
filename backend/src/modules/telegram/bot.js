import { Bot } from 'grammy';
import { env } from '../../config/env.js';
import { pool } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { registerTelegramBotHandlers } from './bot.handlers.js';

/**
 * grammY-инстанс для notification.worker (только исходящие bot.api.sendMessage).
 * Без токена (dev) bot = null — worker логирует вместо отправки.
 *
 * /start + link-code (привязка student/parent) регистрируются при загрузке модуля
 * через registerTelegramBotHandlers.
 */
export const bot = env.TELEGRAM_BOT_TOKEN ? new Bot(env.TELEGRAM_BOT_TOKEN) : null;

if (bot) {
  registerTelegramBotHandlers({ bot, pool, redis, logger });
}

