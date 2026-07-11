# Integration Guide

The files in `Telegram.bzuf/src/` are written as backend-ready modules, but they are not wired into
`backend/` yet because the current task instruction says not to touch backend/frontend directly.

## 1. Environment

Add this placeholder when backend env changes are approved:

```env
TELEGRAM_BOT_USERNAME=your_bot_username_without_at
```

Reason: `POST /api/telegram/bind-token` must return `https://t.me/<bot>?start=<token>` without calling
Telegram API from HTTP code.

## 2. Copy Modules

Recommended target paths:

```text
Telegram.bzuf/src/constants.js             -> backend/src/modules/telegram/constants.js
Telegram.bzuf/src/messages.js              -> backend/src/modules/telegram/messages.js
Telegram.bzuf/src/bind-token.service.js    -> backend/src/modules/telegram/bind-token.service.js
Telegram.bzuf/src/telegram.controller.js   -> backend/src/modules/telegram/telegram.controller.js
Telegram.bzuf/src/telegram.routes.js       -> backend/src/modules/telegram/telegram.routes.js
Telegram.bzuf/src/bot.handlers.js          -> backend/src/modules/telegram/bot.handlers.js
Telegram.bzuf/src/notification.handlers.js -> backend/src/queues/workers/notification.handlers.js
```

## 3. Wire API Route

In `backend/src/app.js`:

```js
import { redis } from './config/redis.js';
import { env } from './config/env.js';
import { authenticate } from './middlewares/authenticate.js';
import { AppError } from './utils/AppError.js';
import { createTelegramRoutes } from './modules/telegram/telegram.routes.js';

const telegramRoutes = createTelegramRoutes({
  authenticate,
  redis,
  botUsername: env.TELEGRAM_BOT_USERNAME,
  AppError,
});

app.use('/api/telegram', telegramRoutes);
```

This adds:

```text
POST /api/telegram/bind-token
```

The route is behind `authenticate` and only accepts `student` and `parent`.

## 4. Wire Bot Commands

In `backend/src/modules/telegram/bot.js`, after creating `bot`:

```js
import { pool } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { registerTelegramBotHandlers } from './bot.handlers.js';

export const bot = env.TELEGRAM_BOT_TOKEN ? new Bot(env.TELEGRAM_BOT_TOKEN) : null;
registerTelegramBotHandlers({ bot, pool, redis, logger });
```

## 5. Start Long-Polling

Preferred option: start long-polling in `backend/worker.js`, not in the HTTP server.

```js
if (bot) {
  bot.start();
  logger.info('Telegram bot long-polling started');
}
```

On shutdown:

```js
bot?.stop();
```

This keeps Telegram polling in the background worker process together with queue delivery.

## 6. Wire Notification Handlers

Replace the inline `HANDLERS`, `resolveChatIds`, `sendToAll`, and `fmt` block in
`backend/src/queues/workers/notification.worker.js` with imports from `notification.handlers.js`.

Example:

```js
import { createNotificationHandlers } from './notification.handlers.js';

const HANDLERS = createNotificationHandlers({ pool, bot, logger });
```

The worker constructor can stay unchanged.
