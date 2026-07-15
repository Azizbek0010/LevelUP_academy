# Telegram Bot Test Plan

Use backend's live DB/Redis test style from `backend/tests/mentor/run.js`.

## Bind Token

- Parent/student authenticated request to `POST /api/telegram/bind-token` returns:
  - `token`
  - `expiresIn: 600`
  - `deepLink`
- Non-parent/student roles receive 403.
- Redis key `telegram:bind:<token>` exists with TTL.
- Token is consumed with `GETDEL`; the second `/start <same-token>` fails with a clear message.

## `/start`

- `/start` without payload returns instructions.
- `/start <valid-token>` inserts one row into `telegram_accounts`.
- Duplicate same user does not throw 500.
- Duplicate same chat does not throw 500.
- Expired/invalid token gives a clear "get a new code" message.

## `/stop`

- Existing binding is deleted by `tg_chat_id`.
- Missing binding still returns a friendly response.

## Notifications

- `payment.due_soon` resolves parent chat IDs and sends one message.
- `announcement` with `branchId` sends to all linked parents in branch.
- `announcement` with `groupId` sends to linked parents of active group students.
- A send error for one chat ID is logged and the remaining recipients still receive messages.

## Coordination Checks

- HTTP code does not call `bot.api.sendMessage`.
- Payment tables are not written by Bilol's code.
- `announcement` endpoint remains owned by Karis.

