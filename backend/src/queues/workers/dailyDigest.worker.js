import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../../config/redis.js';
import { pool } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { sendToBranchGroup } from '../../modules/telegram/branchNotify.js';

const QUEUE_NAME = 'daily-digest';
const TZ = 'Asia/Tashkent';

const dailyDigestQueue = new Queue(QUEUE_NAME, { connection: redisConnection });

/**
 * Каждый день в 00:00 по Ташкенту — кто из вчерашних дедлайнов так и не сдал
 * ДЗ, в группу родителей филиала (пользовательский запрос 09.08.2026).
 *
 * ⚠️ ВАЖНО: этот крон физически не сработает на проде, пока не решён
 * BUG-NO-WORKER (TASK.md) — на Render сейчас нет `type: worker` сервиса,
 * поэтому worker.js вообще не запущен ни на каком инстансе. Код готов и
 * заработает сам, как только воркер поднимут — специально ничего обходить
 * здесь не стал (в отличие от ai-review/attendance/submitTest — те события,
 * не крон, и шлются прямо из web-процесса через bot.js).
 *
 * `tz` — явно, в отличие от overdue/billing.worker.js (там его нет и они на
 * самом деле крутятся по времени сервера, не Ташкента — не трогаю чужой код,
 * но для НОВОГО крона делаю правильно сразу).
 */
export async function scheduleDailyDigestCron() {
  await dailyDigestQueue.upsertJobScheduler(
    'daily-digest-midnight',
    { pattern: '0 0 * * *', tz: TZ },
    { name: 'daily-digest.run' },
  );
}

export const dailyDigestWorker = new Worker(
  QUEUE_NAME,
  async () => {
    const { rows } = await pool.query(
      `SELECT b.id AS branch_id, g.name AS group_name, h.title AS homework_title,
              u.first_name, u.last_name
         FROM homework h
         JOIN groups g ON g.id = h.group_id AND g.deleted_at IS NULL
         JOIN branches b ON b.id = h.branch_id AND b.parent_tg_chat_id IS NOT NULL AND b.deleted_at IS NULL
         JOIN group_students gs ON gs.group_id = g.id AND gs.left_at IS NULL
         JOIN users u ON u.id = gs.student_id AND u.deleted_at IS NULL AND u.status = 'active'
         LEFT JOIN homework_submissions s ON s.homework_id = h.id AND s.student_id = gs.student_id
        WHERE h.deleted_at IS NULL AND h.is_archived = false
          AND h.deadline >= (CURRENT_DATE - INTERVAL '1 day') AND h.deadline < CURRENT_DATE
          AND s.id IS NULL
        ORDER BY b.id, g.name, u.last_name, u.first_name`,
    );

    const byBranch = new Map();
    for (const r of rows) {
      if (!byBranch.has(r.branch_id)) byBranch.set(r.branch_id, []);
      byBranch.get(r.branch_id).push(r);
    }

    for (const [branchId, items] of byBranch) {
      const lines = items
        .map((r) => `• ${r.first_name} ${r.last_name} — «${r.homework_title}» (${r.group_name})`)
        .join('\n');
      const text = `<b>📌 Kecha muddati o'tgan, hali topshirilmagan uy vazifalari</b>\n\n${lines}`;
      // eslint-disable-next-line no-await-in-loop -- филиалов немного, последовательная отправка не критична
      const sent = await sendToBranchGroup(branchId, text);
      if (!sent) logger.warn({ branchId }, 'daily-digest: send failed or group not linked');
    }

    logger.info({ branches: byBranch.size, students: rows.length }, 'Daily digest completed');
  },
  { connection: redisConnection },
);

dailyDigestWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Daily digest job failed');
});

dailyDigestQueue.on('error', (err) => {
  logger.error({ err }, 'Daily digest queue redis error');
});
dailyDigestWorker.on('error', (err) => {
  logger.error({ err }, 'Daily digest worker redis error');
});
