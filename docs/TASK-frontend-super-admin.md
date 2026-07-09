# Super Admin панель — API-контракт K-SUPER (для фронта)

> Это **контракт бэкенда** для super-admin фронта, который ждут файлы команды
> (`frontend/super-admin/*` на ветке `abdulaziz/modules`). Backend готов и проверен
> вживую (ветка `karis/auth`, зона Karis). Super Admin = владелец учебного центра;
> видит и управляет ТОЛЬКО своей организацией.
> Дизайн-система: `docs/FRONTEND-DESIGN-SYSTEM.md` (лайм `#C6FF34`, графит `#1D2417`).
> Вход: страница `/login/staff` (см. `docs/TASK-frontend-login.md`), роль `superadmin`.

## Кто что делает (frontend/super-admin/)
- **Said Islom** — каркас `SuperAdminLayout` + дашборд организации *(данные дашборда — API ещё в работе, каркас можно начинать)*.
- **Aziz** — страница **филиалы** (`/superadmin/branches`) — на API ниже (branches).
- **sxvs** — страница **админы** (`/superadmin/admins`) — на API ниже (admins).

## Что готово на бэке (можно делать фронт прямо сейчас)

База: `http://localhost:4000`. Все запросы — с `Authorization: Bearer <accessToken>`
(токен из `/api/auth/staff/login`). Скоуп своей организации проставляется на бэке
автоматически по токену — на фронте org/branch слать НЕ нужно.

### Дашборд организации (Said Islom)
| Метод | URL | Ответ |
|---|---|---|
| GET | `/api/super/dashboard` | `{ totals, branches }` |

- `totals`: `{ branches, activeStudents, admins, revenue, outstandingDebt, currency:'UZS' }`.
- `branches[]`: `{ id, name, isMain, isArchived, students, admins, revenue, debt }` — для bar-графика «выручка по филиалам» и таблицы-обзора.
- `revenue` / `outstandingDebt` считаются из платежей (`invoices`) и долгов студентов —
  **пока 0** (K-ADMIN/платежи не готовы), заполнятся автоматически позже. Каркас и графики можно строить сейчас (покажут 0 / EmptyState).

### Филиалы (Aziz)
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/super/branches` | `{ name, address?, phone? }` | `201 { branch }` |
| GET | `/api/super/branches` | — | `{ branches: [{ id, name, address, phone, isMain, admins, students, createdAt }] }` |
| GET | `/api/super/branches/:id` | — | `{ branch: { …, admins:[], groups:[] } }` — детали филиала |
| PATCH | `/api/super/branches/:id` | `{ name?, address?, phone? }` | `{ branch }` — редактирование |
| POST | `/api/super/branches/:id/archive` | — | `{ branch }` (`isArchived:true`) |
| POST | `/api/super/branches/:id/unarchive` | — | `{ branch }` (`isArchived:false`) |

- `admins` / `students` — счётчики по филиалу (для карточек).
- Первый филиал организации автоматически становится главным (`isMain: true`).
- Архивный филиал (`isArchived:true`) — показать бейдж «Архив», кнопки мутаций спрятать.
- `branch detail` возвращает `admins` (id, ФИО, email, status) и `groups` (id, name, subject, monthlyPrice).
- невалидный `:id` → `422`, чужой/несуществующий филиал → `404`.

### Админы (sxvs) — Super Admin создаёт и назначает в филиал
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/super/admins` | `{ firstName, lastName, email, password, branchId, phone? }` | `201 { admin }` |
| GET | `/api/super/admins` | — | `{ admins: [{ id, firstName, lastName, email, status, branchId, branchName, createdAt }] }` |
| PATCH | `/api/super/admins/:id` | `{ firstName?, lastName?, branchId?, phone? }` | `{ admin }` — правка/перенос в др. филиал |
| PATCH | `/api/super/admins/:id/freeze` | `{ frozen: true\|false }` | `{ admin }` — заморозка/разморозка |

- **Логин и пароль админа задаёт сам Super Admin** (не генерятся). `email` = логин,
  `password` ≥ 8 символов. Форма должна давать ввести оба поля.
- К одному филиалу можно назначить **несколько админов**.
- `branchId` должен быть из своей организации — иначе `404`.
- Дубликат email → `409`. Пароль короче 8 → `422`.
- **freeze**: `frozen:true` → админ не сможет войти (login `403`). `frozen:false` — вернуть доступ.
- Смена email/пароля админа в этом контракте пока нет (только создание задаёт их).

## Что фронту сделать
- **Список филиалов** — карточки (название, адрес, телефон, счётчики админов/учеников),
  бейдж «главный» для `isMain`.
- **Кнопка «+ филиал»** — форма (название обязательно, адрес/телефон опционально).
- **Список админов** — таблица (ФИО, email, филиал `branchName`, статус).
- **Кнопка «+ админ»** — форма: ФИО, email (логин), пароль, выбор филиала из списка своих.
- Обработка ошибок: `409` (email занят), `422` (пароль/валидация), `404` (чужой филиал).

## Что ЕЩЁ НЕ готово на бэке (не делать пока)
- **Дашборд организации** (свой доход по филиалам) — в разработке (K-SUPER).
- **Admin-панель** (филиал: доход/расход, студенты, группы, платежи) — ещё не начата (K-ADMIN).
  Форма «добавить ученика» (генерит логин-код) — часть K-ADMIN, будет позже.
- Редактирование/удаление филиалов и админов — пока только создание и список.

## Тестовый Super Admin
- `azizbekamangeldiev.2010@gmail.com` / `ChangeMe123!` → вход `/login/staff`

## Definition of Done
- [ ] список филиалов + форма создания филиала работают
- [ ] список админов + форма создания админа (email+пароль вручную, выбор филиала)
- [ ] все запросы с `Authorization: Bearer` и `credentials:'include'`
- [ ] ошибки 409/422/404 показываются понятно
- [ ] оформление по дизайн-системе
