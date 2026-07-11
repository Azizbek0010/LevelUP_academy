import { messages } from './messages.js';

export function createNotificationHandlers({ pool, bot, logger, language = 'ru' }) {
  const t = messages(language);

  return {
    'coins.changed': async ({ studentId, amount, reason }) => {
      const chatIds = await resolveChatIds(pool, studentId, ['student', 'parent']);
      await sendToAll({ bot, logger, chatIds, text: t.coinsChanged({ amount, reason }) });
    },

    'payment.received': async ({ studentId, amount }) => {
      const chatIds = await resolveChatIds(pool, studentId, ['parent']);
      await sendToAll({ bot, logger, chatIds, text: t.paymentReceived({ amount }) });
    },

    'debt.overdue': async ({ studentId, amount, dueDate }) => {
      const chatIds = await resolveChatIds(pool, studentId, ['parent']);
      await sendToAll({ bot, logger, chatIds, text: t.debtOverdue({ amount, dueDate }) });
    },

    'payment.due_soon': async ({ studentId, amount, dueDate }) => {
      const chatIds = await resolveChatIds(pool, studentId, ['parent']);
      await sendToAll({ bot, logger, chatIds, text: t.paymentDueSoon({ amount, dueDate }) });
    },

    'homework.due': async ({ studentId, title, deadline }) => {
      const chatIds = await resolveChatIds(pool, studentId, ['student']);
      await sendToAll({ bot, logger, chatIds, text: t.homeworkDue({ title, deadline }) });
    },

    announcement: async ({ branchId, groupId, text, date }) => {
      const chatIds = await resolveAnnouncementParentChatIds(pool, { branchId, groupId });
      await sendToAll({ bot, logger, chatIds, text: t.announcement({ text, date }) });
    },
  };
}

export async function resolveChatIds(pool, studentId, roles) {
  const { rows } = await pool.query(
    `SELECT ta.tg_chat_id
       FROM telegram_accounts ta
       JOIN users u ON u.id = ta.user_id
  LEFT JOIN student_profiles sp ON sp.parent_id = ta.user_id
      WHERE (ta.user_id = $1 AND 'student' = ANY($2))
         OR (sp.user_id = $1 AND 'parent' = ANY($2))`,
    [studentId, roles],
  );

  return rows.map((row) => row.tg_chat_id);
}

export async function resolveAnnouncementParentChatIds(pool, { branchId, groupId }) {
  if (!branchId && !groupId) {
    throw new Error('announcement requires branchId or groupId');
  }

  if (groupId) {
    const { rows } = await pool.query(
      `SELECT DISTINCT ta.tg_chat_id
         FROM group_students gs
         JOIN student_profiles sp ON sp.user_id = gs.student_id
         JOIN telegram_accounts ta ON ta.user_id = sp.parent_id
        WHERE gs.group_id = $1
          AND gs.left_at IS NULL
          AND sp.parent_id IS NOT NULL`,
      [groupId],
    );
    return rows.map((row) => row.tg_chat_id);
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT ta.tg_chat_id
       FROM student_profiles sp
       JOIN telegram_accounts ta ON ta.user_id = sp.parent_id
      WHERE sp.branch_id = $1
        AND sp.parent_id IS NOT NULL`,
    [branchId],
  );

  return rows.map((row) => row.tg_chat_id);
}

export async function sendToAll({ bot, logger, chatIds, text }) {
  if (!bot) {
    logger?.warn({ chatIds, text }, '[dev] Telegram delivery skipped because TELEGRAM_BOT_TOKEN is not set');
    return;
  }

  for (const chatId of chatIds) {
    try {
      await bot.api.sendMessage(chatId, text);
    } catch (err) {
      logger?.warn({ err, chatId }, 'Telegram message delivery failed; continuing batch');
    }
  }
}

