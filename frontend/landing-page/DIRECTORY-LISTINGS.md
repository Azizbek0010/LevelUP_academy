# Каталоги — тексты листингов

Готовые тексты для регистрации LevelUp Academy в SaaS-каталогах и локальных
бизнес-справочниках (задача P2 в [GEO-OFFSITE.md](./GEO-OFFSITE.md)). По разделению
ролей: **я (`abdulazizSEO`) готовлю тексты**, **владелец создаёт аккаунты и подаёт
листинги** (авто-регистрация в чужих сервисах не делается).

После подачи — отметь статус в трекере в [GEO-OFFSITE.md](./GEO-OFFSITE.md#Трекер-подачи)
(площадка → статус → дата → ссылка).

Обновлено: 2026-07-25.

---

## Факты о продукте (единый источник для всех листингов)

Чтобы описания не расходились между площадками — все цифры и формулировки ниже
взяты из `src/i18n/ru.js` / `uz.js` (`seo.*`) и `SEO-BACKLOG.md`, ничего не придумано.

| Поле | Значение |
|---|---|
| Название | LevelUp Academy |
| Уточнение (для disambiguation) | LevelUp Academy CRM — программное обеспечение, не школа |
| Сайт | https://levelup-academy.uz |
| Категория | Education CRM / Student Management Software / SaaS for education centers |
| Рынок | Учебные центры, языковые школы, курсы, репетиторы — Узбекистан (мультиязычно ru/uz) |
| Одна строка (RU) | CRM для учебного центра: учёт учеников, оплаты и долги, посещаемость, тесты, мотивация и Telegram-уведомления в одной системе |
| Одна строка (EN) | All-in-one CRM for education centers: student records, payments & debts, attendance, tests, gamification and Telegram notifications |
| Ключевые модули | Платежи и сплит-инвойсы, davomat (посещаемость), тесты с серверным таймером, домашние задания, коины/геймификация, realtime-чаты, видеоуроки, отчёты, Telegram-бот, мультифилиальность |
| Роли/кабинеты | SuperAdmin, Admin, Ментор, Методист, Родитель, Ученик — 6 кабинетов, RBAC на сервере |
| Цена | До 30 учеников — бесплатно; далее от 199 000 сум/мес, фикс по числу учеников, филиалы безлимитно |
| Триал | Первая неделя бесплатно |
| Ниши посадочных страниц | `/landing/for-language-school`, `/landing/for-courses`, `/landing/crm-vs-excel` |
| Логотип | `frontend/landing-page/public/logo.png` (растровый, есть готовый) |
| ⚠️ Отсутствуют (не выдумывать, спросить владельца) | Год основания, размер команды, юр. адрес офиса, телефон компании — нужны для Crunchbase/Yandex Бизнес/2GIS |

---

## Глобальные SaaS-каталоги (описания на английском — аудитория площадок международная)

### Product Hunt
- **Tagline** (≤60 симв.): `All-in-one CRM for education centers`
- **Description** (~260 симв.):
  > LevelUp Academy is a multi-tenant CRM built for education centers, language schools, and tutoring businesses. Track students, payments, attendance, tests, and homework — with gamification and Telegram notifications built in. First week free.
- **Topics/tags:** Education, SaaS, CRM, EdTech, Small Business

### G2
- **Short description** (~150 симв.):
  > CRM platform for education centers to manage students, payments, attendance, tests, and homework — with built-in gamification and Telegram alerts.
- **Category:** Education CRM / Student Information System
- **Long description:** см. Product Hunt description + список модулей из таблицы выше.

### Capterra / GetApp (один листинг, схожий формат)
- **Product name:** LevelUp Academy
- **Category:** Education CRM Software
- **Short description:**
  > Multi-tenant CRM for education centers: student and payment tracking, attendance (davomat), timed tests, homework, gamification, real-time chat, and Telegram notifications.
- **Key features (bullet list):**
  - Split payments & invoicing with cloud receipts
  - Attendance tracking (davomat)
  - Server-timed tests and homework modules
  - Gamification: coins, shop, leaderboards
  - Real-time chat and presence
  - Telegram bot notifications
  - Multi-branch support with role-based access (SuperAdmin/Admin/Mentor/Methodist/Parent/Student)
- **Pricing model:** Freemium — free up to 30 students, then tiered pricing from 199,000 UZS/month

### SaaSHub
- **One-liner:** `CRM for education centers — students, payments, attendance, tests, gamification`
- **Alternative to (categories to tag against):** Bitrix24, amoCRM, generic spreadsheet/Excel-based student tracking
- **Description:** см. Product Hunt description

### AlternativeTo
- **"Alternative to" list:** Excel/Google Sheets (manual student tracking), Bitrix24, amoCRM — for education-center use case specifically
- **Description:** см. Product Hunt description
- **Tags:** education, crm, saas, student-management

### Crunchbase
- ⚠️ **Блокер:** нужен год основания и размер команды от владельца — без этого профиль
  Crunchbase будет неполным/недостоверным. Остальное (описание, сайт, категория,
  локация «Uzbekistan») готово к заполнению из таблицы выше.

### Slashdot
- **Category:** Business / Education Software
- **Description:** см. Product Hunt description

---

## Локальные площадки (RU/UZ)

### Yandex Бизнес
- ⚠️ **Блокер (тот же, что в SEO-BACKLOG.md):** нужен физический адрес офиса и
  телефон компании — без них организацию не завести, регион «Узбекистан» тоже
  подтягивается через это. Как только адрес/телефон появятся — заполню карточку.
- **Название:** LevelUp Academy
- **Категория:** Программное обеспечение / CRM-системы / Образовательные технологии
- **Описание (RU):**
  > CRM для учебных центров: учёт учеников, оплаты и долги, посещаемость (davomat), тесты, домашние задания, геймификация и Telegram-уведомления — в одной системе. Первая неделя бесплатно.
- **Сайт:** https://levelup-academy.uz

### 2GIS
- ⚠️ Тот же блокер — нужен адрес филиала/офиса для карточки организации.
- **Название и описание** — как в Yandex Бизнес выше.

### Узбекские бизнес-справочники / IT-EdTech листинги (общий шаблон)
- **Название:** LevelUp Academy
- **Краткое описание (RU):**
  > Платформа для учебных центров, языковых школ и курсов: учёт учеников, оплаты, посещаемость, тесты, мотивация учеников и Telegram-бот.
- **Qisqacha tavsif (UZ):**
  > O'quv markazlari, til markazlari va kurslar uchun platforma: o'quvchilar hisobi, to'lovlar, davomat, testlar, o'quvchilar motivatsiyasi va Telegram bot.
- **Сайт:** https://levelup-academy.uz
- **Категория:** `Ta'lim markazi uchun dastur / CRM` (SaaS для образования)

---

## Что нужно от владельца, чтобы продолжить

1. **Адрес офиса + телефон** — разблокирует Yandex Бизнес и 2GIS (тот же блокер, что уже стоит в SEO-BACKLOG.md).
2. **Год основания + размер команды** — для Crunchbase.
3. Сами регистрации на площадках (Product Hunt, G2, Capterra, GetApp, SaaSHub, AlternativeTo, Slashdot) — тексты выше готовы к копированию, аккаунт/подача на стороне владельца.

---

## Связанное

- [GEO-OFFSITE.md](./GEO-OFFSITE.md) — общий план off-site GEO/AEO, трекер подачи
- [SEO-BACKLOG.md](./SEO-BACKLOG.md) — общий SEO-бэклог (тот же блокер адреса упомянут там же)

#seo #geo #directories #backlinks
