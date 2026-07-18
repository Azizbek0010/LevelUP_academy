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
- [x] K-MAIN: YANGI narx modeli (2026-07-16) — o'quvchi bucket tariflari (Free/Start/Standard/Pro/Business/Network), filiallar bepul; config/plans.js TIERS + computeBill({students}); eski filial+o'quvchi formula bekor; GET /api/main/pricing endi { tiers, currency }

## Backend — Super Admin (Karis)

- [x] K-SUPER: Organization dashboard (GET /api/super/dashboard: totals + branch breakdown)
- [x] K-SUPER: CRUD branches (+ archive/unarchive) va CRUD admins (+ freeze)

## Backend — Admin (Karis)

- [x] K-ADMIN: Branch dashboard: income + expenses = profit
- [x] K-ADMIN: Expenses CRUD
- [x] K-ADMIN: Students CRUD (add-student login_code+parol generatsiya, freeze, regenerate-password, soft-delete)
- [x] K-ADMIN: Groups CRUD (archive, mentor biriktirish, students add/remove)
- [x] K-ADMIN: Mentors CRUD (create/PATCH/freeze/DELETE guard bilan)
- [x] K-ADMIN: Guruh jadvali (2026-07-16) — POST/PATCH /api/admin/groups { days[], startTime }; tugash vaqti backendda org dars davomiyligidan hisoblanadi; GET /api/admin/settings (davomiylik)

## Backend — Methodist (Karis)

- [x] K-METHODIST: Training types, topics, lessons CRUD + analytics (modules/methodist)
- [x] K-METHODIST: Dars media (2026-07-18) — migratsiya 1783800000000 (video_url + file_key) + GET /api/methodist/lessons/:id/upload-url (presigned S3) + updateLesson videoUrl/fileKey qabul qiladi

## Backend — Xodimlar intizomi (Karis) ✅ 2026-07-18 (MVP1, main da)

> Modul `backend/src/modules/discipline/`. Migratsiyalar: 1783810000000 (user_status += 'fired'),
> 1783820000000 (staff_penalties), 1783830000000 (org_charters).

- [x] K-DISC: shtraf (summa + sabab, avto-yechish YO'Q) + qora (ishdan bo'shatish, status='fired', withTransaction)
- [x] K-DISC: Huquqlar matritsasi (CAN_ISSUE): superadmin→admin/mentor/methodist; admin→mentor/methodist (shtraf), faqat mentor (qora); main_admin→HECH NARSA
- [x] K-DISC: Ustav (org_charters, erkin matn, upsert, barcha xodimlarga ko'rinadi)
- [x] K-DISC: Endpointlar — super PUT/GET /charter, POST/GET /penalties, POST /staff/:id/reactivate; admin GET /charter, POST/GET /penalties; shared GET /users/me/penalties, /users/me/charter
- [x] K-DISC: Swagger — Discipline tegi, 10 endpoint, swagger/*.md qayta generatsiya (139 endpoint)
- [ ] K-DISC: FRONT — shtraf/ustav formalari super+admin panellarida, ko'rish mentor/methodist da (kontrakt tayyor, front jamoasiga)
- [ ] K-DISC: runtime tekshiruv — hali BD da yugurtirilmagan (npm run migrate + jonli test)

## Backend — V1 To'lovlar 🔥 (Karis — Team Lead, 2 task) ✅

- [x] K-PAY: Payments modul: oylik avto-hisoblash (billing.worker, 1-sana, muddat 5-sana) + invoice + full + split (FOR UPDATE, split_batch_id, validatsiya BEGIN dan oldin) + ad-hoc to'lov + refund/void + chek S3 ga; commit dan KEYIN notificationQueue ('payment.received'/'payment.due'/'payment.refunded'); total_debt + invoice.status qayta hisob. To'lamasa (5-sanadan keyin, invoice='overdue') — student panelga umuman data qaytmaydi (paymentGate, 402). NASIYA YO'Q
- [x] K-PAY: Branch reports: filial bo'yicha tushum va qarzlar (guruhlar kesimida) — GET /api/admin/reports

## Backend — Integration (Karis) 🔥 hozirgi fokus

> Backend kod tayyor (barcha panellar). Endi asosiy ish — frontend panellarni backend bilan ulash.

- [ ] K-INT: Frontend ↔ backend integratsiya (SUPER ADMIN'dan tashqari — u Abdulaziz'da) — main-admin org-detail endpoint (Shohjahon uchun), endpoint kontraktlar, CORS/cookie, jonli E2E qolgan panellar bo'yicha
- [ ] K-INT: admin GroupDetail — 6 endpoint YO'Q, front (Abduloh) chaqiryapti: GET/POST /admin/groups/:id/{attendance,homework,feedback}. Qaror kerak: attendance/homework mentor jadvallaridan reuse (yagona manba), feedback — YANGI migratsiya + CRUD

## 🔴 BUGLAR / BLOKERLAR (Karis) — 2026-07-18 tekshiruvida topildi

- [ ] BUG-PROD-MOCKS 🔥 KRITIK: `frontend/{staff,student,member}/.env.production` da `VITE_USE_MOCKS=false` YO'Q. Kod `VITE_USE_MOCKS !== 'false'` → undefined bo'lsa MOCK YONIQ. `.env` gitignore'da (faqat lokal), Vercel'da faqat `.env.production` bor → **prodda panellar soxta localStorage datasini ko'rsatyapti**. Tuzatish: uchala `.env.production` ga `VITE_USE_MOCKS=false` qo'shish
- [ ] BUG-STACK 🔥: `render.yaml` da NODE_ENV o'rnatilmagan, `config/env.js` default `'development'` → `errorHandler.js:19` prodda `err.stack` qaytaryapti (api.levelup-academy.uz da jonli ko'rildi). Tuzatish: render.yaml ga NODE_ENV=production
- [ ] BUG-BILLING: `main-admin/src/pages/Billing.jsx` hali ESKI narx modelida (`baseFirstBranch`/`perStudent`), backend 2026-07-16 dan `{ tiers, currency }` qaytaradi → sahifa buzilgan. Egasi: Shohjahon (pastda MAIN bo'limida ham bor)

## Backend — V1 qolganlari (Abdulaziz) ✅ (kod: d57dff5)

- [x] AB-V1: POST /api/admin/announcements -> notificationQueue (Bilol TG-boti uchun e'lonlar)
- [x] AB-V1: due-soon worker (to'lov muddatidan N kun oldin ota-onaga eslatma, payment.due_soon)
- [x] AB-V1: Partner profit main dashboardda (income - expenses; pul jadvallariga faqat SELECT)
- [x] AB-V1: Integration testlar: payments full/split + auth flow (login -> refresh -> reuse-detect -> OTP)
- [ ] AB-V1: SEO — pastdagi "SEO — Landing + platforma (Abdulaziz)" bo'limiga ko'chirildi va kengaytirildi

## Backend — Super Admin Integratsiya (Karis) 🔥 hozirgi fokus

> Super Admin FRONT = to'liq Shohjahon versiyasi (14 sahifa), lekin uning yangi sahifalari
> backend endpoint'larini chaqiradi — ular YO'Q edi. **Karis quradi** (avval Abdulaziz'ga berilgandi →
> Team Lead o'ziga qaytarib oldi). Zona: `modules/super`.

- [x] K-SUPER-INT: GET + PATCH /api/super/organization — Settings (org profil) ✅ jonli tekshirildi (35586f6)
- [x] K-SUPER-INT: Dars davomiyligi (2026-07-16) — organizations.lesson_duration_min + lessonDurationMin GET/PATCH /api/super/organization da
- [x] K-SUPER-INT: GET /api/super/students (+search/filter/pagination + DELETE) — Students sahifa (repository listOrgStudents: ILIKE search + LIMIT/OFFSET)
- [x] K-SUPER-INT: GET /api/super/groups (+archive/unarchive + DELETE) — Groups sahifa
- [ ] K-SUPER-INT: GET /api/super/stats — Stats (KPI + grafik data, recharts) ⚠️ YAGONA QOLGANI: route YO'Q, front Stats.jsx ham statik (api chaqirmaydi)
- [x] K-SUPER-INT: GET/POST/DELETE /api/super/announcements — Announcements
- [x] K-SUPER-INT: GET /api/super/reminders (+resend/delete) — Reminders
- [x] K-SUPER-INT: GET /api/super/audit — Audit log
- [x] K-SUPER-INT: GET /api/super/attendance (date/group filter) — Attendance
- [ ] K-SUPER-INT: har bir sahifa E2E — real superadmin login → real data

## SEO — Landing + platforma (Abdulaziz / abdulazizSEO) 🔥 full

> abdulazizSEO rejimi: ikkala zonada (frontend + backend) faqat SEO ishlari.
> ⚠️ QISMAN BAJARILGAN (origin'da bor): landing prerender/SSG, barcha private panellar (staff/main-admin/member/student) + api noindex, FAQPage schema. Abdulaziz qolganini belgilasin.

- [ ] AB-SEO: Meta teglar har sahifada (title/description/keywords) + Open Graph + Twitter Card
- [ ] AB-SEO: sitemap.xml (barcha public sahifalar) + robots.txt (AI-crawler qoidalari)
- [ ] AB-SEO: Structured data JSON-LD (Organization, WebSite, FAQPage, BreadcrumbList) — GEO/AEO
- [ ] AB-SEO: Semantik razmetka (h1-h6 ierarxiya, alt-textlar, aria-labellar)
- [ ] AB-SEO: Canonical URL + hreflang (ko'p til bo'lsa)
- [ ] AB-SEO: Page speed — Lighthouse 90+ (LCP/CLS/TBT), rasm optimizatsiya, lazy-load
- [ ] AB-SEO: GA4 event'lar (SPA navigatsiya + konversiyalar) — G-RWCK0B6TXP
- [ ] AB-SEO: SSR/prerender kerak bo'lsa (public landing sahifalar uchun)

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

## Backend — Narx / GTM (Karis) 🔥 YANGI (2026-07-16)

> To'liq strategiya — PRICING.md (vault). Model: o'quvchi bucket tariflari, filiallar bepul, narx=sifat (kafolat).

- [x] PRICE: Bucket tariflar backendda (config/plans.js TIERS, computeBill by students)
- [ ] PRICE: Neon'da migratsiyalarni prognat (npm run migrate) — 1783700000000_org-lesson-duration + qolgan 6 tasi; aks holda guruh jadvali va mentor oyligi prodda 500
- [ ] PRICE: render.yaml ga preDeployCommand: npm run migrate (migratsiya avtomatik yugursin)
- [ ] PRICE: Tariflarni DB-editable qilish (Main Admin tahrirlaydi) — v2
- [ ] FREEZE: Obunani muzlatish — 1 oy bepul, keyin (2-3-4...oy) pullik; backend logika + billing + status
- [ ] WHITE-LABEL: Markazga o'z brendida sayt (bizning backend/storage) — pullik xizmat 4 990 000 dan (minimal, murakkab bo'lsa qimmatroq); shablon self-serve + to'liq kastom premium
- ❌ REFERAL: kerak emas (qaror 2026-07-16)

---

## Frontend — Auth (Elyor)

- [ ] AUTH: Login sahifalar (3 endpoint: main / staff / member) — elyor branchda bor, main ga merge kerak
- [ ] AUTH: ProtectedRoute + RoleGuard
- [ ] AUTH: Router setup by roles
- [ ] AUTH: Redux authSlice — KERAK EMAS (useAuth() context yetarli, qaror 2026-07-15)
- [x] AUTH: 401 → refresh → retry interceptor (api.js, bitta refreshPromise) — ✅ Elyor bajardi (staff/member/main-admin), save-zone ga merge (55ef617)
- [ ] AUTH: Socket.io client

## Frontend — Super Admin ✅ TUGADI

> FRONT to'liq tayyor (Shohjahon, save-zone 0bb957e), LEKIN STATIK — backend integratsiya hali yo'q
> (Settings/organization real API ga ulanmagan). Backend integratsiya → Abdulaziz (pastda "Backend — Super Admin Integratsiya").
> Jamoa qayta taqsimlandi: Shohjahon → Main Admin, Said Islom + Aziz → Methodist, sxvs — loyihadan olindi.

- [x] SUPER (front): Dashboard (org income, branches, admins, students)
- [x] SUPER (front): CRUD branches (Branches -> BranchDetail)
- [x] SUPER (front): CRUD admins
- [x] SUPER (front): Reports
- [x] SUPER (front): Organization settings + ComingSoon (Shohjahon) — backend /api/super/organization TAYYOR (Karis, 35586f6)
- [ ] SUPER (front): 🆕 Dars davomiyligi sozlamasi — Settings da PATCH /api/super/organization lessonDurationMin (Karis o'zi qiladi)

## Frontend — Main Admin (Shohjahon) 🔥 YANGI — to'liq egasi

> Shohjahon Super Admin panelini to'liq tugatdi → endi Main Admin paneli (`frontend/main-admin`) uning zonasi.
> Hamma kerakli ish shu yerda. Baza tayyor (Karis qurgan), Shohjahon egalik qiladi va yakunlaydi.

- [x] MAIN: Dashboard — KPI + grafiklar (Dashboard.jsx, 805 qator)
- [x] MAIN: Leads — ro'yxat / filtr / status o'zgartirish, OnboardModal (temp-parol), Qabul / Rad etish
- [x] MAIN: Organizations (hamkorlar) — ro'yxat / qidiruv, freeze / activate (855 qator)
- [x] MAIN: Org-detail sahifasi — OrgDetail.jsx qurilgan
- [ ] MAIN (Shohjahon) 🔴: Billing — sahifa hali ESKI modelda (`baseFirstBranch`/`perStudent`), backend `{ tiers, currency }` qaytaradi → SAHIFA BUZILGAN, shoshilinch (BUG-BILLING)
- [ ] MAIN: Revenue — Revenue.jsx bor (454 qator) lekin api chaqiruvi deyarli yo'q, real tushumga ulanmagan
- [ ] MAIN: Settings — real platforma sozlamalari (hozir zaglushka)
- [ ] MAIN: Google OAuth — jonli E2E login testi (Firebase levelup-1c059)
- [ ] MAIN: Forgot-password — sikl polish
- [ ] MAIN: Design-system — laym #C6FF34, Manrope, 3 holat (Skeleton/Empty/Error), responsive 1280/768/375, TanStack Query cache invalidation
- [ ] MAIN: Test organizatsiyalarni tozalash (Karis bilan kelishib)

## Frontend — Admin (Abduloh, Odil, Hamidula)

- [x] ADMIN: rey/xob admin_page ishini staff strukturasiga ko'chirish (alohida Vite-app EMAS — staff ichida sahifalar; merge REVIEW dan keyin)
- [x] ADMIN: Dashboard (income + expenses = profit) — Dashboard.jsx, api ga ulangan
- [x] ADMIN: Students CRUD (xob integratsiyasi bor — reviewdan o'tkazish) — Students.jsx + StudentDetail.jsx
- [x] ADMIN: Groups CRUD — Groups.jsx + GroupDetail.jsx ⚠️ GroupDetail 6 endpointni mock'dan oladi (K-INT ga qara)
- [ ] ADMIN (Odil): 🆕 Guruh formasi — mentor majburiy + kunlar (1-3-5/2-4-6 preset yoki boshqa kunlar galochka) + boshlanish vaqti + tugash vaqti AVTO (GET /api/admin/settings) → POST/PATCH { days, startTime }; kontrakt TEAM-TASKS §9.2
- [x] ADMIN: Payments UI (full/split modal; K-PAY chiqqach ulanadi) — Payments.jsx (775 qator)
- [x] ADMIN: Expenses CRUD — Expenses.jsx + PDF eksport (Abduloh, jspdf)
- [x] ADMIN: Reports — Reports.jsx, GET /api/admin/reports ga ulangan

## Frontend — Mentor (Sardor, Kozim, Alish)

- [x] MENTOR: Dashboard (groups, upcoming lessons)
- [x] MENTOR: Attendance journal — Attendance.jsx (726 qator, api ga ulangan)
- [x] MENTOR: Homework (check, grades)
- [ ] MENTOR: Tests (create, results) ⚠️ mentor/ da Tests.jsx sahifasi UMUMAN YO'Q
- [x] MENTOR: Coins (assign/deduct)
- [ ] MENTOR: Chat — mentor/Chat.jsx statik (api import qilmaydi, Socket.io ulanmagan)

## Frontend — Student (Abdulaziz)

> ⚠️ Barcha sahifalar QURILGAN va api kontraktiga ulangan, LEKIN mock rejimida ishlaydi
> (BUG-PROD-MOCKS ga qara). Jonli E2E qilinmagan.

- [x] STUDENT: Home (coins, groups, deadlines)
- [x] STUDENT: Tests — Tests.jsx + TestTake.jsx (timer/scoring)
- [x] STUDENT: Homework
- [x] STUDENT: Shop
- [x] STUDENT: Videos
- [x] STUDENT: Leaderboard
- [ ] STUDENT: jonli E2E — VITE_USE_MOCKS=false bilan real backend'da tekshirish

## Frontend — Parent (Kama — @Azizovcf, git iface9808-sketch) 🔥 to'liq egasi

> Methodist'dan Parent panelga o'tkazildi. Backend tayyor (AB-PARENT: child overview + assertParentOwnsChild guard).
> Panel: `frontend/member` (parent tomoni — login-kod + parol bilan kiradi).

- [x] PARENT: Child overview — Dashboard.jsx (useParentOverview hook)
- [x] PARENT: Bir nechta farzand — child-context.jsx (bolalar orasida almashtirish)
- [x] PARENT: Davomat detali — Attendance.jsx
- [x] PARENT: Baholar / uy vazifa natijalari — Grades.jsx
- [x] PARENT: To'lov / qarz — Debt.jsx
- [x] PARENT: Chat — Chat.jsx (16 chaqiruv) ⚠️ Socket.io realtime ulanishi tekshirilmagan
- [x] PARENT: Bildirishnomalar — Notifications.jsx
- [ ] PARENT: jonli E2E — mock o'chirilgan holda real parent login bilan tekshirish
- [ ] PARENT: Design-system — laym #C6FF34, Manrope, 3 holat (Skeleton/Empty/Error), responsive 1280/768/375, TanStack Query

## Frontend — Landing Page ✅

- [x] LANDING: Home, Features, Roles, Finance, Gamification, Contacts
- [x] LANDING: Header, Footer, CTA

## Frontend — Methodist (Said Islom, Aziz — Super Admin'dan o'tkazildi) ✅ karkas

> Panel karkasi tayyor (Karis). Said Islom + Aziz endi Methodist jamoasida — qo'shimcha ish + MVP2 kontent-menejer + support/maintenance.

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
