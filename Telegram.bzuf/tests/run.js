import assert from 'node:assert/strict';
import { TelegramBindTokenService } from '../src/bind-token.service.js';
import { createTelegramController } from '../src/telegram.controller.js';
import { registerTelegramBotHandlers } from '../src/bot.handlers.js';
import { sendToAll, resolveAnnouncementParentChatIds } from '../src/notification.handlers.js';

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
    console.log(`PASS ${name}`);
  } catch (err) {
    results.push({ name, pass: false, err });
    console.log(`FAIL ${name}`);
    console.log(`  ${err.message}`);
  }
}

function createFakeRedis() {
  const values = new Map();
  return {
    values,
    async set(key, value, _ex, _ttl, nx) {
      if (nx === 'NX' && values.has(key)) return null;
      values.set(key, value);
      return 'OK';
    },
    async getdel(key) {
      const value = values.get(key) ?? null;
      values.delete(key);
      return value;
    },
  };
}

function createFakeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function AppError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

await test('bind token is single-use and returns a deep link', async () => {
  const redis = createFakeRedis();
  const service = new TelegramBindTokenService({ redis, botUsername: 'levelup_bot' });

  const created = await service.createForUser('user-1');
  assert.equal(created.expiresIn, 600);
  assert.match(created.deepLink, /^https:\/\/t\.me\/levelup_bot\?start=/);

  const first = await service.consume(created.token);
  const second = await service.consume(created.token);
  assert.equal(first, 'user-1');
  assert.equal(second, null);
});

await test('bind-token controller allows only parent and student roles', async () => {
  const redis = createFakeRedis();
  const controller = createTelegramController({ redis, botUsername: 'levelup_bot', AppError });
  const res = createFakeResponse();

  await controller.createBindToken(
    { user: { id: 'parent-1', role: 'parent' } },
    res,
    (err) => {
      throw err;
    },
  );

  assert.equal(res.statusCode, 201);
  assert.equal(typeof res.body.token, 'string');

  let forbidden = null;
  await controller.createBindToken(
    { user: { id: 'admin-1', role: 'admin' } },
    createFakeResponse(),
    (err) => {
      forbidden = err;
    },
  );
  assert.equal(forbidden.statusCode, 403);
});

await test('/start consumes token and inserts telegram account', async () => {
  const redis = createFakeRedis();
  const tokenService = new TelegramBindTokenService({ redis, botUsername: 'levelup_bot' });
  const { token } = await tokenService.createForUser('student-1');
  const replies = [];
  const inserted = [];

  const bot = {
    handlers: {},
    command(name, handler) {
      this.handlers[name] = handler;
    },
    catch() {},
  };

  const pool = {
    async query(sql, params) {
      if (sql.includes('SELECT role FROM users')) return { rows: [{ role: 'student' }] };
      if (sql.includes('INSERT INTO telegram_accounts')) {
        inserted.push(params);
        return { rowCount: 1, rows: [] };
      }
      return { rows: [] };
    },
  };

  registerTelegramBotHandlers({ bot, pool, redis, logger: console });
  await bot.handlers.start({
    match: token,
    chat: { id: 12345 },
    reply: async (message) => replies.push(message),
  });

  assert.equal(inserted.length, 1);
  assert.deepEqual(inserted[0], ['student-1', 12345, 'student']);
  assert.equal(replies.length, 1);
});

await test('announcement resolver supports branch and group recipients', async () => {
  const calls = [];
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [{ tg_chat_id: 1 }, { tg_chat_id: 2 }] };
    },
  };

  assert.deepEqual(await resolveAnnouncementParentChatIds(pool, { branchId: 'branch-1' }), [1, 2]);
  assert.deepEqual(await resolveAnnouncementParentChatIds(pool, { groupId: 'group-1' }), [1, 2]);
  assert.equal(calls.length, 2);
});

await test('sendToAll logs one failed Telegram send and continues batch', async () => {
  const sent = [];
  const warnings = [];
  const bot = {
    api: {
      async sendMessage(chatId, text) {
        if (chatId === 2) throw new Error('blocked');
        sent.push({ chatId, text });
      },
    },
  };

  await sendToAll({
    bot,
    logger: { warn: (...args) => warnings.push(args) },
    chatIds: [1, 2, 3],
    text: 'hello',
  });

  assert.deepEqual(sent, [
    { chatId: 1, text: 'hello' },
    { chatId: 3, text: 'hello' },
  ]);
  assert.equal(warnings.length, 1);
});

const failed = results.filter((result) => !result.pass);
console.log(`\nTelegram.bzuf tests: ${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length > 0 ? 1 : 0);

