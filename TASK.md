# LevelUp Academy — MASTER TASK LIST

> Bu fayl — barcha vazifalarning yagona manbaidir. `done.md` avtomatik yangilanadi (`scripts/update-done.py`).
> Statistika qo'lda YOZILMAYDI — real raqamlar faqat `done.md` da.
> V1 SCOPE: naqd + karta (full/split). Click/Payme/UzCard/Humo — FAQAT v3. Nasiya/рассрочка — V1 DA YO'Q (qaror 2026-07-05, tasdiqlangan 2026-07-07).

---

## Backend — Auth (Karis)

- [x] K-AUTH: login (3 endpoint: main/staff/member), JWT access 15m
- [x] K-AUTH: Refresh rotation (30d httpOnly cookie), logout, frozen-check (403)
- [x] K-AUTH: Email OTP forgot/reset password (SMS bekor qilindi — pullik)
- [x] K-AUTH: SMTP OTP/password change emails
- [x] K-AUTH: authenticate + authorize middlewares (RBAC + org+branch scope)
- [x] K-AUTH: Google OAuth (Firebase) main_admin uchun

## Backend — Main Admin (Karis)

- [x] K-MAIN: Public endpoint forms -> leads table
- [x] K-MAIN: Lead panel: list, status change, notes
- [x] K-MAIN: Partner onboarding: POST /api/main/partners
- [x] K-MAIN: Platform dashboard: GET /api/main/dashboard
- [x] K-MAIN: Billing: narxlar DBda (platform_pricing), GET/PUT /api/main/pricing
- [x] K-MAIN: Partner freeze/activate (PATCH /partners/:id/status)

## Backend — Super Admin (Karis)

- [x] K-SUPER: Organization dashboard (GET /api/super/dashboard: totals + branch breakdown)
- [x] K-SUPER: CRUD branches (+ archive/unarchive) va CRUD admins (+ freeze)

## Backend — Admin (Karis)

- [x] K-ADMIN: Branch dashboard: income + expenses = profit
- [x] K-ADMIN: Expenses CRUD
- [x] K-ADMIN: Students CRUD (add-student login_code+parol generatsiya, freeze, regenerate-password, soft-delete)
- [x] K-ADMIN: Groups CRUD (archive, mentor biriktirish, students add/remove)
- [x] K-ADMIN: Mentors CRUD (create/PATCH/freeze/DELETE guard bilan)

## Backend — Methodist (Karis)

- [x] K-METHODIST: Training types, topics, lessons CRUD + analytics (modules/methodist)

## Backend — V1 To'lovlar 🔥 (Karis — Team Lead, 2 task) ✅

- [x] K-PAY: Payments modul: oylik avto-hisoblash (billing.worker, 1-sana, muddat 5-sana) + invoice + full + split (FOR UPDATE, split_batch_id, validatsiya BEGIN dan oldin) + ad-hoc to'lov + refund/void + chek S3 ga; commit dan KEYIN notificationQueue ('payment.received'/'payment.due'/'payment.refunded'); total_debt + invoice.status qayta hisob. To'lamasa (5-sanadan keyin, invoice='overdue') — student panelga umuman data qaytmaydi (paymentGate, 402). NASIYA YO'Q
- [x] K-PAY: Branch reports: filial bo'yicha tushum va qarzlar (guruhlar kesimida) — GET /api/admin/reports

## Backend — V1 qolganlari (Abdulaziz)

- [ ] AB-V1: POST /api/admin/announcements -> notificationQueue (Bilol TG-boti uchun e'lonlar)
- [ ] AB-V1: due-soon worker (to'lov muddatidan N kun oldin ota-onaga eslatma, payment.due_soon)
- [ ] AB-V1: Partner profit main dashboardda (income - expenses; pul jadvallariga faqat SELECT)
- [ ] AB-V1: Integration testlar: payments full/split (K-PAY chiqqandan keyin) + auth flow (login -> refresh -> reuse-detect -> OTP)
- [ ] AB-V1: SEO landing: meta/OG teglar, sitemap.xml, robots.txt, Lighthouse 90+ (abdulazizSEO rejimida)

## Backend — Infrastructure (Abdulaziz) ✅

- [x] AB-INFRA: Scaffold + structure + deps + docker-compose
- [x] AB-INFRA: config/ (env, db, redis, s3, mailer, sms, logger)
- [x] AB-INFRA: utils/ + middlewares (validate, rateLimiter, archiveGuard, errorHandler)
- [x] AB-INFRA: app.js + server.js
- [x] AB-INFRA: Migrations (node-pg-migrate) — full DDL
- [x] AB-INFRA: Sockets (redis-adapter, socketAuth, presence, chat)
- [x] AB-INFRA: Queues (BullMQ notification + overdue worker)
- [x] AB-INFRA: Telegram bot (grammy)

## Backend — Mentor (Abdulaziz) ✅

- [x] AB-MENTOR: Attendance (bulk-upsert)
- [x] AB-MENTOR: Homework check (0-max + coin_reward)
- [x] AB-MENTOR: Test constructor (questions JSONB)
- [x] AB-MENTOR: Exam with timer
- [x] AB-MENTOR: Coins +/- via changeCoins()
- [x] AB-MENTOR: Mentor salary (mentor_salaries)
- [x] AB-MENTOR: Manual coin assignment POST /api/mentor/coins
- [x] AB-MENTOR: Mentor groups read overview

## Backend — Student (Abdulaziz) ✅

- [x] AB-STUDENT: Home (coins/debt/ranking/groups/deadlines)
- [x] AB-STUDENT: Shop (FOR UPDATE, rollback on insufficient)
- [x] AB-STUDENT: Tests (timer, scoring, reward >= 50%)
- [x] AB-STUDENT: Homework (presigned S3)
- [x] AB-STUDENT: Videos (by membership)
- [x] AB-STUDENT: Leaderboards week/month (Redis ZSET)

## Backend — Parent (Abdulaziz) ✅

- [x] AB-PARENT: Child overview (coins, debt, ranking, groups, attendance, grades)
- [x] AB-PARENT: Ownership guard assertParentOwnsChild

## Backend — Shared (Abdulaziz) ✅

- [x] AB-SHARED: users module (profile, branch list)
- [x] AB-SHARED: db/seeds (demo data, idempotent)
- [x] AB-SHARED: Coin foundation: coins.changeCoins()

---

## Frontend — Auth (Elyor)

- [ ] AUTH: Login sahifalar (3 endpoint: main / staff / member) — elyor branchda bor, main ga merge kerak
- [ ] AUTH: ProtectedRoute + RoleGuard
- [ ] AUTH: Router setup by roles
- [ ] AUTH: Redux store + authSlice
- [ ] AUTH: Axios interceptor (auto-refresh)
- [ ] AUTH: Socket.io client

## Frontend — Super Admin (Said Islom, Aziz, sxvs)

- [x] SUPER: Dashboard (org income, branches, admins, students)
- [x] SUPER: CRUD branches (Branches -> BranchDetail)
- [x] SUPER: CRUD admins
- [x] SUPER: Reports
- [ ] SUPER: Organization settings (endpoint yo'q — kutilmoqda)

## Frontend — Admin (Abduloh, Odil, Hamidula)

- [ ] ADMIN: rey/xob admin_page ishini staff strukturasiga ko'chirish (alohida Vite-app EMAS — staff ichida sahifalar; merge REVIEW dan keyin)
- [ ] ADMIN: Dashboard (income + expenses = profit)
- [ ] ADMIN: Students CRUD (xob integratsiyasi bor — reviewdan o'tkazish)
- [ ] ADMIN: Groups CRUD
- [ ] ADMIN: Payments UI (full/split modal; K-PAY chiqqach ulanadi)
- [ ] ADMIN: Expenses CRUD
- [ ] ADMIN: Reports

## Frontend — Mentor (Sardor, Kozim, Alish)

- [x] MENTOR: Dashboard (groups, upcoming lessons)
- [ ] MENTOR: Attendance journal
- [x] MENTOR: Homework (check, grades)
- [ ] MENTOR: Tests (create, results)
- [x] MENTOR: Coins (assign/deduct)

## Frontend — Student (Abdulaziz)

- [ ] STUDENT: Home (coins, groups, deadlines)
- [ ] STUDENT: Tests
- [ ] STUDENT: Homework
- [ ] STUDENT: Shop
- [ ] STUDENT: Videos
- [ ] STUDENT: Leaderboard

## Frontend — Parent (hozircha KEYINGA qoldirildi — shart emas, mas'ul yo'q)

- [ ] PARENT: Child overview
- [ ] PARENT: Chat

## Frontend — Landing Page ✅

- [x] LANDING: Home, Features, Roles, Finance, Gamification, Contacts
- [x] LANDING: Header, Footer, CTA

## Frontend — Methodist (Karis) ✅

- [x] METHODIST: Training Types (CRUD)
- [x] METHODIST: Topics (CRUD)
- [x] METHODIST: Lessons (CRUD + LessonEditor)
- [x] METHODIST: Analytics
- [x] METHODIST: Dashboard

## Frontend — Design / UX (BARCHA panellar, sifat sharti)

- [ ] UI: Har bir panel FRONTEND-DESIGN-SYSTEM.md ga qat'iy rioya qiladi (laym #C6FF34, Manrope, qorong'i sidebar #1D2417, kartochka soyalari) — o'zboshimcha ranglar TAQIQLANADI
- [ ] UI: Har bir sahifada 3 holat: Skeleton (yuklanish), EmptyState (bo'sh ma'lumot), Error (xato + retry)
- [ ] UI: Umumiy komponentlar bitta joyda (Button, Modal, Table, Toast, Avatar, PageHeader) — har panel o'zinikini YASAMAYDI, main-admin dagi tayyorlaridan namuna
- [ ] UI: Responsive tekshiruv: 1280 / 768 / 375 px kengliklar, gorizontal scroll yo'q
- [ ] UI: Jadvallar: tabular-nums raqamlar, hover-podsvetka, status-pilyulalar (design-system bo'yicha)
- [ ] UI: Barcha mutatsiyalardan keyin TanStack Query cache invalidation + optimistic/loading tugma holatlari
