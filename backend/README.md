# LevelUp Academy — Backend

Multi-tenant Educational CRM (SaaS). Express + PostgreSQL + Redis + Socket.io + BullMQ + MinIO/S3 + Telegram Bot.

Architecture: [`docs/BACKEND-ARCHITECTURE.md`](../docs/BACKEND-ARCHITECTURE.md) · Task split: [`TASKS.md`](./TASKS.md)

## Quick start

```bash
cp .env.example .env        # fill JWT_ACCESS_SECRET (min 32 chars)
docker compose up -d        # Postgres 16, Redis 7, MinIO, Mailpit
npm install
npm run migrate             # apply schema
npm run seed                # main_admin + demo org/branch/superadmin
npm run dev                 # API on :4000
npm run worker:dev          # background worker (separate terminal)
```

- MinIO console: http://localhost:9001 (minioadmin/minioadmin) — create bucket `levelup`
- Mailpit UI: http://localhost:8025
- Health check: http://localhost:4000/health

## Processes

| Process | Entry | Purpose |
|---|---|---|
| API | `src/server.js` | REST + Socket.io |
| Worker | `worker.js` | Telegram notifications, overdue cron (09:00) |

## Conventions

- ES Modules, feature-based structure: `routes → controller → service → repository`
- All notifications go through `notificationQueue.add(name, payload)` — never call TG/SMTP/SMS from HTTP code (exception: auth OTP)
- Coins change only via `changeCoins()` (gamification module)
- Money tables (`invoices`, `transactions`, `payment_schedules`, `expenses`, billing) — Karis's zone
- Every scoped query filters by `organization_id` + `branch_id` (when not null) and `deleted_at IS NULL`
- Branches: `karis/*`, `abdulaziz/*`; commits in English
