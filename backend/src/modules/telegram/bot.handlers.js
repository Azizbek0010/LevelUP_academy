import { messages } from './messages.js';
import { TelegramBindTokenService } from './bind-token.service.js';
import { TelegramLoginNonceService } from './login-nonce.service.js';
import { LOGIN_PAYLOAD_PREFIX } from './constants.js';

export function registerTelegramBotHandlers({ bot, pool, redis, logger, language = 'ru' }) {
  if (!bot) return;

  const t = messages(language);
  const bindTokens = new TelegramBindTokenService({ redis, botUsername: 'unused-for-consume-only' });
  const loginNonces = new TelegramLoginNonceService({ redis, botUsername: 'unused-for-approve-only' });

  bot.command('start', async (ctx) => {
    const payload = String(ctx.match || '').trim();
    if (!payload) {
      await ctx.reply(t.startHelp);
      return;
    }

    // Один deep-link на две операции — тип зашит в payload (см. constants.js).
    if (payload.startsWith(LOGIN_PAYLOAD_PREFIX)) {
      await handleLogin({ ctx, pool, loginNonces, logger, messages: t, payload });
      return;
    }

    await handleBind({ ctx, pool, bindTokens, logger, messages: t, token: payload });
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

/**
 * Вход. Намеренно НИЧЕГО не создаёт: если чат не привязан — отказ и подсказка.
 * Привязка возможна только из кабинета, где человек уже ввёл логин и пароль;
 * иначе открывший ссылку входа мог бы присвоить себе чужой аккаунт.
 */
async function handleLogin({ ctx, pool, loginNonces, logger, messages: t, payload }) {
  const nonce = payload.slice(LOGIN_PAYLOAD_PREFIX.length);
  const chatId = ctx.chat?.id;
  if (!chatId) {
    await ctx.reply(t.genericError);
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.status
         FROM telegram_accounts ta
         JOIN users u ON u.id = ta.user_id
        WHERE ta.tg_chat_id = $1
          AND u.deleted_at IS NULL`,
      [chatId],
    );

    const user = rows[0];
    if (!user || user.status !== 'active') {
      await ctx.reply(t.loginNotLinked);
      return;
    }

    // false = ключа нет: nonce протух или его никто не выдавал. Молча «успех»
    // показывать нельзя — вкладка всё равно не откроется, человек будет ждать.
    const approved = await loginNonces.approve(nonce, user.id);
    await ctx.reply(approved ? t.loginSuccess : t.loginExpired);
  } catch (err) {
    logger?.error({ err, chatId }, 'Telegram login approve failed');
    await ctx.reply(t.genericError);
  }
}

async function handleBind({ ctx, pool, bindTokens, logger, messages: t, token }) {
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
      `INSERT INTO telegram_accounts (user_id, tg_chat_id, tg_role, tg_username, tg_first_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, chatId, role, ctx.from?.username ?? null, ctx.from?.first_name ?? null],
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
