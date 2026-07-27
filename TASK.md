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
- [ ] K-DISC-FRONT 🆕 EGASI: **HAMIDULA** (2026-07-19 da biriktirildi).
      ⚠️ Ilgari "front jamoasiga" deb turgan edi — ISM yo'q edi, shuning uchun 2026-07-18 dan
      beri hech kim olmagan. Egasiz vazifa = qilinmaydigan vazifa.
      Hamidula tanlandi: yuki eng yengil edi (bitta UI-TABLES), forma ishi esa uning yo'nalishi.

      Nima qilinadi (backend TAYYOR, 10 endpoint, Swagger'da "Discipline" tegi ostida):
      • Super panelda: ustav tahrirlash formasi (`PUT /api/super/charter`) +
        shtraf berish formasi (`POST /api/super/penalties`) + ro'yxat (`GET`)
      • Admin panelda: shtraf berish + ro'yxat (`POST/GET /api/admin/penalties`),
        ustavni faqat o'qish (`GET /api/admin/charter`)
      • Mentor va Methodist panelida: FAQAT ko'rish — o'z shtraflari
        (`GET /api/users/me/penalties`) va ustav (`GET /api/users/me/charter`)

      ⚠️ Huquqlar matritsasi backendda qat'iy (CAN_ISSUE) — frontda tugmalarni shunga qarab yashir:
      superadmin → admin/mentor/methodist ga; admin → mentor/methodist ga shtraf,
      qora ro'yxat esa FAQAT mentor'ga; main_admin → HECH KIMGA.
      Backend baribir tekshiradi, lekin ishlamaydigan tugma ko'rsatish yomon UX
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
- [x] K-INT: admin GroupDetail — **QAROR QABUL QILINDI 2026-07-19**, Abdulaziz bloki OCHILDI.

      **Qaror: attendance va homework — mentor jadvallaridan REUSE. Yangi jadval YO'Q.**

      Sabab: bu saqlash masalasi emas, KO'RISH masalasi. Mentor davomatni belgilaydi,
      admin o'sha belgilanganni ko'radi — bu bitta ma'lumotning ikki o'quvchisi.
      Alohida jadval qilinsa, admin ko'rgan davomat mentor yozgan davomatdan
      farq qila boshlaydi. Bu yerda esa oyliklar (mentor_salaries davomatdan hisoblanadi),
      ota-onaga hisobot va qarz — hammasi shu raqamga bog'liq. Ikki manba = ikki haqiqat,
      va qaysi biri to'g'riligini hech kim ayta olmaydi. Sinxronizatsiya ham yechim emas:
      u albatta bir kun bo'lib qoladi va buni hech kim sezmaydi.

      Amalda: mavjud `attendance` va `homework` jadvallariga admin uchun **faqat o'qish**,
      scope `branch_id` bo'yicha (admin faqat o'z filialini ko'radi, JWT dan olinadi —
      klientdan kelgan branch_id ga ishonilmaydi, CONSTRAINTS bo'yicha).
      Yozish huquqi mentor'da qoladi.

      ⚠️ `feedback` — BOSHQA masala: bu jadval umuman YO'Q, ya'ni yangi migratsiya + CRUD kerak.
      Uni reuse qilib bo'lmaydi, chunki reuse qiladigan narsaning o'zi yo'q.

      📌 Karis boshqacha o'ylasa — aytsin, o'zgartiramiz. Lekin Abdulaziz kutib turmasin
- [x] BUG-LOCAL-PROD-DB ✅ TUZATILDI 2026-07-19: `backend/.env` dagi `DATABASE_URL`
      lokal Docker postgres'ga o'tkazildi (`levelup:levelup@localhost:5432/levelup`).
      Tekshirildi: ulanish ishlaydi, lokal bazada AYNI o'sha 18 migratsiya va demo data bor
      (111 user, 6 guruh) — ya'ni hech narsa buzilmadi, ish jarayoni o'zgarmaydi.
      Prod (Neon) satri fayldan olib tashlandi va izoh qoldirildi — u faqat Render dashboard'ida.
      ⚠️ JAMOAGA: kimda `backend/.env` da Neon satri tursa — DARHOL lokalga o'tkazsin.
      Aks holda `npm run seed` demo datani to'g'ridan-to'g'ri PRODGA yozadi

## 🔴 BUGLAR / BLOKERLAR (Karis) — 2026-07-18 tekshiruvida topildi

- [x] BUG-PROD-MOCKS ✅ TUZATILDI 2026-07-19: `frontend/{staff,student,member}/.env.production`
      uchalasiga ham `VITE_USE_MOCKS=false` qo'shildi. Ilgari o'zgaruvchi umuman yo'q edi va
      kod `VITE_USE_MOCKS !== 'false'` ni tekshirgani uchun undefined = MOCK YONIQ bo'lardi —
      ya'ni prodda panellar soxta localStorage datasini ko'rsatardi.
      `main-admin` bu bug'dan jabrlanmagan (uning `api.js` da bu pattern yo'q)
- [x] ~~BUG-STACK~~ ✅ TUZATILGAN (2026-07-19 auditda tekshirildi, TASK.md eskirgan edi): `render.yaml:19-20` da `NODE_ENV=production` O'RNATILGAN, `errorHandler.js:41` stack'ni faqat `env.NODE_ENV === 'development'` da qaytaradi (qat'iy tenglik — yangi hostingda o'zgaruvchi unutilsa ham stack chiqmaydi). Bundan tashqari 5xx da `details` ham berkitildi, o'rniga `errorId` (pino req.id) qaytadi — commit `5a1f177`
- [x] ~~BUG-LOCAL-PROD-DB~~ ✅ TUZATILGAN — **DUBLIKAT yozuv edi, 2026-07-26 da yopildi.**
      Yuqorida "Backend — Integration" bo'limida AYNI shu bug allaqachon `[x]` bilan turgan edi
      (19.07 da tuzatilgan), bu yerda esa hali `[ ]` ochiq turardi — bitta ish ikki joyda,
      biri qarama-qarshi holatda. Kod tekshirildi 2026-07-26: `backend/.env` da
      `DATABASE_URL=postgresql://...@localhost:5432/levelup` — lokal, Neon EMAS.
      Quyidagi matn tarix uchun qoldirildi:
      ~~`backend/.env` dagi
      `DATABASE_URL` **to'g'ridan-to'g'ri PROD Neon bazasiga** qaragan
      (`ep-empty-wind-ai4drexy...neon.tech`), lokal Docker postgres'ga EMAS —
      holbuki `levelup-postgres` konteyneri 22 soatdan beri ishlab turibdi va ishlatilmayapti.
      **Nima demak:** kim `npm run seed` yoki `seed-mentor-demo.mjs` ni lokal ishga tushirsa —
      demo data TO'G'RIDAN-TO'G'RI PRODGA yoziladi. Skript `INSERT`/`UPDATE` qiladi.
      Hozircha omad: prodda demo guruhlar yo'q (13 org, 15 filial, 58 user, 6 guruh — real data).
      Lekin bu vaqt masalasi.
      **Tuzatish:** lokal `.env` `postgresql://postgres:postgres@localhost:5432/levelup` ga o'tsin,
      prod URL faqat Render dashboard'ida qolsin. Jamoaga ham aytilsin~~
- [ ] BUG-NO-WORKER 🔥🔥🔥 ENG KATTASI (2026-07-19 auditda topildi): **prodda BIRORTA worker ishlamayapti.**
      ⚠️ **2026-07-26 da qayta tekshirildi — HALI OCHIQ.** `render.yaml` da bitta `type: web`,
      `type: worker` yo'q. Fayl sarlavhasidagi izohda ham to'g'ridan-to'g'ri yozilgan:
      "Фоновый worker (BullMQ) и cron 09:00 на free НЕ запускаются — только API".
      Ya'ni bu bilib turib qoldirilgan holat, unutilgan emas — lekin mijoz uchun farqi yo'q

      `worker.js` 4 ta worker va 3 ta cron ko'taradi:
      `notificationWorker` · `overdueWorker` + cron 09:00 · **`billingWorker` + oylik cron** · `dueSoonWorker`
      `package.json` da alohida skript ham bor: `"worker": "node worker.js"`.
      Lekin `render.yaml` da **`type: worker` servisi 0 ta** — faqat bitta `type: web`,
      u esa `npm start` → `node src/server.js` ni ishga tushiradi. Ya'ni `worker.js` HECH QACHON yugurmaydi.

      **Prodda nima ishlamayapti:**
      • Oylik hisob-fakturalar AVTOMATIK yaratilmaydi (billing.worker, har oy 1-sanada) →
        invoice yo'q → qarz hisoblanmaydi → `total_debt` o'sib bormaydi
      • Muddati o'tgan to'lovlar aniqlanmaydi (overdue cron 09:00) →
        `invoice='overdue'` qo'yilmaydi → `paymentGate` (402) ishlamaydi, qarzdor student panelni ochaveradi
      • To'lov bildirishnomalari yuborilmaydi (`payment.received` / `payment.due` / `payment.refunded`)
      • Ota-onaga eslatmalar bormaydi (dueSoon)
      • **Bilol'ning Telegram boti umuman xabar olmaydi** — queue'ga tushadi, hech kim o'qimaydi

      ⚠️ TASK.md da `K-PAY` "oylik avto-hisoblash" bilan birga **[x] BAJARILGAN** deb turibdi.
      Kod yozilgan — to'g'ri. Lekin prodda ishlamayapti, ya'ni mijoz uchun u YO'Q.
      Bu loyihaning asosiy sotuv nuqtasi (to'lov boshqaruvi) prodda o'lik degani.

      **Yechim variantlari** (Karis tanlaydi):
      1. `render.yaml` ga `type: worker` servisi qo'shish — TO'G'RI yo'l, lekin **free planda worker YO'Q**, pullik kerak
      2. Vaqtinchalik: `worker.js` ni web servis ichida ko'tarish (`server.js` dan import) —
         kichik yuklamada ishlaydi, lekin web uxlab qolsa cron ham uxlaydi (free plan 15 daqiqada uxlaydi)
      3. Tashqi cron (masalan cron-job.org) maxsus endpointni chaqiradi — eng arzoni, lekin endpoint himoyalanishi shart

- [x] BUG-TESTS-RED ✅ TUZATILDI 2026-07-19 (commit `b22c3e4`):
      testlar bugungi sanaga o'tkazildi (sana serverdagidek Toshkent bo'yicha hisoblanadi),
      `npm test` `&&` zanjiridan `tests/run-all.js` ga o'tkazildi — endi har bir to'plam
      alohida processda yuguradi va bittasi yiqilsa qolganlari BEKOR BO'LMAYDI.
      Yangi test qo'shildi (3b) — "faqat bugun" qoidasining o'zi hech narsa bilan qoplanmagan edi,
      shuning uchun uning kelishi 3 ta begona testni yiqitgan edi. Endi kecha va ertaga ham tekshiriladi.
      **Natija: 5 ta to'plam ham YASHIL — 66 test** (mentor 17 · student 17 · parent 4 · payments 13 · auth 15)

- [~] ~~BUG-TESTS-RED~~ (tarix uchun) 🔥 (2026-07-19 auditda topildi — testlar ISHGA TUSHIRILDI):
      **Mentor testlarida 3 ta FAIL, sababi mening o'z o'zgarishim.**
      `b6bf912` commit'i "mentor faqat BUGUNGI darsni belgilay oladi" qoidasini kiritdi
      (`attendance.service.js:35` — `assertToday()`), testlar esa davomatni o'tgan sana bilan qo'yadi:
      • 1. Bulk-mark mixed statuses → `O'tgan kunlar davomatini o'zgartirib bo'lmaydi`
      • 2. Re-mark same group+date → xuddi shu
      • 3. Boshqa mentor chet guruhni belgilashi → 404 kutilgan, 422 kelgan

      ✅ Xavfsizlik TEKSHIRILDI — sizib chiqish YO'Q: `assertToday` egalikdan OLDIN tursa ham,
      o'tgan sanada har qanday guruh (o'ziniki, chetniki, umuman yo'q) bir xil 422 beradi,
      bugungi sanada esa bir xil 404 — ya'ni guruh bor-yo'qligini ajratib bo'lmaydi.
      **Kod TO'G'RI, TESTLAR eskirgan** → 3 ta testni bugungi sanaga o'tkazish kerak
      (3-testni ham, aks holda u egalik tekshiruvigacha yetib bormaydi va tekshirmaydi)

      ⚠️ Bundan ham yomoni: `npm test` skripti `&&` bilan zanjir qilingan —
      mentor yiqilgani uchun **student / parent / payments / auth testlari UMUMAN yugurmagan**.
      Alohida ishga tushirilganda hammasi YASHIL: student 17/17 · parent 4/4 · payments 13/13 · auth 15/15.
      Ya'ni bitta fail 49 ta sog'lom testni yashirib turgan. `&&` o'rniga har biri alohida ishlasin
      va oxirida umumiy natija chiqsin

- [ ] BUG-REDIS-SILENT 🔥 (2026-07-19): `env.js` da `REDIS_URL: z.string().min(1).default('redis://localhost:6379')`.
      ⚠️ **2026-07-26 da qayta tekshirildi — HALI OCHIQ**, `env.js:13` da default o'z joyida turibdi.
      Ya'ni Render'da bu o'zgaruvchi qo'yilmasa — server JIMGINA ko'tariladi va localhost'ga urinaveradi.
      Log'da `Redis error` chiqadi, lekin process yiqilmaydi. Natijada socket (chat, davomat live) va
      barcha queue'lar ishlamaydi, sabab esa ko'rinmaydi.
      `REDIS_URL` `sync: false` — ya'ni faylda yo'q, faqat dashboard'da. Tekshirilsin va prodda default olib tashlansin
      (production'da majburiy bo'lsin, dev'da default qolsin)

- [x] ~~BUG-BILLING~~ ✅ YOPILDI 2026-07-26 (Karis): `Billing.jsx` bakit modeliga o'tkazildi,
      saqlash formasi olib tashlandi (bekend baribir yozmaydi). Tarixiy tavsif:
      ~~`main-admin/src/pages/Billing.jsx` hali ESKI narx modelida (`baseFirstBranch`/`perStudent`), backend 2026-07-16 dan `{ tiers, currency }` qaytaradi → sahifa buzilgan. Egasi: Shohjahon (pastda MAIN bo'limida ham bor).
      SABABI TOPILDI: swagger `PlatformPricing` sxemasi ham eski modelda qolgan edi — Shohjahon hujjatga qarab qurgan. Sxema 2026-07-18 da tuzatildi (tiers), endi front ni ham moslashtirish kerak~~

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

### AB-INT-GROUP ✅ YOPILDI (Abdulaziz, 2026-07-20)

- [x] AB-INT-GROUP — attendance/homework/feedback endpointlar `admin.routes.js` da,
      `feedback` uchun yangi jadval (migratsiya `1783860000000`, commit `5a70184`).
      Qolgan ish frontda: `GroupDetail.jsx` hali mock'dan olyapti, real API ga o'tsin (Abduloh)

### AB-SUPER-STUB ✅ barchasi yopildi (Abdulaziz, 2026-07-20/21)

- [x] AB-SUPER-ANN — `GET/POST/DELETE /api/super/announcements` (`460914b`)
- [x] AB-SUPER-REM — `GET /api/super/reminders` + resend/delete (`870d1c5`)
- [x] AB-SUPER-AUDIT — `GET /api/super/audit` (`460914b`)
- [x] AB-SUPER-STATS — `GET /api/super/stats` (`460914b`); front tomoni FE-SUPER-STATS'da
- [ ] AB-SUPER-SWAGGER: `super.routes.js:409-431` izohi hali "501" deb eskirgan —
      yangilansin + `swagger/*.md` qayta generatsiya

### AB-SUPER-REPORTS + AB-MAIN-REVENUE (Abdulaziz)

- [x] AB-SUPER-REPORTS — `GET /api/super/reports` (`460914b`); front FE-SUPER-REPORTS'da
- [x] AB-EXPENSE-PATCH — `PATCH /api/admin/expenses/:id` qo'shildi
- [x] AB-MAIN-REVENUE — `GET /api/main/revenue` (`460914b`); front tomoni Shohjahon'da (MAIN: Revenue)

### AB-VERIFY

- [ ] AB-VERIFY: `VITE_USE_MOCKS=false` bilan Student/Parent panellarini jonli E2E tekshirish
- [x] AB-VERIFY: Parent Chat — Socket.io realtime tasdiqlandi (2026-07-21)

## Telegram bot (Bilol) ⚠️ TASK.md ga 2026-07-19 da QO'SHILDI

> ❌ Muammo: Bilol jamoada, 14 commit qilgan, lekin bu faylda uning NOMI ham yo'q edi.
> Vazifalari `docs/TASK-telegram-bot.md` da alohida yotibdi va u yerda **0 ta [x]** —
> holbuki u allaqachon ishlagan (masalan `bot.start()` — /start va /stop umuman
> polling qilmayotgan edi, o'sha tuzatilgan). Ya'ni fayl real holatdan orqada.
> Bitta manba bo'lishi kerak — shuning uchun bu yerga ko'rsatkich qo'yildi.

- [x] TG-SYNC ✅ BAJARILDI 2026-07-26 (Karis): `docs/TASK-telegram-bot.md` kod bilan sverka
      qilindi, 8 ta vazifa `[x]` ga o'tkazildi va fayl boshiga sverka jadvali qo'yildi.
      Bilol'ning ishi yozilmay qolgani sabab u "hech narsa qilmagan"dek ko'rinardi — bu noto'g'ri edi
- [x] TG-BIND ✅ BAJARILGAN (Bilol; 2026-07-26 auditda tasdiqlandi):
      `POST /api/telegram/bind-token` (`telegram.routes.js:42`) + `bind-token.service.js`
      (Redis `SET ... EX NX`, atomar `GETDEL`) + `/start` payload bilan va payloadsiz
      (`bot.handlers.js:10`) + `/stop` (`bot.handlers.js:54`) + `bot.start()` polling (`bot.js:22`)
- [x] TG-DUE ✅ BAJARILGAN (Bilol): `payment.due_soon` handler `notification.worker.js:21` da,
      payload `{ studentId, amount, dueDate, daysLeft }`.
      ⚠️ Producer (payment_schedules'dan N kun oldin queue'ga qo'yish) — **Karis'da**, hali yozilmagan
- [x] TG-ANN ✅ BAJARILGAN (Bilol): `announcement.created` handler `notification.worker.js:37` da.
      Producer'lar ham to'g'ri nom bilan yozadi (`admin.service.js:724`, `super.service.js:371`)
- [ ] TG-DUE-PRODUCER 🆕 (Karis): `payment.due_soon` ni queue'ga qo'yadigan job YO'Q.
      Bilol tomoni tayyor, lekin uni hech kim chaqirmaydi → eslatma hech qachon ketmaydi.
      `payment_schedules` dan muddatdan N kun oldin tanlab, idempotent tarzda qo'yilsin
- [ ] TG-PROD-DEAD 🔴🆕 (Karis): butun TG zanjiri **prodda o'lik** — `BUG-NO-WORKER`.
      `render.yaml` da `type: worker` yo'q → `worker.js` yugurmaydi → `notifications` navbatini
      hech kim o'qimaydi. Bot `/start` ni qabul qiladi, lekin BIRORTA bildirishnoma yetib bormaydi.
      Bilol'ning 14 commit'i shu sababli mijozga ko'rinmayapti — bu uning aybi emas
- [ ] TG-FRONT (kim bo'shasa): kabinetda "Telegramni bog'lash" tugmasi —
      `bind-token` ni chaqirib deep-link ko'rsatadi. Front tomoni hech kimga berilmagan

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

- [ ] AUTH-FORGOT 🔥 QISMAN TUZATILDI (2026-07-21 audit): avvalgi yozuv NOTO'G'RI edi —
      "frontend da fayl 0 ta" audit fayl NOMI bo'yicha qidirgan edi, `ForgotForm` esa `Login.jsx`
      ICHIDA yozilgan, alohida fayl emas. Haqiqatda `ForgotForm` (`staff` + `main-admin`,
      `Login.jsx`) real backendga TO'G'RI ulangan (`forgotPassword`/`resetPassword`, `api.js:2162-63`).
      **Qolgan haqiqiy tirqish:** `USE_MOCKS=true` bo'lganda `api.js` mock-blokida
      `/auth/forgot-password` va `/auth/reset-password` uchun case yo'q → "Mock route not
      implemented" (dev/mock rejimida ishlamaydi, real backendda ishlaydi). Tuzatish: mock
      blokiga (`/auth/logout`dan keyin, ~2018-qator atrofida) ikkita `if` case qo'shish.
      Ochiq savol qoladi: `member` (Student/Parent) login-kod bilan kiradi, email bo'lmasligi
      mumkin → ularga tiklash admin orqalimi yoki umuman formasiz? Qaror kerak.
- [ ] AUTH-ELYOR-4: Elyor 2026-07-16 da 4 ta muammoni topgan, lekin ular umumiy fayllarda
      (`api.js`, `auth.jsx`, `main.jsx`, `vite.config.js`) — o'z chegarasidan tashqari bo'lgani uchun
      TEGMAGAN va Karis'ga uzatgan (`frontend/staff/elyor-log.md`). 2026-07-21 qayta tekshirildi:
      1) [x] admin dashboard `api.adminDashboard is not a function` — TUZATILGAN (`api.js:2166` bor)
      2) [ ] «Забыли пароль» mock ishlamaydi — hali OCHIQ (AUTH-FORGOT bilan bir xil ildiz)
      3) [ ] Google login COOP konsol xatosi — hali OCHIQ (FE-COOP)
      4) [ ] React Router v7 future-flag warning — hali OCHIQ (FE-ROUTER-FLAG), past prioritet

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

- [x] FE-SUPER-STATS ✅ **BAJARILDI 2026-07-27 (Karis)** — sahifa `GET /api/super/stats?period=` ga
      ulandi. 7/30/90 tugmalari endi haqiqiy so'rov yuboradi (avval faqat tugma rangini
      o'zgartirardi), "Выручка по дням" haqiqiy `revenueSeries` bo'yicha chiziladi (avval o'q
      bo'ylab filiallar turardi), "Способы оплаты" bloki haqiqiy `paymentMethods` bilan qaytdi.
      Backendga `totals.periodRevenue` qo'shildi: KPI "Выручка" hamma vaqt uchun edi grafiklar esa
      7 kun uchun — bitta ekranda ikkita har xil raqam turardi. Lokal bazada tekshirildi:
      period=7d → 2 400 000, period=30d → 9 750 000, naqd/karta/o'tkazma 32/37/31 foiz
      Asl vazifa matni (Said Islom uchun yozilgan edi): `super/Stats.jsx:22-27` da **O'YLAB TOPILGAN raqamlar** bor edi:
      ```js
      const PAYMENT_METHODS = [
        { name: 'Наличные', value: 65 }, { name: 'Карта', value: 30 }, { name: 'Online', value: 5 },
      ];
      ```
      Bu hardcode haqiqiy grafik bo'lib chiziladi — hamkor "65% naqd" degan raqamni ko'radi,
      lekin uni HECH KIM hisoblamagan. Bu eng xavflisi: sahifa ishlayotgandek ko'rinadi.
      Hardcode o'chirilsin, `GET /api/super/stats` ga ulansin.
      🟢 **2026-07-26: backend TAYYOR** — `GET /api/super/stats` `super.routes.js:586` da bor
      (`period` query bilan). Kutiladigan hech narsa yo'q, ish to'liq frontda.
      ⚠️ Sahifa hozir `useSuperDashboard` ni chaqiryapti — bu Dashboard'ning endpointi, Stats'niki EMAS.
      Hardcode 2026-07-26 da ham `Stats.jsx` da joyida turibdi (qayta tekshirildi)
- [x] FE-SUPER-REPORTS ✅ **BAJARILDI 2026-07-27 (Karis)** — sahifa `GET /api/super/reports` ga
      o'tkazildi. Filialning ulushi endi serverdan keladi (`branch.share`), razmetkada qayta
      hisoblanmaydi — aks holda formulani serverda o'zgartirsak ikki joyda ikki xil raqam chiqardi.
      O'rtacha tushum ham serverdan. Lokal bazada tekshirildi: 9 750 000 · ulush 100 foiz · 1 admin.
      Asl vazifa matni (Aziz uchun): `super/Reports.jsx` ham `useSuperDashboard` da o'tirardi — o'z ma'lumoti yo'q edi.
      Ya'ni Dashboard / Stats / Reports — uchtasi BITTA endpointdan oziqlanyapti.
      🟢 **2026-07-26: backend TAYYOR** — `GET /api/super/reports` `super.routes.js:619` da bor.
      Ish faqat frontda: `useSuperDashboard` o'rniga o'z endpointiga o'tsin
- [ ] FE-SUPER-WIRE (Said Islom + Aziz): Announcements (359 qator) / Reminders (257) / Audit (293).
      🟢 **BLOKER OLINDI (2026-07-26 auditda aniqlandi):** backend endi 501 qaytarmaydi —
      Abdulaziz uchala endpointni ham 2026-07-20/21 da yozib bo'lgan
      (`460914b`, `870d1c5`; AB-SUPER-ANN / REM / AUDIT ga qara). Ya'ni bu 909 qator kod
      **bugundan boshlab real data ko'rsatishi mumkin** — kutish shart emas.
      Qilinadigan ish: real superadmin login bilan uchala sahifani ochib tekshirish +
      Skeleton / EmptyState / Error uch holati ishlashiga ishonch hosil qilish

## Main Admin (Karis) 🔥 to'liq egasi — 2026-07-26 dan, front + backend

> 🔄 **Egasi almashdi (2026-07-26, Karis qarori):** panel Shohjahon'dan Karis'ga o'tdi.
> Sabab: panelning to'rtta sahifasi mavjud bo'lmagan endpointlarga urilardi, ya'ni ish
> frontda emas, ikki tomonda edi — `main` moduli esa baribir Karis'ning zonasi.
> Endi front ham, backend ham bitta odamda: chegara yo'q, kutish yo'q.
> Shohjahon'ning 16.07 gacha qilgan ishi joyida qoladi (Dashboard / Leads / Organizations
> / OrgDetail) — u qayta yozilmadi.

- [x] MAIN: Dashboard — KPI + grafiklar (Dashboard.jsx, 805 qator)
- [x] MAIN: Leads — ro'yxat / filtr / status o'zgartirish, OnboardModal (temp-parol), Qabul / Rad etish
- [x] MAIN: Organizations (hamkorlar) — ro'yxat / qidiruv, freeze / activate (855 qator)
- [x] MAIN: Org-detail sahifasi — OrgDetail.jsx qurilgan
- [x] MAIN: Billing ✅ TUZATILDI 2026-07-26 (Karis) — BUG-BILLING yopildi.
      `Billing.jsx` butunlay qayta yozildi: eski formula (`baseFirstBranch`/`perExtraBranch`/
      `perStudent`) o'rniga bakit modeli — `pricing.tiers` serverdan olinadi, jadval qilib
      ko'rsatiladi, kalkulyator o'quvchi soniga qarab tarifni tanlaydi (`tierForStudents`
      qoidasi frontda takrorlangan, tariflar esa serverdan — hisob bir zumda ishlaydi).
      **Saqlash formasi ATAYIN olib tashlandi:** `PUT /api/main/pricing` bekendda hech narsa
      yozmaydi (`return getPricing()`), tariflar `config/plans.js` da. Ilgari tugma "saqlandi"
      deb yolg'on rapor berardi. Sahifada endi "faqat o'qish" belgisi va sabab yozilgan.
      DB-editable tariflar — v2 (PRICE bo'limiga qara).
- [x] MAIN: Revenue ✅ ULANDI 2026-07-26 (Karis).
      `api.js` ga `revenue` metodi qo'shildi, `queries.js` ga `useRevenue()`; `Revenue.jsx`
      endi `GET /api/main/revenue` dan oladi (ilgari `useDashboard` da o'tirardi).
      Umumiy summa server javobidan olinadi (`totals.ourMonthlyIncome`), frontda qayta
      hisoblanmaydi — aks holda tarif o'zgarganda ikki tomon jimgina ajralib ketardi.
      🔴 **Eng muhimi:** "chorak / yil" tugmalari endi ochiq **PROGNOZ** deb belgilangan
      ("Prognoz na:", "oylik × N, hamkorlar tarkibi o'zgarmasa", KPI'da "оценка").
      Ilgari oylik summa jimgina koeffitsiyentga ko'paytirilib "Доход / год" deb
      yozilardi — o'ylab topilgan raqam haqiqiydek ko'rinardi. Fakt bo'yicha davr
      kesimi uchun hisob-faktura tarixi kerak, u platformada hali yo'q.
- [x] MAIN: Settings — ✅ audit 2026-07-19: "zaglushka" deb yozilgani NOTO'G'RI edi.
      438 qator, `useDashboard` + `usePricing` + `api.updateProfile` — real ishlaydi
- [x] MAIN-404-BACKEND ✅ YOPILDI 2026-07-26 (Karis) — endpointlar YOZILDI.
      Ilgari front mavjud bo'lmagan 4 ta yo'lga urilardi. Endi ular bor:
      • `GET/POST/DELETE /api/main/announcements` — platforma e'lonlari.
        Yangi migratsiya `1783900000000_platform-announcements` (`platform_announcements`
        jadvali + `platform_announcement_target` enum: `all-partners` / `all-superadmins`).
        Super'nikidan alohida: u yerda auditoriya bitta tashkilot ichida, bu yerda —
        hamkorlarning o'zi, qiymatlar kesishmaydi.
        ⚠️ Navbatga (`notificationQueue`) ATAYIN qo'yilmaydi: qabul qiluvchilar xodimlar,
        `telegram_accounts` esa faqat student/parent uchun to'ladi — worker chat_id topolmay
        vazifani jimgina tashlab yuborardi.
      • `GET /api/main/profile` + `PATCH /api/main/profile` — profil. Email va telefon
        bandligi oldindan tekshiriladi → tushunarli 409, xom BD xatosi emas.
      **Frontda ham tuzatildi:** `Settings.jsx` da `catch` bloki 404/500 ni "muvaffaqiyat"
      qilib ko'rsatardi ("graceful degradation") — ya'ni saqlanmaganini yashirardi.
      Olib tashlandi, endi xato ko'rinadi, 409 esa alohida matn bilan.
      **Jonli tekshirildi** (lokal BD, seed): 201 create → GET ro'yxatda ko'rinadi →
      DELETE 200 → ikkinchi DELETE 404; yaroqsiz `targetType` → 422; band email → 409;
      bo'sh body → 422; tokensiz → 401.
- [x] MAIN-FINES-MOCK ✅ YOPILDI 2026-07-26 (Karis) — mok o'chirildi, sahifa qayta yozildi.
      `initialMock` (6 ta o'ylab topilgan hamkor va jarima) butunlay olib tashlandi.
      **Qaror: shtraf yozish formasi olib tashlandi, sahifa faqat ko'rish uchun.**
      Sabab kod bilan tasdiqlangan: `discipline` modulidagi CAN_ISSUE matritsasida
      `main_admin` HECH KIMGA jazo bera olmaydi — jazoni Super Admin va Admin o'z
      tashkiloti ichida beradi. Ya'ni "jarima yozish" tugmasi tamoyil bo'yicha ishlay
      olmasdi, uni backendga ulash mumkin emas edi.
      O'rniga: `GET /api/main/penalties` — barcha hamkorlar bo'yicha intizom sharhi
      (KPI: shtraflar summasi/soni, ishdan bo'shatishlar, qamrab olingan tashkilotlar;
      jadval: markaz / xodim / sabab / kim bergan / summa / sana; qidiruv va tur filtri).
      Faqat SELECT — yozish yo'q. Sahifada nega forma yo'qligi izohlangan.
      **Jonli tekshirildi:** test yozuv qo'yilgach JOIN to'g'ri ishladi —
      markaz nomi, xodim, kim bergani va summa to'g'ri qaytdi.
- [x] MAIN: Forgot-password ✅ POLISH QILINDI 2026-07-26 (Karis).
      Sikl o'zi to'liq edi (3 bosqich: kod so'rash → kod+yangi parol → tayyor).
      Tuzatilgani: 1) `POST /auth/forgot-password` da **429 ishlanmasdi** — bekendda
      `passwordResetLimiter` turibdi, tez-tez bosilganda xom xabar chiqardi; endi
      "Слишком много запросов кода" deb tushuntiriladi. 2) "Kodni qayta yuborish"
      tugmasi aslida QAYTA YUBORMASDI — birinchi bosqichga qaytarardi xolos, odam
      uni ketma-ket bosib limitga urilardi; endi haqiqiy qayta yuborish + 60 sekundlik
      hisob ("Отправить заново через N с"), yonida alohida "Другой email" havolasi
- [x] MAIN: Design-system ✅ TEKSHIRILDI 2026-07-26 (Karis), jonli brauzerda.
      Laym `#C6FF34` va Manrope `tailwind.config.js` da (`limebrand`, `primary`, `sans`) — joyida.
      Uch holat barcha data-sahifalarda bor (Skeleton / EmptyState / Error) — yangi
      Billing va Fines ga ham qo'yildi.
      **Responsive jonli o'lchandi** (Playwright, `scrollWidth > clientWidth` tekshiruvi):
      375 / 768 / 1280 px — oltala sahifada ham gorizontal scroll YO'Q.
      Sahifa matnida `NaN` yoki `undefined` chiqmaydi (avtomatik tekshirildi).
      TanStack invalidation: e'lon yaratilganda ro'yxat darhol yangilanadi (UI orqali tasdiqlandi)
- [ ] MAIN: Test organizatsiyalarni tozalash — **BAJARILMADI, ataylab.**
      Bu PROD Neon bazasidan yozuv o'chirish demak. Qaysi organizatsiya "test" ekanini
      faqat egasi biladi (13 org bor, ba'zisi real mijoz bo'lishi mumkin), va noto'g'ri
      o'chirilgan tenant bilan birga uning filiallari, o'quvchilari va to'lovlari ketadi.
      Buni avtomat qilish mumkin emas — ro'yxat tasdiqlansin, keyin o'chiriladi.
- [ ] MAIN: Google OAuth — jonli E2E login testi — **BAJARILMADI.**
      Haqiqiy Google hisobiga kirish kerak (Firebase `levelup-1c059`), parol menda yo'q
      va u brauzerda qo'lda kiritiladi. Kod tomoni joyida (`loginWithGoogle`,
      `POST /auth/main/google`), lekin "tekshirildi" deb yozish yolg'on bo'lardi.
- [x] ~~MAIN-FINES~~ — dublikat, yuqoridagi `MAIN-FINES-MOCK` ga birlashtirildi (2026-07-26)
- [x] ~~MAIN-UNTRACKED~~ ✅ ANIQLANDI 2026-07-26: `Fines.jsx` va `Announcements.jsx` ni
      **Shohjahon** qurgan — `a7185cb` ("interactive charts, freeze modal, partner analysis, new pages",
      2026-07-16) va `3eb01ed` ("announcements redesign", 2026-07-16).
      Holati ham aniq: ikkalasi ham ishlamaydi — `MAIN-404-BACKEND` va `MAIN-FINES-MOCK` ga qara

## Frontend — Admin (Abduloh, Odil, Hamidula)

- [x] ADMIN: rey/xob admin_page ishini staff strukturasiga ko'chirish (alohida Vite-app EMAS — staff ichida sahifalar; merge REVIEW dan keyin)
- [x] ADMIN: Dashboard (income + expenses = profit) — Dashboard.jsx, api ga ulangan
- [x] ADMIN: Students CRUD (xob integratsiyasi bor — reviewdan o'tkazish) — Students.jsx + StudentDetail.jsx
- [x] ADMIN: Groups CRUD — Groups.jsx + GroupDetail.jsx
- [ ] ADMIN 🆕 (Abduloh): `GroupDetail.jsx` ni real API ga ulash — attendance / homework / feedback
      hali mock'dan olinyapti. 🟢 **Bloker olindi:** oltala backend endpoint 2026-07-20 dan beri
      TAYYOR (AB-INT-GROUP ga qara), Abduloh esa hali kutayotgan bo'lishi mumkin — unga xabar berilsin
- [ ] ADMIN (Odil): 🆕 Guruh formasi — mentor majburiy + kunlar (1-3-5/2-4-6 preset yoki boshqa kunlar galochka) + boshlanish vaqti + tugash vaqti AVTO (GET /api/admin/settings) → POST/PATCH { days, startTime }; kontrakt TEAM-TASKS §9.2
- [x] ADMIN: Payments UI (full/split modal; K-PAY chiqqach ulanadi) — Payments.jsx (775 qator)
- [x] ADMIN: Expenses CRUD — Expenses.jsx + PDF eksport (Abduloh, jspdf)
- [x] ADMIN: Reports — Reports.jsx, GET /api/admin/reports ga ulangan

## Frontend — YANGI TASKLAR: Kozim / Alish 🆕 2026-07-19 (2026-07-26 da yangilandi)

> Mentor paneli Karis'ga o'tdi (jamoa bilan kelishilgan) → uchalasi bo'shadi.
> Quyidagilar auditda topilgan HAQIQIY ishlar — har birining isboti bor, o'ylab topilgani yo'q.
> 🔄 **2026-07-26:** Sardor bu bo'limdan chiqarildi — u endi `Frontend — Student` panelining
> to'liq egasi. Uning vazifalari Kozim'ga (tozalash) va Kama'ga (`member/` sahifalari) berildi.

### 🔴 KOZIM — admin/Chat.jsx ni jonlantirish (eng katta ish, BLOKLANMAGAN)

- [x] FE-CHAT-ADMIN ✅ BAJARILDI 2026-07-21 (Karis): chat endi HAQIQIY.
      Yechim — nusxa ko'chirish EMAS, umumiy komponent: `components/StaffChat.jsx`
      ni mentor va admin BIRGA ishlatadi (`variant` faqat matnlarni almashtiradi).
      Sabab: rollar farqi faqat qamrovda, uni backend hisoblaydi
      (`listStaffContacts` — mentorga guruhlari, adminga butun filial).
      Jonli tekshirildi: kontaktlar BD dan keladi, yuborilgan xabar socket orqali
      `chat_messages` ga admin `sender_id` bilan yozildi. Jami −1934 qator.
      ⚠️ Olib tashlangan soxta funksiyalar (backend ularni QO'LLAB-QUVVATLAMAYDI):
      xabarga javob, "yozmoqda" indikatori, yozishmani o'chirish, tarix bo'yicha qidiruv
- [~] ~~FE-CHAT-ADMIN~~ (tarix uchun): `staff/src/pages/admin/Chat.jsx` (1275 qator) — **soxta chat**.
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

### 🔴 KOZIM — o'lik kod va konsol tozalash ⬅️ 2026-07-26 da Sardor'dan o'tdi

> Sardor to'liq Student paneliga o'tdi (Karis qarori 2026-07-26), shuning uchun
> bu uchta vazifa Kozim'ga berildi — u chat integratsiyasidan keyin bo'sh.

- [ ] FE-DEAD-CODE: repo'da router'ga UMUMAN ulanmagan kod yotibdi, hammani chalg'itadi:
      • ~~`staff/src/pages/mentor/mentoor/`~~ ✅ O'CHIRILDI 2026-07-21 (Karis, Kozim bilan kelishilgan)
      • `staff/src/pages/super/ComingSoon.jsx` — App.jsx da ishlatilmaydi
      • `main-admin/src/pages/Placeholder.jsx` — App.jsx da ishlatilmaydi
      ⚠️ `mentoor/` — Kozim'ning ishi. O'chirishdan OLDIN Karis va Kozim bilan kelishilsin
- [ ] FE-ROUTER-FLAG: React Router v7 future flag'lari 4 ta app'ning HECH BIRIDA qo'yilmagan →
      konsol warning'lari to'lib ketgan. Elyor buni 2026-07-16 da aytgan, hech kim olmagan.
      `main.jsx` larga `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`
- [ ] FE-COOP: Google login COOP konsol xatosi (`firebase.js` / `vite.config.js`) —
      bu ham Elyor ro'yxatidan, hech kim olmagan

### 🔴 ALISH — `member/` panelini mentor darajasiga chiqarish

> ⚠️ Zona: `member/` Kama'da — Karis ruxsat bergandan KEYIN boshlansin.
> 🔄 **2026-07-26:** `student/` qismi bu vazifadan OLIB TASHLANDI — u endi Sardor'da
> (`Frontend — Student` bo'limiga qara). Alish'da faqat `member/` qoldi.

- [ ] FE-THIN-PAGES: bu sahifalar juda "yupqa" — mentor paneli darajasidan ancha past:
      `member/Debt.jsx` 108 qator · `member/Notifications.jsx` 112 · `member/Attendance.jsx` 122
      Uch holat (Skeleton / EmptyState / Error), bo'sh holat matnlari, xatoda retry —
      `pages/mentor/_ui.jsx` dagi tayyor komponentlar bilan

## Frontend — Mentor (Sardor, Kozim, Alish)

- [x] MENTOR: Dashboard (groups, upcoming lessons)
- [x] MENTOR: Attendance journal — Attendance.jsx (726 qator, api ga ulangan)
- [x] MENTOR: Homework (check, grades)
- [x] MENTOR: Tests (create, results) — Tests.jsx + konstruktor + natijalar (2026-07-18)
- [x] MENTOR: Coins (assign/deduct)
- [x] MENTOR: Chat — shaxsiy dm: xonalar, Socket.io + tarix, faqat xodim va ota-ona ko‘radi (2026-07-18)

## Frontend — Student (Sardor) 🔥 to'liq egasi — 2026-07-26 dan

> 🔄 **Egasi almashdi (2026-07-26, Karis qarori):** panel Abdulaziz'dan Sardor'ga o'tdi.
> Abdulaziz **faqat backend**da qoladi (`Backend — Student`, `Backend — Mentor`,
> `Backend — Parent`, `Backend — Infrastructure`, SEO) — frontendda uning zonasi yo'q.
> Sardor'ning eski vazifalari (FE-DEAD-CODE / FE-ROUTER-FLAG / FE-COOP / UI-DS)
> boshqalarga berildi — u endi FAQAT shu panel bilan shug'ullanadi.

> ⚠️ Barcha sahifalar QURILGAN va api kontraktiga ulangan, LEKIN mock rejimida ishlaydi
> (BUG-PROD-MOCKS ga qara). Jonli E2E qilinmagan.

- [x] STUDENT: Home (coins, groups, deadlines)
- [x] STUDENT: Tests — Tests.jsx + TestTake.jsx (timer/scoring)
- [x] STUDENT: Homework
- [x] STUDENT: Shop
- [x] STUDENT: Videos
- [x] STUDENT: Leaderboard
- [x] STUDENT: staff design-system'ga ko'chirildi (Tailwind + DaisyUI) — 2026-07-25, Karis (`a458c1b`)
- [ ] STUDENT (Sardor): jonli E2E — VITE_USE_MOCKS=false bilan real backend'da tekshirish
- [ ] STUDENT (Sardor): "yupqa" sahifalarni to'ldirish — `Videos.jsx` 69 qator ·
      `Tests.jsx` 79 · `Leaderboard.jsx` 90. Uch holat (Skeleton / EmptyState / Error),
      bo'sh holat matnlari, xatoda retry — `pages/mentor/_ui.jsx` tayyor komponentlari bilan.
      ⬅️ Alish'ning FE-THIN-PAGES vazifasidan `student/` qismi shu yerga ko'chirildi
- [ ] STUDENT (Sardor): UI-STATES — o'z panelidagi har bir sahifada 3 holat
- [ ] STUDENT (Sardor): design-system — laym #C6FF34, Manrope, responsive 1280/768/375

## Frontend — Parent (Kama — @Azizovcf, git iface9808-sketch) 🔥 to'liq egasi

> Methodist'dan Parent panelga o'tkazildi. Backend tayyor (AB-PARENT: child overview + assertParentOwnsChild guard).
> Panel: `frontend/member` (parent tomoni — login-kod + parol bilan kiradi).

- [x] PARENT: Child overview — Dashboard.jsx (useParentOverview hook)
- [x] PARENT: Bir nechta farzand — child-context.jsx (bolalar orasida almashtirish)
- [x] PARENT: Davomat detali — Attendance.jsx
- [x] PARENT: Baholar / uy vazifa natijalari — Grades.jsx
- [x] PARENT: To'lov / qarz — Debt.jsx
- [x] PARENT: Chat — Chat.jsx (16 chaqiruv) ✅ Socket.io realtime tasdiqlandi (2026-07-21)
- [x] PARENT: Bildirishnomalar — Notifications.jsx
- [ ] PARENT: jonli E2E — mock o'chirilgan holda real parent login bilan tekshirish
- [ ] PARENT: Design-system — laym #C6FF34, Manrope, 3 holat (Skeleton/Empty/Error), responsive 1280/768/375, TanStack Query

### 🔴 PARENT (Kama) — auditda topilgan yangi kamchiliklar (2026-07-21)

- [ ] AB-PARENT-NOTIF: `GET /api/parent/notifications` backendda YO'Q — `parent.routes.js`
      faqat `overviewRoutes`ni ulaydi. Hozir front faqat mock bilan ishlaydi. Egasi: Abdulaziz (backend)
- [ ] FE-PARENT-DEBT: `member/Debt.jsx:57` — progress-bar qiymati hardcode `value={0}`,
      to'langan/kutilayotgan ulush hech qachon hisoblanmaydi. Egasi: Kama
- [ ] FE-PARENT-PROFILE-PREF: `member/Profile.jsx:100,112` — toggle'lar `defaultChecked`,
      `onChange` yo'q, saqlanmaydi. Backendda preference API ham yo'q. Egasi: Kama (front) + Abdulaziz (backend, kerak bo'lsa)
- [ ] FE-PARENT-SIDEBAR-NOTIF: desktop sidebar'da bildirishnomalarga link yo'q — faqat mobil
      qo'ng'iroq ikonkasi orqali ochiladi. Egasi: Kama
- [ ] FE-PARENT-PAGINATION: ro'yxatlarda (Attendance/Grades/Notifications) pagination yo'q,
      faqat oz miqdordagi yozuv ko'rsatiladi. Egasi: Kama

## Frontend — Landing Page ✅

- [x] LANDING: Home, Features, Roles, Finance, Gamification, Contacts
- [x] LANDING: Header, Footer, CTA

## Frontend — Methodist (Said Islom, Aziz — Super Admin'dan o'tkazildi) ✅ karkas

> Panel karkasi tayyor (Karis). Said Islom + Aziz endi Methodist jamoasida — qo'shimcha ish + MVP2 kontent-menejer + support/maintenance.
> ⚠️ **2026-07-26:** bu bo'limda ochiq vazifa YO'Q, lekin ikkalasining REAL ochiq ishi bor —
> `Frontend — Super Admin` bo'limidagi FE-SUPER-STATS / FE-SUPER-REPORTS / FE-SUPER-WIRE.
> Git-hisobotda ular shu sababli endi "Super Admin" panelida ko'rinadi (ilgari "Methodist · 0 vazifa"
> deb turardi, Super Admin esa egasiz ko'rinardi — ikkalasi ham noto'g'ri manzara berardi).
> Methodist ishi qaytadan boshlansa (MVP2 kontent-menejer) — hisobotdagi panel qaytariladi.

- [x] METHODIST: Training Types (CRUD)
- [x] METHODIST: Topics (CRUD)
- [x] METHODIST: Lessons (CRUD + LessonEditor)
- [x] METHODIST: Analytics
- [x] METHODIST: Dashboard

## Frontend — Design / UX 🆕 EGALARI BELGILANDI (2026-07-19)

> Bu blok ilgari EGASIZ turgan edi — 6 ta vazifa, hech kimga biriktirilmagan.
> Egasiz vazifa = hech kim qilmaydigan vazifa. Endi mentor jamoasi bo'shadi
> (mentor panelni Karis o'zi oldi, jamoa bilan kelishilgan) — shular oladi.

- [ ] UI-DS (HAR KIM o'z paneli bo'yicha — 2026-07-26 da Sardor'dan taqsimlandi):
      Har bir panel FRONTEND-DESIGN-SYSTEM.md ga qat'iy rioya qiladi
      (laym #C6FF34, Manrope, qorong'i sidebar #1D2417, kartochka soyalari) — o'zboshimcha ranglar TAQIQLANADI
      ✅ ADMIN QISMI BAJARILDI 2026-07-21 (Karis): admin panelida 651 ta klass-daraja
      `var(--...)` mavzu tokenlariga o'tkazildi, `glass-strong` → `card bg-base-100`.
      **Ildiz sabab topildi:** `index.css` `:root` da DaisyUI mavzusidagi AYNI qiymatlar
      qayta e'lon qilingan edi (`--green` #40833B == `primary`, `--text` #1D2417 ==
      `base-content`, `--surface` #fff == `base-100`, `--danger` #dc2626 == `error`) —
      ya'ni bitta palitraning ikkita nusxasi. Brend rangini o'zgartirish ikki joyni
      tahrirlashni talab qilardi. Yana `src/pages/admin/style.md` da Abdullohning
      alohida "style guide"i yotgan edi (docs/archive ga ko'chirildi) — dizayn
      shuning uchun ikkiga bo'lingan
      ⚠️ QOLDI: ~105 ta inline `style={{ ... 'var(--x)' }}`. Ular BIR XIL ko'rinadi
      (qiymatlar bir xil), lekin hali `index.css` ga bog'liq. Har birini `className` ga
      ko'chirish kerak — skript bilan ko'r-ko'rona qilinmadi
- [ ] UI-STATES (HAR KIM o'z paneli bo'yicha): har sahifada 3 holat — Skeleton (yuklanish),
      EmptyState (bo'sh ma'lumot), Error (xato + retry). Bu markazlashgan vazifa EMAS:
      kim qaysi sahifada ishlayotgan bo'lsa, o'sha sahifaning uch holatini o'zi yopadi
- [x] UI-SHARED ✅ BAJARILDI 2026-07-21 (Karis): admin sahifalari endi `mentor/_ui.jsx` dan
      foydalanadi. KPI-plitka OLTI nusxada yotgan edi — `StatCard` Students/Groups/Mentors/
      Payments da (bayt-ma-bayt bir xil) + deyarli xuddi shunday `KpiCard` Dashboard/Reports da.
      Bittasi `_ui.jsx` ga ko'chirildi. Nusxalar xom hex qabul qilardi: 13 ta qotirilgan rang,
      ba'zisi turli registrda takrorlangan (`#8B5CF6` va `#8b5cf6`). Endi `tone`
      (neutral/success/warning/danger) → mavzu tokeni
- [ ] UI-RESPONSIVE (Alish): 1280 / 768 / 375 px kengliklar, gorizontal scroll yo'q
- [ ] UI-TABLES (Hamidula): tabular-nums raqamlar, hover-podsvetka, status-pilyulalar (design-system bo'yicha)
- [ ] UI-CACHE (Kozim): barcha mutatsiyalardan keyin TanStack Query cache invalidation +
      optimistic/loading tugma holatlari. Kozim'ga berildi — u api integratsiyasida ishlagan tajribasi bor
