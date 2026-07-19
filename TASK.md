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

## Mentor panel — to'liq qayta ishlash (Karis) ✅ 2026-07-18/19 — save-zone da 42 commit

> Bu ish hech qaysi md faylda YOZILMAGAN edi (audit 2026-07-19 da qo'shildi).
> Backend + frontend birga: `modules/mentor/*`, `modules/chat/*`, `modules/coins/*`, `frontend/staff`.

- [x] MP-COINS: Mentor oylik koin limiti — migratsiya `1783850000000_mentor-coin-budget`
      (`organizations.coins_per_student` normasi). Limit SAQLANMAYDI, hisoblanadi:
      norma × guruhdagi aktiv o'quvchi soni − shu oyda berilgani. Sabab: yangi o'quvchi kelsa
      limit DARHOL o'ssin (saqlangan qiymat har qabul/chiqishda eskirardi).
      `GET /api/mentor/coins/groups/:groupId/budget`, jurnalda qolgan limit ko'rinadi
- [x] MP-PROFILE: Mentor professional profili — migratsiya `1783840000000_mentor-profile`
      (bio, ko'nikmalar, admin qo'yadigan daraja); profil ikki panelli "stol" ko'rinishida
- [x] MP-STATS: Statistika — har o'quvchi bo'yicha (davomat/uy vazifa/test/koin), 6 oylik trend grafigi,
      guruh ichida o'quvchilarni solishtiruvchi "Statistika" tab'i, barcha o'quvchilar sahifasi.
      `GET /api/mentor/groups/:groupId/stats`, `GET /api/mentor/groups/:groupId/students`
- [x] MP-ATTEND: Davomat Socket.IO ga ko'chirildi — o'qish, yozish va jonli yangilanish;
      avtosaqlash (Saqlash tugmasi olib tashlandi), butun oy darslari sana bilan va kim belgilagani,
      **mentor faqat BUGUNGI darsni belgilay oladi**, koinlar to'g'ridan-to'g'ri jurnal qatorida
- [x] MP-CHAT: Chat qayta yozildi — kompozer HAR DOIM render bo'ladi (ilgari `activeContact` ichida edi →
      kontakt ro'yxati bo'sh bo'lsa yozadigan joy yo'q edi, "input yo'q" shikoyatining ildizi shu),
      `POST /api/chat/dm` (HTTP orqali xabar), xodim→o'quvchi to'g'ridan-to'g'ri yozishi,
      bildirishnoma qo'ng'irog'i socket orqali yangilanadi, kontakt ro'yxatidagi 500 tuzatildi
- [x] MP-SHELL: Staff qobig'i — sidebar hover'da ochiladi/yopiladi, ishlaydigan bildirishnomalar paneli,
      header menyulari, telefonda gorizontal overflow va chat kompozeri tuzatildi, firma logotipi
- [x] MP-SEED: `seed-mentor-demo.mjs` (demo mentorni real data bilan to'ldiradi),
      `test-token.mjs`, `send-test-dm.mjs`, `docs/CHAT-TESTING.md` (qo'lda Postman/curl bilan tekshirish)
- [ ] MP-VERIFY 🔴: **JONLI TEKSHIRILMAGAN** — Docker ko'tarilmagani uchun real BD da hech biri
      yugurtirilmagan. Mock rejimida playwright bilan tekshirilgan xolos.
      Kontakt ro'yxati BO'SH holati ham jonli ko'rilmagan (mocklarda doim 3 ta kontakt bor)

## Backend — Integration (Karis) 🔥 hozirgi fokus

> Backend kod tayyor (barcha panellar). Endi asosiy ish — frontend panellarni backend bilan ulash.

- [ ] K-INT: Frontend ↔ backend integratsiya (SUPER ADMIN'dan tashqari — u Abdulaziz'da) — main-admin org-detail endpoint (Shohjahon uchun), endpoint kontraktlar, CORS/cookie, jonli E2E qolgan panellar bo'yicha
- [ ] K-INT: admin GroupDetail — 6 endpoint YO'Q, front (Abduloh) chaqiryapti: GET/POST /admin/groups/:id/{attendance,homework,feedback}. Qaror kerak: attendance/homework mentor jadvallaridan reuse (yagona manba), feedback — YANGI migratsiya + CRUD

## 🔴 BUGLAR / BLOKERLAR (Karis) — 2026-07-18 tekshiruvida topildi

- [ ] BUG-PROD-MOCKS 🔥 KRITIK (2026-07-19 da qayta tasdiqlandi — HALI OCHIQ): `frontend/{staff,student,member}/.env.production` da `VITE_USE_MOCKS=false` YO'Q — uchalasida ham faqat `VITE_API_URL` bor. Kod `VITE_USE_MOCKS !== 'false'` → undefined bo'lsa MOCK YONIQ. `.env` gitignore'da (faqat lokal), Vercel'da faqat `.env.production` bor → **prodda panellar soxta localStorage datasini ko'rsatyapti**. Tuzatish: uchala `.env.production` ga `VITE_USE_MOCKS=false` qo'shish.
      ✅ Aniqlik: `main-admin` bu bug'dan JABRLANMAGAN — uning `api.js` da `VITE_USE_MOCKS` pattern'i umuman yo'q. Ya'ni 4 emas, 3 ta app
- [x] ~~BUG-STACK~~ ✅ TUZATILGAN (2026-07-19 auditda tekshirildi, TASK.md eskirgan edi): `render.yaml:19-20` da `NODE_ENV=production` O'RNATILGAN, `errorHandler.js:41` stack'ni faqat `env.NODE_ENV === 'development'` da qaytaradi (qat'iy tenglik — yangi hostingda o'zgaruvchi unutilsa ham stack chiqmaydi). Bundan tashqari 5xx da `details` ham berkitildi, o'rniga `errorId` (pino req.id) qaytadi — commit `5a1f177`
- [ ] BUG-BILLING: `main-admin/src/pages/Billing.jsx` hali ESKI narx modelida (`baseFirstBranch`/`perStudent`), backend 2026-07-16 dan `{ tiers, currency }` qaytaradi → sahifa buzilgan. Egasi: Shohjahon (pastda MAIN bo'limida ham bor).
      SABABI TOPILDI: swagger `PlatformPricing` sxemasi ham eski modelda qolgan edi — Shohjahon hujjatga qarab qurgan. Sxema 2026-07-18 da tuzatildi (tiers), endi front ni ham moslashtirish kerak

## Swagger / API hujjatlari (Karis) ✅ 2026-07-18

- [x] DOCS: Barcha route'lar auditi — 158 route topildi, 139 tasi hujjatlashtirilgan edi, 19 tasi YO'Q edi (16 super + 2 admin + 1 telegram)
- [x] DOCS: 19 ta yetishmagan @openapi bloki yozildi → **qamrov 100%** (158/158, spec 158 operatsiya beradi)
- [x] DOCS: Yangi komponentlar — `Organization`, `UpdateOrganizationRequest`, `NotImplemented` (501 javobi)
- [x] DOCS: `PlatformPricing` sxemasi eski narx modelidan yangi TIERS ga ko'chirildi (BUG-BILLING sababi)
- [x] DOCS: Zaglushka endpointlar hujjatda ochiq belgilandi (⚠️ STUB / 501) — front ularga ulanmasin
- [x] DOCS: swagger/*.md qayta generatsiya (139 → 158 endpoint, yangi telegram.md)

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
- [ ] K-SUPER-INT: GET/POST/DELETE /api/super/announcements — Announcements ⚠️ ZAGLUSHKA: jadval YO'Q, GET bo'sh ro'yxat qaytaradi, POST/DELETE = 501. Migratsiya + notificationQueue kerak
- [ ] K-SUPER-INT: GET /api/super/reminders (+resend/delete) — Reminders ⚠️ ZAGLUSHKA: xuddi shunday (GET bo'sh, resend/delete = 501)
- [ ] K-SUPER-INT: GET /api/super/audit — Audit log ⚠️ ZAGLUSHKA: audit jadvali yo'q, doim { items: [], total: 0 }
- [x] K-SUPER-INT: GET /api/super/attendance (date/group filter) — Attendance
- [ ] K-SUPER-INT: har bir sahifa E2E — real superadmin login → real data

## Backend — YANGI TOPSHIRIQ (Abdulaziz) 🔥 2026-07-19, Karis bergan

> Auditda topilgan ochiq backend ishlar. Hammasi `backend/` zonasida — Abdulaziz'ning zonasi.
> Tartib MUHIM: AB-INT-GROUP birinchi, chunki u boshqa odamni (Abduloh) BLOKLAB turibdi.

### AB-INT-GROUP 🔴 1-NAVBAT (Abdulohni bloklayapti)

- [ ] AB-INT-GROUP: admin GroupDetail uchun 6 ta endpoint YO'Q, front (Abduloh) ularni allaqachon chaqiryapti va mock'dan olyapti:
      `GET/POST /api/admin/groups/:id/attendance`, `.../homework`, `.../feedback`.
      **Avval qaror kerak:** attendance va homework — mentor jadvallaridan REUSE qilinsinmi
      (yagona manba, tavsiya shu) yoki alohida? feedback — YANGI migratsiya + CRUD kerak (jadval yo'q).
      Qarorni Karis bilan kelishib, keyin yozish. Kontrakt: `frontend/TEAM-TASKS.md`

### AB-SUPER-STUB — Super Admin 3 ta zaglushka (jadval YO'Q, 501 qaytaradi)

> Hozir `super.service.js:342-348` bo'sh massiv qaytaradi, `super.controller.js:67` esa 501.
> Front (Shohjahon qurgan) sahifalar bor, lekin data yo'q — ya'ni sahifalar bo'm-bo'sh turibdi.

- [ ] AB-SUPER-ANN: `GET/POST/DELETE /api/super/announcements` — e'lonlar.
      Migratsiya + CRUD + `notificationQueue` ga ulash (POST bo'lganda xodimlarga/ota-onalarga ketsin).
      Bilol'ning TG-boti shu queue'ni o'qiydi — `AB-V1` dagi `/api/admin/announcements` bilan bir xil pattern, undan namuna ol
- [ ] AB-SUPER-REM: `GET /api/super/reminders` (+ resend / delete) — eslatmalar. Migratsiya + CRUD
- [ ] AB-SUPER-AUDIT: `GET /api/super/audit` — audit log. Migratsiya (kim / nima / qachon / qaysi org) +
      yozuvni MUHIM mutatsiyalarga ulash (branch/admin CRUD, freeze, shtraf). Faqat o'qish uchun, o'chirib bo'lmaydi
- [ ] AB-SUPER-STATS: `GET /api/super/stats` — route umuman YO'Q. KPI + grafik data (recharts uchun).
      ⚠️ Front `Stats.jsx` ham statik — api chaqirmaydi, ya'ni ikkala tomon ham kerak

### AB-VERIFY — jonli tekshiruv (mock'siz)

- [ ] AB-VERIFY: `VITE_USE_MOCKS=false` bilan real backend'da Student va Parent panellarini E2E tekshirish
      (ikkalasi ham uning zonasi). Hozir ikkalasi ham faqat mock rejimida ko'rilgan
- [ ] AB-VERIFY: Parent Chat — Socket.io realtime ulanishi hech qachon tekshirilmagan (`Chat.jsx`, 16 chaqiruv)

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
- [ ] PRICE 🔴 SHOSHILINCH: Neon'da migratsiyalarni prognat (npm run migrate) — 1783700000000_org-lesson-duration + qolgan 6 tasi + **YANGI 2 tasi** (`1783840000000_mentor-profile`, `1783850000000_mentor-coin-budget`); aks holda guruh jadvali, mentor oyligi, mentor profili va koin limiti prodda 500
- [ ] PRICE 🔴 SHOSHILINCH: render.yaml ga preDeployCommand: npm run migrate.
      **Xavf (2026-07-19 auditda aniqlandi):** `render.yaml` da `branch: main` + `autoDeploy: true`,
      lekin `preDeployCommand` YO'Q → main ga merge = backend DARHOL deploy bo'ladi,
      migratsiyalar esa YUGURMAYDI. Ya'ni yangi kod eski sxemaga murojaat qiladi → mentor sahifalari 500 beradi.
      main ga chiqarishdan OLDIN yo migratsiyani qo'lda prognat qilish, yo preDeployCommand qo'shish shart
- [ ] PRICE: Tariflarni DB-editable qilish (Main Admin tahrirlaydi) — v2
- [ ] FREEZE: Obunani muzlatish — 1 oy bepul, keyin (2-3-4...oy) pullik; backend logika + billing + status
- [ ] WHITE-LABEL: Markazga o'z brendida sayt (bizning backend/storage) — pullik xizmat 4 990 000 dan (minimal, murakkab bo'lsa qimmatroq); shablon self-serve + to'liq kastom premium
- ❌ REFERAL: kerak emas (qaror 2026-07-16)

---

## Frontend — Auth (Elyor)

> ⚠️ AUDIT 2026-07-19 (Karis): bu bo'limdagi galochkalar ESKIRGAN edi — kod tekshirildi,
> 4 ta vazifa allaqachon bajarilgan, 1 tasi kerak emas. Faqat BITTA haqiqiy tirqish topildi (pastda).

- [x] AUTH: Login sahifalar (3 endpoint: main / staff / member) — `staff/pages/Login.jsx`, `member/pages/Login.jsx`, `main-admin/pages/Login.jsx`, uchalasi `/auth/{staff,member,main}/login` ga ulangan. `origin/elyor` da save-zone dan ortiqcha commit YO'Q — merge qilinadigan narsa qolmagan
- [x] AUTH: ProtectedRoute + RoleGuard — ProtectedRoute uchala App.jsx da, `staff/components/RoleGuard.jsx` admin+superadmin route'larida ishlatiladi
- [x] AUTH: Router setup by roles — staff/App.jsx da rolli route'lar
- [x] AUTH: Redux authSlice — KERAK EMAS (useAuth() context yetarli, qaror 2026-07-15)
- [x] AUTH: 401 → refresh → retry interceptor (api.js, bitta refreshPromise) — ✅ Elyor bajardi (staff/member/main-admin), save-zone ga merge (55ef617). Auditda tasdiqlandi: `refreshPromise` 4 ta app da ham bor
- [x] AUTH: Socket.io client — `staff/socket.js` (presence + davomat live + ack-request), `member/socket.js`. `main-admin` va `student` da realtime sahifa YO'Q (Chat yo'q) → ularga socket kerak emas

### 🔴 AUTH — haqiqiy ochiq tirqish (auditda topildi 2026-07-19)

- [ ] AUTH-FORGOT 🔥: **Parolni tiklash FRONTDA umuman yo'q.** Backend tayyor va ishlaydi
      (`POST /api/auth/forgot-password` + `POST /api/auth/reset-password`, passwordResetLimiter,
      zod validatsiya, email OTP), lekin frontend da `*forgot*` / `*reset*` / `*otp*` fayl **0 ta**.
      Ya'ni foydalanuvchi parolini unutса — interfeys orqali tiklay olmaydi.
      Ochiq savol: `member` (Student/Parent) login-kod bilan kiradi va email'i bo'lmasligi mumkin →
      ularga tiklash admin orqalimi yoki umuman formasiz? Qaror kerak.
- [ ] AUTH-ELYOR-4: Elyor 2026-07-16 da 4 ta muammoni topgan, lekin ular umumiy fayllarda
      (`api.js`, `auth.jsx`, `main.jsx`, `vite.config.js`) — o'z chegarasidan tashqari bo'lgani uchun
      TEGMAGAN va Karis'ga uzatgan (`frontend/staff/elyor-log.md`). **Hech kim olmagan, osilib qolgan:**
      1) admin dashboard `api.adminDashboard is not a function`
      2) Google login COOP konsol xatosi
      3) «Забыли пароль» mock ishlamaydi (AUTH-FORGOT bilan bir xil ildiz)
      4) React Router v7 future-flag warning

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
- [x] MENTOR: Tests (create, results) — Tests.jsx + konstruktor + natijalar (2026-07-18)
- [x] MENTOR: Coins (assign/deduct)
- [x] MENTOR: Chat — shaxsiy dm: xonalar, Socket.io + tarix, faqat xodim va ota-ona ko‘radi (2026-07-18)

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
