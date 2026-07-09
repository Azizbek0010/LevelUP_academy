# LevelUp Academy — MASTER TASK LIST

> Bu fayl — barcha vazifalarning yagona manbaidir. `done.md` avtomatik yangilanadi.
> Task `[x]` ga o'zgartirilganda, `scripts/update-done.py` orqali `done.md` yangilanadi.

---

## Backend — Auth (Karis)

- [x] K-AUTH: login (phone + argon2id), JWT access 15m
- [x] K-AUTH: Refresh rotation (30d httpOnly cookie), logout, frozen-check (403)
- [ ] K-AUTH: SMS OTP forgot/reset password (Redis TTL 5m, rate limit)
- [x] K-AUTH: SMTP OTP/password change emails
- [x] K-AUTH: authenticate + authorize middlewares (RBAC + org+branch scope)

## Backend — Main Admin (Karis)

- [x] K-MAIN: Public endpoint forms -> leads table
- [x] K-MAIN: Lead panel: list, status change, notes
- [x] K-MAIN: Partner onboarding: POST /api/main/partners
- [x] K-MAIN: Platform dashboard: GET /api/main/dashboard
- [x] K-MAIN: Billing: config/plans.js (pro/max) + monthlyBill()
- [ ] K-MAIN: Partner profit in dashboard (income - expenses)
- [ ] K-MAIN: Partner management: freeze/activate, plan change

## Backend — Super Admin (Karis)

- [ ] K-SUPER: Organization dashboard (income, scope = organization_id)
- [ ] K-SUPER: CRUD branches; CRUD admins; org reports

## Backend — Admin (Karis)

- [ ] K-ADMIN: Branch dashboard: income + expenses = profit
- [ ] K-ADMIN: Expenses CRUD
- [ ] K-ADMIN: Branch students (CRUD, freeze); groups (CRUD, assign mentor)
- [ ] K-ADMIN: Payments: full + split + Nasiya + refund/void + receipts S3
- [ ] K-ADMIN: Branch reports (revenue, debts by group)

## Backend — Tests (Karis)

- [ ] K-TEST: Integration tests for payments (full/split/Nasiya)
- [ ] K-TEST: Auth flow tests (login -> refresh -> reuse-detect -> OTP)

## Backend — Infrastructure (Abdulaziz)

- [x] AB-INFRA: Scaffold + structure + deps + docker-compose
- [x] AB-INFRA: config/ (env, db, redis, s3, mailer, sms, logger)
- [x] AB-INFRA: utils/ + middlewares (validate, rateLimiter, archiveGuard, errorHandler)
- [x] AB-INFRA: app.js + server.js
- [x] AB-INFRA: Migrations (node-pg-migrate) — full DDL
- [x] AB-INFRA: Sockets (redis-adapter, socketAuth, presence, chat)
- [x] AB-INFRA: Queues (BullMQ notification + overdue worker)
- [x] AB-INFRA: Telegram bot (grammy)

## Backend — Mentor (Abdulaziz)

- [x] AB-MENTOR: Attendance (bulk-upsert)
- [x] AB-MENTOR: Homework check (0-max + coin_reward)
- [x] AB-MENTOR: Test constructor (questions JSONB)
- [x] AB-MENTOR: Exam with timer
- [x] AB-MENTOR: Coins +/- via changeCoins()
- [x] AB-MENTOR: Mentor salary (mentor_salaries)
- [x] AB-MENTOR: Manual coin assignment POST /api/mentor/coins
- [x] AB-MENTOR: Mentor groups read overview

## Backend — Student (Abdulaziz)

- [x] AB-STUDENT: Home (coins/debt/ranking/groups/deadlines)
- [x] AB-STUDENT: Shop (FOR UPDATE, rollback on insufficient)
- [x] AB-STUDENT: Tests (timer, scoring, reward >= 50%)
- [x] AB-STUDENT: Homework (presigned S3)
- [x] AB-STUDENT: Videos (by membership)
- [x] AB-STUDENT: Leaderboards week/month (Redis ZSET)

## Backend — Parent (Abdulaziz)

- [x] AB-PARENT: Child overview (coins, debt, ranking, groups, attendance, grades)
- [x] AB-PARENT: Ownership guard assertParentOwnsChild

## Backend — Shared (Abdulaziz)

- [x] AB-SHARED: users module (profile, branch list)
- [x] AB-SHARED: db/seeds (demo data, idempotent)
- [x] AB-SHARED: Coin foundation: coins.changeCoins()

---

## Frontend — Auth (Elyor)

- [ ] AUTH: Login page (3 roles: main, staff, member)
- [ ] AUTH: ProtectedRoute + RoleGuard
- [ ] AUTH: Router setup by roles
- [ ] AUTH: Redux store + authSlice
- [ ] AUTH: Axios interceptor (auto-refresh)
- [ ] AUTH: Socket.io client

## Frontend — Super Admin (Said Islom, Aziz, sxvs)

- [ ] SUPER: Dashboard (org income, branches, admins, students)
- [ ] SUPER: CRUD branches (Branches -> BranchDetail)
- [ ] SUPER: CRUD admins
- [ ] SUPER: Reports
- [ ] SUPER: Organization settings
- [ ] SUPER: Methodists
- [ ] SUPER: Analytics

## Frontend — Admin (Abduloh, Odil, Hamidula)

- [ ] ADMIN: Dashboard (income + expenses = profit)
- [ ] ADMIN: Students CRUD
- [ ] ADMIN: Groups CRUD
- [ ] ADMIN: Payments (full/split)
- [ ] ADMIN: Expenses CRUD
- [ ] ADMIN: Reports

## Frontend — Mentor (Sardor, Kozim, Alish)

- [ ] MENTOR: Dashboard (groups, upcoming lessons)
- [ ] MENTOR: Attendance journal
- [ ] MENTOR: Homework (check, grades)
- [ ] MENTOR: Tests (create, results)
- [ ] MENTOR: Coins (assign/deduct)

## Frontend — Student

- [ ] STUDENT: Home (coins, groups, deadlines)
- [ ] STUDENT: Tests
- [ ] STUDENT: Homework
- [ ] STUDENT: Shop
- [ ] STUDENT: Videos
- [ ] STUDENT: Leaderboard

## Frontend — Parent

- [ ] PARENT: Child overview
- [ ] PARENT: Chat

## Frontend — Landing Page

- [x] LANDING: Home, Features, Roles, Finance, Gamification, Contacts
- [x] LANDING: Header, Footer, CTA

## Frontend — Methodist

- [ ] METHODIST: Training Types (CRUD)
- [ ] METHODIST: Topics (CRUD)
- [ ] METHODIST: Lessons (CRUD + LessonEditor)
- [ ] METHODIST: Analytics
- [ ] METHODIST: Dashboard

---

## Statistika

- Jami tasklar: 73
- Tugallangan: 32
- Jarayonda: 0
- Qolgan: 41
