# Telegram


[← back to index](./README.md)

### POST `/api/telegram/bind-token`
Issue a one-time token to link the caller's account to the Telegram bot

Student and parent accounts only — any other role gets 403. Returns a short-lived token (kept in Redis, single-use) plus a ready deep link; opening the link starts the bot with the token, which the bot then consumes to bind the chat to the user.


**Auth:** Bearer JWT required
**Role(s):** authenticated

**Responses:**

- **201** — Token issued
  - `success`: boolean (optional) _e.g. true_
  - `data` (optional):
    - `token`: string (optional)
    - `expiresIn`: integer (optional) — TTL in seconds
    - `deepLink`: string (optional) _e.g. "https://t.me/levelup_bot?start=abc123"_

- **401** — Missing/invalid/expired bearer token
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

- **403** — Caller is not a student or parent
  - **ErrorResponse**:
    - `success`: boolean **(required)** _e.g. false_
    - `message`: string **(required)**
    - `details` (optional):
      - _(free-form object)_
    - `stack`: string (optional) — Only present when NODE_ENV=development

---
