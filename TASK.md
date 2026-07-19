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
- [~] K-INT: admin GroupDetail 6 endpoint → **AB-INT-GROUP (Abdulaziz)** ga berildi.
      ⚠️ Karis'da faqat BITTA narsa qoldi: qaror qabul qilish —
      attendance/homework mentor jadvallaridan reuse qilinsinmi yoki alohida?
      Abdulaziz shu qarorni KUTYAPTI, ya'ni bu blokerni sen ochasan

## 🔴 BUGLAR / BLOKERLAR (Karis) — 2026-07-18 tekshiruvida topildi

- [x] BUG-PROD-MOCKS ✅ TUZATILDI 2026-07-19: `frontend/{staff,student,member}/.env.production`
      uchalasiga ham `VITE_USE_MOCKS=false` qo'shildi. Ilgari o'zgaruvchi umuman yo'q edi va
      kod `VITE_USE_MOCKS !== 'false'` ni tekshirgani uchun undefined = MOCK YONIQ bo'lardi —
      ya'ni prodda panellar soxta localStorage datasini ko'rsatardi.
      `main-admin` bu bug'dan jabrlanmagan (uning `api.js` da bu pattern yo'q)
- [x] ~~BUG-STACK~~ ✅ TUZATILGAN (2026-07-19 auditda tekshirildi, TASK.md eskirgan edi): `render.yaml:19-20` da `NODE_ENV=production` O'RNATILGAN, `errorHandler.js:41` stack'ni faqat `env.NODE_ENV === 'development'` da qaytaradi (qat'iy tenglik — yangi hostingda o'zgaruvchi unutilsa ham stack chiqmaydi). Bundan tashqari 5xx da `details` ham berkitildi, o'rniga `errorId` (pino req.id) qaytadi — commit `5a1f177`
- [ ] BUG-LOCAL-PROD-DB 🔥🔥 ENG XAVFLISI (2026-07-19 auditda topildi): `backend/.env` dagi
      `DATABASE_URL` **to'g'ridan-to'g'ri PROD Neon bazasiga** qaragan
      (`ep-empty-wind-ai4drexy...neon.tech`), lokal Docker postgres'ga EMAS —
      holbuki `levelup-postgres` konteyneri 22 soatdan beri ishlab turibdi va ishlatilmayapti.
      **Nima demak:** kim `npm run seed` yoki `seed-mentor-demo.mjs` ni lokal ishga tushirsa —
      demo data TO'G'RIDAN-TO'G'RI PRODGA yoziladi. Skript `INSERT`/`UPDATE` qiladi.
      Hozircha omad: prodda demo guruhlar yo'q (13 org, 15 filial, 58 user, 6 guruh — real data).
      Lekin bu vaqt masalasi.
      **Tuzatish:** lokal `.env` `postgresql://postgres:postgres@localhost:5432/levelup` ga o'tsin,
      prod URL faqat Render dashboard'ida qolsin. Jamoaga ham aytilsin
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
> ⚠️ TUZATISH 2026-07-19: quyidagi 4 ta vazifa Abdulaziz'ga BERILDI (AB-SUPER-* ga qara).
> Bu yerda ham, u yerda ham turgani XATO edi — bitta ish ikki joyda ikki odamga yozilgan edi.
> Egasi endi BITTA: Abdulaziz. Bu yerda faqat tarix uchun qoldirilyapti.

- [~] K-SUPER-INT: GET /api/super/stats → **AB-SUPER-STATS (Abdulaziz)**
- [~] K-SUPER-INT: GET/POST/DELETE /api/super/announcements → **AB-SUPER-ANN (Abdulaziz)**
- [~] K-SUPER-INT: GET /api/super/reminders → **AB-SUPER-REM (Abdulaziz)**
- [~] K-SUPER-INT: GET /api/super/audit → **AB-SUPER-AUDIT (Abdulaziz)**
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

### AB-SUPER-REPORTS + AB-MAIN-REVENUE 🆕 (2026-07-19 auditda topildi)

> Muammo: bitta endpoint uchta sahifani boqyapti. `super/Dashboard.jsx`, `super/Stats.jsx` va
> `super/Reports.jsx` — uchalasi ham `useSuperDashboard` ni chaqiradi. Stats va Reports'ning
> o'z ma'lumoti YO'Q, ya'ni ular Dashboard'ning nusxasi bo'lib qolgan.

- [ ] AB-SUPER-REPORTS: `GET /api/super/reports` — organizatsiya bo'yicha HAQIQIY hisobot
      (filiallar kesimida tushum, qarz, o'quvchi harakati). Hozir front Dashboard datasini ko'rsatyapti.
      Front tomoni: FE-SUPER-REPORTS (Aziz)
- [ ] AB-EXPENSE-PATCH 🆕 (audit 2026-07-19): `PATCH`/`PUT /api/admin/expenses/:id` YO'Q —
      faqat POST, GET va DELETE bor (`admin.routes.js:181`). Ya'ni **xarajatni TAHRIRLAB bo'lmaydi**,
      faqat o'chirib qaytadan yozish mumkin. Front buni bilib turibdi:
      `Expenses.jsx:339` da "TODO: Backend has no PATCH/PUT endpoint" deb yozilgan.
      ⚠️ TASK.md da "K-ADMIN: Expenses CRUD" [x] deb turgan edi — CRUD emas, U (Update) yo'q
- [ ] AB-MAIN-REVENUE: `main-admin/Revenue.jsx` (454 qator) `useDashboard` da o'tiribdi —
      real tushumga ULANMAGAN. Platforma tushumi uchun alohida endpoint kerak.
      ⚠️ Pul jadvallariga faqat **SELECT** — yozish YO'Q (AB-V1 dagi "Partner profit" bilan bir xil qoida).
      Front tomoni Shohjahon'da (MAIN: Revenue — uning ochiq vazifasi)

### AB-VERIFY — jonli tekshiruv (mock'siz)

- [ ] AB-VERIFY: `VITE_USE_MOCKS=false` bilan real backend'da Student va Parent panellarini E2E tekshirish
      (ikkalasi ham uning zonasi). Hozir ikkalasi ham faqat mock rejimida ko'rilgan
- [ ] AB-VERIFY: Parent Chat — Socket.io realtime ulanishi hech qachon tekshirilmagan (`Chat.jsx`, 16 chaqiruv)

## Telegram bot (Bilol) ⚠️ TASK.md ga 2026-07-19 da QO'SHILDI

> ❌ Muammo: Bilol jamoada, 14 commit qilgan, lekin bu faylda uning NOMI ham yo'q edi.
> Vazifalari `docs/TASK-telegram-bot.md` da alohida yotibdi va u yerda **0 ta [x]** —
> holbuki u allaqachon ishlagan (masalan `bot.start()` — /start va /stop umuman
> polling qilmayotgan edi, o'sha tuzatilgan). Ya'ni fayl real holatdan orqada.
> Bitta manba bo'lishi kerak — shuning uchun bu yerga ko'rsatkich qo'yildi.

- [ ] TG-SYNC 🔴 (Bilol): `docs/TASK-telegram-bot.md` ni REAL holatga keltirsin —
      bajarilganlarini [x] qilsin. Hozir 12+ vazifa ochiq ko'rinadi, aslida bir qismi tayyor
- [ ] TG-BIND (Bilol): `POST /api/telegram/bind-token` + deep-link orqali `/start` bilan
      hisobni bog'lash (Redis `GETDEL` bilan atomar tekshiruv) + `/stop` uzish
- [ ] TG-DUE (Bilol): `payment.due_soon` handler — ota-onaga to'lov muddati haqida eslatma.
      Payload formati Karis bilan kelishilsin
- [ ] TG-ANN (Bilol): `announcement` handler — filial/guruh ota-onalariga e'lon tarqatish,
      qabul qiluvchilarni resolve qilish + katta ro'yxatga bo'lib yuborish
- [ ] TG-FRONT (kim bo'shasa): kabinetda "Telegramni bog'lash" tugmasi —
      `bind-token` ni chaqirib deep-link ko'rsatadi. Front tomoni hech kimga berilmagan

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
- [x] PRICE ✅ 2026-07-19: Neon'dagi migratsiyalar prognat qilindi.
      ⚠️ Bu yerda yozilgani NOTO'G'RI edi — "9 ta yugurtirilmagan" deyilgandi, aslida
      bazani tekshirganda 17 tasi ALLAQACHON yugurgan ekan (`org-lesson-duration`, `lesson-media`,
      `user-status-fired`, `staff-penalties`, `org-charter`, `mentor-profile` — hammasi joyida).
      Faqat BITTA qolgan edi: `1783850000000_mentor-coin-budget` → yugurtirildi, jami 18 ta.
      Tekshirildi: `organizations.coins_per_student` ✓, `coin_history.group_id` ✓, indeks ✓
- [x] PRICE ✅ 2026-07-19: `render.yaml` ga `preDeployCommand: npm run migrate` qo'shildi.
      Endi migratsiya yangi kod trafikni olishdan OLDIN yuguradi; migratsiya yiqilsa —
      Render deploy'ni to'xtatadi va eski versiya ishlab turaveradi (buzuq versiyani chiqargandan yaxshi)
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

## Frontend — Super Admin ⚠️ TUGAMAGAN (Said Islom + Aziz) — 2026-07-19 auditda ochildi

> ❌ Bu bo'lim ilgari "✅ TUGADI" deb turgan edi — bu NOTO'G'RI bo'lgan.
> Sahifalar chizilgan, lekin 3 tasi bo'sh qaytadi va 1 tasi O'YLAB TOPILGAN raqam ko'rsatadi.
> **Egasi:** Said Islom + Aziz — Super panelni asli SHULAR qurgan, kodni biladi.
> Ikkalasining ham ochiq vazifasi yo'q edi, Methodist karkasi tayyor.
> Backend tomoni Abdulaziz'da (AB-SUPER-* ga qara) — front va back BIRGA yopiladi.

- [x] SUPER (front): Dashboard (org income, branches, admins, students)
- [x] SUPER (front): CRUD branches (Branches -> BranchDetail)
- [x] SUPER (front): CRUD admins
- [x] SUPER (front): Organization settings + ComingSoon (Shohjahon) — backend /api/super/organization TAYYOR (Karis, 35586f6)
- [ ] SUPER (front): 🆕 Dars davomiyligi sozlamasi — Settings da PATCH /api/super/organization lessonDurationMin (Karis o'zi qiladi)

### 🔴 FE-SUPER (Said Islom + Aziz) — auditda topilgan xatolar

- [ ] FE-SUPER-STATS 🔥 (Said Islom): `super/Stats.jsx:22-27` da **O'YLAB TOPILGAN raqamlar** bor:
      ```js
      const PAYMENT_METHODS = [
        { name: 'Наличные', value: 65 }, { name: 'Карта', value: 30 }, { name: 'Online', value: 5 },
      ];
      ```
      Bu hardcode haqiqiy grafik bo'lib chiziladi — hamkor "65% naqd" degan raqamni ko'radi,
      lekin uni HECH KIM hisoblamagan. Bu eng xavflisi: sahifa ishlayotgandek ko'rinadi.
      Hardcode o'chirilsin, `GET /api/super/stats` ga ulansin (backend — AB-SUPER-STATS).
      ⚠️ Sahifa hozir `useSuperDashboard` ni chaqiryapti — bu Dashboard'ning endpointi, Stats'niki EMAS
- [ ] FE-SUPER-REPORTS (Aziz): `super/Reports.jsx` ham `useSuperDashboard` da o'tiribdi — o'z ma'lumoti yo'q.
      Ya'ni Dashboard / Stats / Reports — uchtasi BITTA endpointdan oziqlanyapti.
      O'z endpointiga ulansin (backend — AB-SUPER-REPORTS)
- [ ] FE-SUPER-WIRE (Said Islom + Aziz): Announcements (359 qator) / Reminders (257) / Audit (293) —
      front yozilgan va `api` ni chaqiradi, lekin backend 501 yoki bo'sh ro'yxat qaytaradi →
      **909 qator kod hech qachon hech narsa ko'rsatolmaydi**.
      Abdulaziz backendni yopgach (AB-SUPER-ANN/REM/AUDIT) — real data bilan tekshirilsin,
      Skeleton / EmptyState / Error uch holati ishlashiga ishonch hosil qilinsin

## Frontend — Main Admin (Shohjahon) 🔥 YANGI — to'liq egasi

> Shohjahon Super Admin panelini to'liq tugatdi → endi Main Admin paneli (`frontend/main-admin`) uning zonasi.
> Hamma kerakli ish shu yerda. Baza tayyor (Karis qurgan), Shohjahon egalik qiladi va yakunlaydi.

- [x] MAIN: Dashboard — KPI + grafiklar (Dashboard.jsx, 805 qator)
- [x] MAIN: Leads — ro'yxat / filtr / status o'zgartirish, OnboardModal (temp-parol), Qabul / Rad etish
- [x] MAIN: Organizations (hamkorlar) — ro'yxat / qidiruv, freeze / activate (855 qator)
- [x] MAIN: Org-detail sahifasi — OrgDetail.jsx qurilgan
- [ ] MAIN (Shohjahon) 🔴: Billing — sahifa hali ESKI modelda (`baseFirstBranch`/`perStudent`), backend `{ tiers, currency }` qaytaradi → SAHIFA BUZILGAN, shoshilinch (BUG-BILLING)
- [ ] MAIN: Revenue — Revenue.jsx bor (454 qator) lekin api chaqiruvi deyarli yo'q, real tushumga ulanmagan
- [x] MAIN: Settings — ✅ audit 2026-07-19: "zaglushka" deb yozilgani NOTO'G'RI edi.
      438 qator, `useDashboard` + `usePricing` + `api.updateProfile` — real ishlaydi
- [ ] MAIN: Google OAuth — jonli E2E login testi (Firebase levelup-1c059)
- [ ] MAIN: Forgot-password — sikl polish
- [ ] MAIN: Design-system — laym #C6FF34, Manrope, 3 holat (Skeleton/Empty/Error), responsive 1280/768/375, TanStack Query cache invalidation
- [ ] MAIN: Test organizatsiyalarni tozalash (Karis bilan kelishib)
- [ ] MAIN-FINES 🆕 (audit 2026-07-19): `Fines.jsx:27` da `initialMock` hardcode —
      sahifa soxta jarima ro'yxatini ko'rsatyapti. Real endpointga ulansin yoki olib tashlansin
- [ ] MAIN-UNTRACKED 🆕: `Fines.jsx` (306 qator) va `Announcements.jsx` (364 qator) kodda BOR,
      lekin TASK.md da umuman yozilmagan edi — kim qurgani va holati noma'lum, aniqlashtirilsin

## Frontend — Admin (Abduloh, Odil, Hamidula)

- [x] ADMIN: rey/xob admin_page ishini staff strukturasiga ko'chirish (alohida Vite-app EMAS — staff ichida sahifalar; merge REVIEW dan keyin)
- [x] ADMIN: Dashboard (income + expenses = profit) — Dashboard.jsx, api ga ulangan
- [x] ADMIN: Students CRUD (xob integratsiyasi bor — reviewdan o'tkazish) — Students.jsx + StudentDetail.jsx
- [x] ADMIN: Groups CRUD — Groups.jsx + GroupDetail.jsx ⚠️ GroupDetail 6 endpointni mock'dan oladi (K-INT ga qara)
- [ ] ADMIN (Odil): 🆕 Guruh formasi — mentor majburiy + kunlar (1-3-5/2-4-6 preset yoki boshqa kunlar galochka) + boshlanish vaqti + tugash vaqti AVTO (GET /api/admin/settings) → POST/PATCH { days, startTime }; kontrakt TEAM-TASKS §9.2
- [x] ADMIN: Payments UI (full/split modal; K-PAY chiqqach ulanadi) — Payments.jsx (775 qator)
- [x] ADMIN: Expenses CRUD — Expenses.jsx + PDF eksport (Abduloh, jspdf)
- [x] ADMIN: Reports — Reports.jsx, GET /api/admin/reports ga ulangan

## Frontend — YANGI TASKLAR: Sardor / Kozim / Alish 🆕 2026-07-19

> Mentor paneli Karis'ga o'tdi (jamoa bilan kelishilgan) → uchalasi bo'shadi.
> Quyidagilar auditda topilgan HAQIQIY ishlar — har birining isboti bor, o'ylab topilgani yo'q.

### 🔴 KOZIM — admin/Chat.jsx ni jonlantirish (eng katta ish, BLOKLANMAGAN)

- [ ] FE-CHAT-ADMIN: `staff/src/pages/admin/Chat.jsx` (1275 qator) — **soxta chat**.
      Ichida 7 ta TODO va hardcode kontaktlar:
      ```js
      const initialContacts = [
        { id: 1, name: 'Aziz Karimov', role: 'Mentor', lastMsg: 'Salom, bugun dars bormi?' ... }
      ```
      Ya'ni admin chatni ochsa — o'ylab topilgan odamlar va o'ylab topilgan xabarlarni ko'radi.
      Uchta muammo: (1) kontaktlar hardcode (2) Socket.io UMUMAN ulanmagan — realtime yo'q
      (3) "men / u" xabarni `sender_id` bo'yicha emas, boshqa yo'l bilan aniqlayapti — noto'g'ri
      ⚠️ Kodda "backendda endpoint yo'q" deb yozilgan — bu ESKIRGAN. Endi BOR:
      `GET /api/chat/contacts` va `POST /api/chat/dm` (chat.routes.js:98 va :147) + socket tayyor
      📌 Namuna yonida: `pages/mentor/Chat.jsx` — xuddi shu ish u yerda ishlaydigan qilib yozilgan, ko'chir
      💡 Kozim'ga berildi: u o'z panelida chat qilgan, mavzuni biladi

### 🔴 SARDOR — o'lik kod va konsol tozalash

- [ ] FE-DEAD-CODE: repo'da router'ga UMUMAN ulanmagan kod yotibdi, hammani chalg'itadi:
      • `staff/src/pages/mentor/mentoor/` — 13 fayl, 98K, o'z tailwind.config.js si bilan
      • `staff/src/pages/super/ComingSoon.jsx` — App.jsx da ishlatilmaydi
      • `main-admin/src/pages/Placeholder.jsx` — App.jsx da ishlatilmaydi
      ⚠️ `mentoor/` — Kozim'ning ishi. O'chirishdan OLDIN Karis va Kozim bilan kelishilsin
- [ ] FE-ROUTER-FLAG: React Router v7 future flag'lari 4 ta app'ning HECH BIRIDA qo'yilmagan →
      konsol warning'lari to'lib ketgan. Elyor buni 2026-07-16 da aytgan, hech kim olmagan.
      `main.jsx` larga `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`
- [ ] FE-COOP: Google login COOP konsol xatosi (`firebase.js` / `vite.config.js`) —
      bu ham Elyor ro'yxatidan, hech kim olmagan

### 🔴 ALISH — member va student panellarini mentor darajasiga chiqarish

> ⚠️ Zona: `member/` Kama'da, `student/` Abdulaziz'da. Karis ruxsat bergandan KEYIN boshlansin.

- [ ] FE-THIN-PAGES: bu sahifalar juda "yupqa" — mentor paneli darajasidan ancha past:
      `student/Videos.jsx` 69 qator · `student/Tests.jsx` 79 · `student/Leaderboard.jsx` 90 ·
      `member/Debt.jsx` 108 · `member/Notifications.jsx` 112 · `member/Attendance.jsx` 122
      Uch holat (Skeleton / EmptyState / Error), bo'sh holat matnlari, xatoda retry —
      `pages/mentor/_ui.jsx` dagi tayyor komponentlar bilan

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

## Frontend — Design / UX 🆕 EGALARI BELGILANDI (2026-07-19)

> Bu blok ilgari EGASIZ turgan edi — 6 ta vazifa, hech kimga biriktirilmagan.
> Egasiz vazifa = hech kim qilmaydigan vazifa. Endi mentor jamoasi bo'shadi
> (mentor panelni Karis o'zi oldi, jamoa bilan kelishilgan) — shular oladi.

- [ ] UI-DS (Sardor): Har bir panel FRONTEND-DESIGN-SYSTEM.md ga qat'iy rioya qiladi
      (laym #C6FF34, Manrope, qorong'i sidebar #1D2417, kartochka soyalari) — o'zboshimcha ranglar TAQIQLANADI
- [ ] UI-STATES (HAR KIM o'z paneli bo'yicha): har sahifada 3 holat — Skeleton (yuklanish),
      EmptyState (bo'sh ma'lumot), Error (xato + retry). Bu markazlashgan vazifa EMAS:
      kim qaysi sahifada ishlayotgan bo'lsa, o'sha sahifaning uch holatini o'zi yopadi
- [ ] UI-SHARED (Abduloh): Umumiy komponentlar bitta joyda — har panel o'zinikini YASAMAYDI.
      ⚠️ Audit 2026-07-19: tayyor komponentlar `frontend/staff/src/pages/mentor/_ui.jsx` da
      (Panel, EmptyState, RowSkeleton, Avatar, SearchInput, GroupSelect), lekin **admin sahifalari
      bu fayldan UMUMAN foydalanmayapti** — har biri o'zinikini yasagan, dizayn shuning uchun har xil.
      (Eski matnda "main-admin dagi namunadan" deyilgan edi — bu eskirgan, manba endi `_ui.jsx`)
- [ ] UI-RESPONSIVE (Alish): 1280 / 768 / 375 px kengliklar, gorizontal scroll yo'q
- [ ] UI-TABLES (Hamidula): tabular-nums raqamlar, hover-podsvetka, status-pilyulalar (design-system bo'yicha)
- [ ] UI-CACHE (Kozim): barcha mutatsiyalardan keyin TanStack Query cache invalidation +
      optimistic/loading tugma holatlari. Kozim'ga berildi — u api integratsiyasida ishlagan tajribasi bor
