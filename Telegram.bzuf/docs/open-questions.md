# Open Questions Before Backend Integration

These are the only points that need a decision before moving code into `backend/`.

## 1. Bot username source

Recommended: add `TELEGRAM_BOT_USERNAME` to backend env and `.env.example`.

Alternative: derive it with `bot.api.getMe()` on worker startup and cache it, but then the HTTP bind-token endpoint either needs cached state or a direct Telegram API call. The task rule says HTTP should not call Telegram directly, so env is cleaner.

## 2. Long-polling process

Recommended: start `bot.start()` inside `backend/worker.js`.

Alternative: create a separate `telegram.worker.js` process. This is cleaner at scale, but it requires deployment/process-manager changes.

## 3. User language

Recommended for first PR: default RU text, keep UZ catalog ready.

Alternative: add a `language` field to user profile/preferences later. That requires a migration and cross-team agreement, so it should not be hidden inside this task.

## 4. Announcement payload

Recommended: `announcement` must contain exactly one of `branchId` or `groupId`.

Alternative: allow both and let `groupId` win. This is more forgiving but can hide producer bugs.

