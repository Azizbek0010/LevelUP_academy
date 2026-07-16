import { TelegramBindTokenService } from './bind-token.service.js';
import { env } from '../../config/env.js';
import { redis } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';

const allowedRoles = new Set(['student', 'parent']);

const bindTokenService = new TelegramBindTokenService({
  redis,
  botUsername: env.TELEGRAM_BOT_USERNAME || '',
});

export async function createBindToken(req, res, next) {
  try {
    if (!allowedRoles.has(req.user?.role)) {
      throw new AppError(403, 'Only student and parent accounts can bind Telegram');
    }

    const payload = await bindTokenService.createForUser(req.user.id);
    res.status(201).json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
}
