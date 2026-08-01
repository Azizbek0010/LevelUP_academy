# Admin Panel — TODOS (Abduloh)

> Status: ⬜ qilinmagan | 🔄 jarayonda | ✅ tayyor
> Sana: 2026-08-01

## 1. Students — «Задолжен» filtri
- ⬜ «Задолжен» tugmasi hozir **tasdiqlash so'rayapti** (confirm dialog) — bu noto'g'ri.
- ⬜ Qarz har oy o'zgaradi, hamma qarzdor o'quvchilar **avtomatik** ko'rinishi kerak — dialogni olib tashlash.
- ⬜ Qarzdor list avtomatik yangilanib turishi kerak (har oy).

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
- ⬜ **«Просрочено» (overdue)** tugmasini/tag'ini olib tashlash.
- ⬜ **«Отменён» (cancelled)** bo'lishini ham yo'qotish.

## 9. Expenses — tozalash
- ⬜ KPI kartalarni olib tashlash: «Все расходы», «В этом месяце», «Ожидает», «Одобрено», «Средний расход».
- ⬜ Filterdan **«От» → «До» (date range)** olib tashlash.
- ⬜ **«Все статусы»** selection olib tashlash.
- ⬜ **«Сначала новые»** select olib tashlash.
- ⬜ Add modalka ranglari juda ko'p — **design system ranglarini ishlatish**.
- ⬜ **«Другое» (Other)** kategoriya → bosilganda **input paydo bo'lib ism so'rashi** va boshqa rashodlarga qo'shilishi.
- ⬜ To'lov usulida **«Перевод» (transfer) olib tashlash** — faqat naqd + karta.
- ⬜ Modalkada **date field olib tashlash**.
- ⬜ **Bank olib tashlash**.

## 10. Reports — tozalash + ranglar
- ⬜ Jadvalni olib tashlash: «Группа / Ученики / Доход / Долг / Соотношение» + «4 группы» + «Общий доход» + «Общий долг».
- ⬜ Ranglar juda yomon — **claude code qoidalarida yozilgan design system ranglarini** ishlatish.
