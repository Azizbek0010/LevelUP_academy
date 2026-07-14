import { TelegramBindTokenService } from './bind-token.service.js';

const allowedRoles = new Set(['student', 'parent']);

export function createTelegramController({ redis, botUsername, AppError }) {
  const service = new TelegramBindTokenService({ redis, botUsername });

  return {
    createBindToken: async (req, res, next) => {
      try {
        if (!allowedRoles.has(req.user?.role)) {
          throw new AppError(403, 'Only student and parent accounts can bind Telegram');
        }

        const payload = await service.createForUser(req.user.id);
        res.status(201).json(payload);
      } catch (err) {
        next(err);
      }
    },
  };
}

export { allowedRoles as telegramBindableRoles };
