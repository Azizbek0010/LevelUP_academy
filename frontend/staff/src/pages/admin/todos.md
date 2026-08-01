# Admin Panel — TODOS (Abduloh)

> Status: ⬜ qilinmagan | 🔄 jarayonda | ✅ tayyor
> Sana: 2026-08-01

## 1. Students — «Задолжен» filtri
- ✅ «Задолжен» tugmasi hozir **tasdiqlash so'rayapti** (confirm dialog) — bu noto'g'ri. → Kodda confirm dialog **yo'q** (Students.jsx:214-233 — oddiy tab filter, `setStatusFilter('debt')`), olib tashlash kerak emas.
- ✅ Qarz har oy o'zgaradi, hamma qarzdor o'quvchilar **avtomatik** ko'rinishi kerak — dialogni olib tashlash. → Qarzdorlar live filter: `filteredRows` → `studentDebt(s) > 0` (Students.jsx:128).
- ✅ Qarzdor list avtomatik yangilanib turishi kerak (har oy). → **«Задолжен» tab faol paytda `refetchInterval: 60_000`** — ro'yxat har daqiqada avtomatik yangilanadi (queries.js `useAdminStudents(qs, opts)` + Students.jsx:99-104).

## 2. Export — to'liq style fix
- ✅ ExportDialog / exportUtils style-ni to'liq o'rganish.
- ✅ Export dizaynini yaxshilash (design system: --primary #40833B, glass-bg, rounded-14, hover shadow).
- ✅ **MD + CSV export olib tashlandi** (faqat Excel/PDF qoldi) — ExportDialog FORMAT_OPTIONS 2 ta, exportUtils'dan exportToMarkdown/exportToCSV o'chirildi.

## 3. Dashboard — «New Group» tugmasi
- ✅ Dashboard'ga **«New Group»** tugmasi qo'shildi (PageHeader da, Plus icon).
- ✅ Bosilganda → `/groups` sahifasiga `state: { openCreate: true }` bilan o'tadi, Groups.jsx location.state ni o'qib modalni avtomatik ochadi (refresh da qayta ochilmaydi).

## 4. Add Group modalka — yangilash (katta ish)
- ✅ **1-qadam:** Avval **mentor tanlanadi** (backenda bor mentorlar ro'yxati).
- ✅ Tanlangan mentorni **vaqt jadvaliga** qarab **bo'sh vaqtlar** ko'rsatiladi (algoritm: 08:00–20:00, 30-min qadam, mentor guruhlari schedule'dan occupied map; kunlar kesishmasi bo'yicha free-slot chips; band kunlar qizil nuqta bilan).
- ✅ Kunlar tanlangach — **avtomatik tugash sanasi** hisoblanadi (modul 1/3/6 oy select, birinchi dars sanasi + N oy, preview).
- ✅ Guruhga **yangi o'quvchi** qo'shish (accordion: ism/familiya/telefon) → guruh yaratilgach `adminCreateStudent(groupId)` — login-kod + parol paneli, copy tugmalari.
- ✅ Backend kontraktlar tekshirildi: `POST /admin/groups` (days+startTime), `GET /admin/groups/:id` (schedule), `POST /admin/students` (groupId qabul qiladi).

## 5. Davomat (GroupDetail Attendance)
- ✅ **Muzlatilgan (frozen) o'quvchilar** davomatda **belgilanishi mumkin emas** — `GroupDetail.jsx` AttendanceTab: `frozenIds` Set, `toggleDay` guard, hujayralar `disabled` + `cursor-not-allowed` + opacity-60, ism yonida «Заморожен» badge (qizil).
- ✅ «Не отмечен» (not marked) variantini olib tashlash — legendadan «Не отмечен» elementi o'chirildi (faqat Пришёл/Опоздал/Не пришёл + Исправлено админом qoldi).

## 6. Mentors — edit
- ✅ Edit modal'da **level (GradePicker) kartada qoldi** — modal ichida level yo'q (user qarori, 2026-08-01).
- ✅ Edit modal'da **email + parol** maydonlari paydo bo'ldi: email oldindan to'ldirilgan, parol bo'sh (faqat o'zgartirilganda). **PATCH body**ga ham yuboriladi.
- ✅ **Backend gap (Karis kutilmoqda):** `updateMentorSchema` (admin.schemas.js:99) faqat firstName/lastName/phone/grade qabul qiladi — email/parolni zod tashlab yuboradi. Frontend **saved emailni PATCH javobidan tekshiradi**; o'zgarmagan bo'lsa — «Email/parol saqlanmadi — backend updateMentorSchema hali qabul qilmaydi» degan sariq ogohlantirish ko'rsatadi (modal ichida). Karis schema'ga `email` + `password` qo'shishi kerak.

## 7. Discipline — bug fix + yangi qoidalar
- ⬜ Ranglar bug'i: qora bosganda yashil bo'lyapti — **hover'da yashil** bo'lishi kerak.
- ⬜ Backendda bor **yangi qoida qo'shish** funksiyasi — modalka.
- ⬜ Modalka uchun **yangi dizayn / yangi style**.
- ⬜ Qoida va boshqalar **hamma mentorlarga** tegishli bo'lishi — bitta mentorni so'ramasligi.

## 8. Payments
- ✅ **«Просрочено» (overdue)** tugmasini/tag'ini olib tashlash → STATUS/STATUS_LIST/STATUS_LABELS dan olib tashlandi + «Просрочено» KPI o'chirildi (stats.overdue ham).
- ✅ **«Отменён» (cancelled)** bo'lishini ham yo'qotish → STATUS'dan o'chirildi. (Eski overdue/cancelled invoice'lar `pending` fallback'ga tushadi — UI da ko'rinmaydi.)

## 9. Expenses — tozalash
- ✅ KPI kartalarni olib tashlash: «Все расходы», «В этом месяце», «Ожидает», «Одобрено», «Средний расход» → butun KPI blok + stats useMemo o'chirildi.
- ✅ Filterdan **«От» → «До» (date range)** olib tashlash → desktop + mobile date inputlari o'chirildi.
- ✅ **«Все статусы»** selection olib tashlash → status SelectFilter (desktop+mobile), STATUSES/STATUS_LABELS, getStatusCount o'chirildi.
- ✅ **«Сначала новые»** select olib tashlash → sort SelectFilter + SORT_OPTIONS o'chirildi, sort har doim eng yangi (spentAt desc).
- ✅ Add modalka ranglari juda ko'p — **design system ranglarini ishlatish** → kategoriya tugmalari endi `--primary` yashil (avval har kategoriyada har xil rang).
- ✅ **«Другое» (Other)** kategoriya → bosilganda **«Название расхода»** input paydo bo'ladi (majburiy) → `note`ga saqlanadi (backend schema'da title yo'q). Boshqa kategoriyalarda «Примечание» maydoni qoladi.
- ✅ To'lov usulida **«Перевод» (transfer) olib tashlash** — faqat naqd + karta (PAYMENT_METHODS = ['Наличные', 'Карта']). Eslatma: backend `createExpenseSchema` paymentMethod'ni qabul qilmaydi (zod tashlab yuboradi) — to'lov usuli `note` matnidan aniqlanadi.
- ✅ Modalkada **date field olib tashlash** → `spentAt` har doim bugungi sana (add/edit'da formData'da saqlanadi, UI'da ko'rinmaydi).
- ✅ **Bank olib tashlash** → PAYMENT_METHODS dan o'chirildi. Eski 'Перевод'/'Банк' yozuvlari note heuristics orqali eski ko'rinishda qolaveradi.

## 10. Reports — tozalash + ranglar
- ⬜ Jadvalni olib tashlash: «Группа / Ученики / Доход / Долг / Соотношение» + «4 группы» + «Общий доход» + «Общий долг».
- ⬜ Ranglar juda yomon — **claude code qoidalarida yozilgan design system ranglarini** ishlatish.
