import { Bot } from 'grammy';
import { env } from '../../config/env.js';

/**
 * grammY-инстанс для notification.worker (только исходящие bot.api.sendMessage).
 * Без токена (dev) bot = null — worker логирует вместо отправки.
 *
 * Регистрация /start + link-code (привязка student/parent) — отдельная задача
 * telegram-модуля, добавляется здесь же через bot.command(...) + bot.start().
 */
export const bot = env.TELEGRAM_BOT_TOKEN ? new Bot(env.TELEGRAM_BOT_TOKEN) : null;
