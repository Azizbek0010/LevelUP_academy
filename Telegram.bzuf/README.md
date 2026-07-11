# Telegram Bot Task - Bilol

This folder contains the Telegram bot implementation package for `TASK-telegram-bot.md`.
It is intentionally isolated from `backend/` and `frontend/` because the task request says
not to touch those folders directly.

## Scope Implemented

- Bind-token flow design and code:
  - `POST /api/telegram/bind-token`
  - Redis single-use token storage with TTL
  - Telegram deep-link generation
- Bot command handlers:
  - `/start` without payload
  - `/start <token>` with atomic token consumption
  - duplicate binding handling without 500
  - `/stop` unlink
- Notification delivery handlers:
  - existing notification types kept compatible
  - `payment.due_soon`
  - `announcement`
  - per-chat Telegram API try/catch so one blocked bot user does not break a batch
- Integration notes and test plan.

## Files

- `src/constants.js` - shared constants for token TTL and Redis key naming.
- `src/messages.js` - RU/UZ message catalog. Default language is RU until user language storage is agreed.
- `src/bind-token.service.js` - Redis-backed bind-token generator.
- `src/telegram.controller.js` - Express controller for the bind-token endpoint.
- `src/telegram.routes.js` - route definition with `authenticate`.
- `src/bot.handlers.js` - grammY `/start` and `/stop` command registration.
- `src/notification.handlers.js` - queue handler map and resolver helpers.
- `docs/integration-guide.md` - exact backend integration points.
- `docs/payload-contracts.md` - payload contracts to agree with Karis.
- `docs/open-questions.md` - decisions needed before touching backend.
- `docs/test-plan.md` - backend-style integration test checklist.
- `docs/push-log.md` - change log to include before pushing.
- `tests/run.js` - dependency-free logic tests for this isolated package.

## Integration Summary

When backend integration is approved, copy or move these files into:

```text
backend/src/modules/telegram/
backend/src/queues/workers/
```

Then wire:

- `app.js` -> `app.use('/api/telegram', telegramRoutes)`
- `bot.js` -> call `registerTelegramBotHandlers({ bot, pool, redis, logger })`
- `worker.js` -> start bot long-polling in worker process
- `notification.worker.js` -> use the exported `HANDLERS` from `notification.handlers.js`

No direct Telegram sending is used from HTTP code. The bind-token endpoint only creates a Redis token
and returns a deep-link.

## Local Check

From this folder:

```bash
npm test
npm run check
```
