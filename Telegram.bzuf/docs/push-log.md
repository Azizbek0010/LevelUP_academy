# Push Log

Branch: `bilol/telegram-bot`

## 2026-07-09

Prepared isolated Telegram task implementation in `Telegram.bzuf/` without editing `backend/` or `frontend/`.

Changes included:

- Added Redis-backed bind-token service for one-time Telegram account linking.
- Added Express route/controller template for `POST /api/telegram/bind-token`.
- Added grammY `/start` and `/stop` handlers.
- Added queue notification handlers for `payment.due_soon` and `announcement`.
- Added safe per-recipient Telegram send handling.
- Added payload contracts and backend integration guide.
- Added manual/integration test plan.
- Added dependency-free tests for the isolated Telegram package.
- Added open questions that must be decided before backend integration.

Push command after review:

```bash
git push -u origin bilol/telegram-bot
```
