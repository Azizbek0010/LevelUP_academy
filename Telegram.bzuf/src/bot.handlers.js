import { messages } from './messages.js';
import { TelegramBindTokenService } from './bind-token.service.js';

export function registerTelegramBotHandlers({ bot, pool, redis, logger, language = 'ru' }) {
  if (!bot) return;

  const t = messages(language);
  const bindTokens = new TelegramBindTokenService({ redis, botUsername: 'unused-for-consume-only' });

  bot.command('start', async (ctx) => {
    const token = String(ctx.match || '').trim();
    if (!token) {
      await ctx.reply(t.startHelp);
      return;
    }

    const userId = await bindTokens.consume(token);
    if (!userId) {
      await ctx.reply(t.tokenInvalid);
      return;
    }

    const chatId = ctx.chat?.id;
    if (!chatId) {
      await ctx.reply(t.genericError);
      return;
    }

    try {
      const role = await resolveTelegramRole(pool, userId);
      if (!role) {
        await ctx.reply(t.tokenInvalid);
        return;
      }

      await pool.query(
        `INSERT INTO telegram_accounts (user_id, tg_chat_id, tg_role)
         VALUES ($1, $2, $3)`,
        [userId, chatId, role],
      );

      await ctx.reply(t.bindSuccess);
    } catch (err) {
      if (err?.code === '23505') {
        await replyDuplicateBinding({ pool, ctx, userId, chatId, messages: t });
        return;
      }

      logger?.error({ err, userId, chatId }, 'Telegram bind failed');
      await ctx.reply(t.genericError);
    }
  });

  bot.command('stop', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) {
      await ctx.reply(t.stopMissing);
      return;
    }

    const { rowCount } = await pool.query(
      `DELETE FROM telegram_accounts WHERE tg_chat_id = $1`,
      [chatId],
    );

    await ctx.reply(rowCount > 0 ? t.stopSuccess : t.stopMissing);
  });

  bot.catch((err) => {
    logger?.error({ err }, 'Telegram bot command error');
  });
}

async function resolveTelegramRole(pool, userId) {
  const { rows } = await pool.query(
    `SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL AND status = 'active'`,
    [userId],
  );

  const role = rows[0]?.role;
  return role === 'student' || role === 'parent' ? role : null;
}

async function replyDuplicateBinding({ pool, ctx, userId, chatId, messages: t }) {
  const { rows } = await pool.query(
    `SELECT user_id, tg_chat_id
       FROM telegram_accounts
      WHERE user_id = $1 OR tg_chat_id = $2
      LIMIT 1`,
    [userId, chatId],
  );

  const existing = rows[0];
  if (existing?.user_id === userId) {
    await ctx.reply(t.alreadyLinkedUser);
    return;
  }

  await ctx.reply(t.alreadyLinkedChat);
}

