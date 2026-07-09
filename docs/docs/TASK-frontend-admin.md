# Admin панель — API-контракт K-ADMIN (для фронта)

> **Контракт бэкенда** для admin-фронта (`frontend/admin/*`). Backend готов и проверен
> вживую (в `main`; зона Karis, K-ADMIN). Admin = сотрудник ОДНОГО филиала; видит и
> управляет только своим филиалом — `branchId` проставляется на бэке по токену,
> на фронте org/branch слать **не нужно**.
> Дизайн-система: `docs/FRONTEND-DESIGN-SYSTEM.md` (лайм `#C6FF34`, графит `#1D2417`).
> Вход: страница `/login/staff` (см. `docs/TASK-frontend-login.md`), роль `admin`.

## Кто что делает (frontend/admin/)
- **Abduloh** — каркас `AdminLayout` + дашборд филиала + **студенты**.
- **Odil** — **группы** (CRUD/архив, состав) + отчёты (из дашборда).
- **Hamidula** — **расходы** + **чат** сейчас; **платежи** ждут бэк (см. «Ещё не готово»).

## База
`http://localhost:4000`, все запросы с `Authorization: Bearer <accessToken>` (из
`/api/auth/staff/login`) и `credentials:'include'`. Ошибки: `422` невалидное тело/`:id`,
`404` чужой/несуществующий объект (существование чужого филиала не раскрываем),
`409` конфликт (дубль email/phone, ментор ведёт активную группу).

---

### Дашборд филиала (Abduloh)
| Метод | URL | Ответ |
|---|---|---|
| GET | `/api/admin/dashboard` | `{ totals, thisMonth }` |

- `totals`: `{ revenue, expenses, profit, outstandingDebt, activeStudents, groups, overdueInvoices, currency:'UZS' }`.
- `thisMonth`: `{ revenue, expenses, profit }`.
- `revenue`/`overdueInvoices` считаются из платежей — **пока 0** (платежи K-ADMIN ещё не готовы, см. ниже); `expenses`/`profit`/`activeStudents`/`groups` уже реальные. Каркас и графики строим сейчас.

### Студенты (Abduloh)
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/admin/students` | `{ firstName, lastName, phone, birthDate?, groupId?, parent?:{ firstName, lastName, phone } }` | `201 { student, parent? }` |
| GET | `/api/admin/students` | `?page&limit&search&groupId` | `{ students:[…], meta }` |
| GET | `/api/admin/students/:id` | — | `{ student }` (+ `groups[]`) |
| PATCH | `/api/admin/students/:id` | `{ firstName?, lastName?, phone?, birthDate? }` | `{ student }` |
| POST | `/api/admin/students/:id/freeze` | `{ frozen:true\|false, reason? }` | `{ student }` |
| POST | `/api/admin/students/:id/regenerate-password` | — | `{ id, password }` |
| DELETE | `/api/admin/students/:id` | — | `204` |

- **Add-student генерит креды на бэке**: ответ `student:{ id, firstName, lastName, loginCode, password }` (+ `parent:{ …, loginCode, password }`, если передан `parent`). **Показать и дать скопировать** — пароль больше не покажется, только перевыдача.
- `regenerate-password` возвращает новый `password` (старый сразу перестаёт пускать).
- `student` в списке: `{ id, firstName, lastName, phone, status, loginCode, coinBalance, totalDebt, hasParent, groups:[{id,name}], createdAt }`.
- `search` ищет по ФИО/телефону/логин-коду; `groupId` фильтрует по группе.
- дубль телефона → `409`; `freeze` `frozen:true` → студент не войдёт.

### Группы (Odil)
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/admin/groups` | `{ name, subject, mentorId, monthlyPrice, schedule?, room? }` | `201 { group }` |
| GET | `/api/admin/groups` | `?page&limit` | `{ groups:[…], meta }` |
| GET | `/api/admin/groups/:id` | — | `{ group }` (+ `students[]`) |
| PATCH | `/api/admin/groups/:id` | `{ name?, subject?, mentorId?, monthlyPrice?, schedule?, room? }` | `{ group }` |
| POST | `/api/admin/groups/:id/archive` | — | `{ group }` (`isArchived:true`) |
| POST | `/api/admin/groups/:id/unarchive` | — | `{ group }` |
| POST | `/api/admin/groups/:id/students` | `{ studentId }` | `201 { groupId, studentId }` |
| DELETE | `/api/admin/groups/:id/students/:studentId` | — | `204` |

- `mentorId` должен быть ментором своего филиала — иначе `404`. Добавить студента в архивную группу → `409`.
- `schedule` = массив `{ day:'mon'…'sun', start:'HH:MM', end:'HH:MM' }` (≤14).
- `group` в списке: `{ id, name, subject, monthlyPrice, room, isArchived, students, mentor:{id,name}, createdAt }`; detail добавляет `students:[{ id, firstName, lastName, phone, status, totalDebt, coinBalance, joinedAt }]`.
- Архивная группа → бейдж «Архив», кнопки мутаций спрятать (бэк вернёт `403` через archiveGuard).

### Менторы (заводит Admin в своём филиале; вход ментора по email)
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/admin/mentors` | `{ firstName, lastName, email, password, phone? }` | `201 { mentor }` |
| GET | `/api/admin/mentors` | — | `{ mentors:[{ …, groups, createdAt }] }` |
| PATCH | `/api/admin/mentors/:id` | `{ firstName?, lastName?, phone? }` | `{ mentor }` |
| POST | `/api/admin/mentors/:id/freeze` | `{ frozen:true\|false }` | `{ mentor }` |
| DELETE | `/api/admin/mentors/:id` | — | `204` |

- Логин/пароль ментора задаёт Admin (`password ≥ 8`); дубль email/phone → `409`.
- Ментора **нельзя удалить, пока он ведёт активную (неархивную) группу** → `409` (сначала переназначить/архивировать группы).

### Расходы (Hamidula)
| Метод | URL | Тело | Ответ |
|---|---|---|---|
| POST | `/api/admin/expenses` | `{ category, amount, spentAt?, note? }` | `201 { expense }` |
| GET | `/api/admin/expenses` | `?page&limit&from&to` | `{ expenses:[…], meta }` |
| DELETE | `/api/admin/expenses/:id` | — | `204` |

- Шапка «Доход − Расход = Прибыль» берётся из `/api/admin/dashboard` (`totals.profit`).

### Чат (Hamidula) — готов, зона Abdulaziz
- `GET /api/chat/:roomKey/messages` (история, REST) + сокеты `chat:global:*`, `chat:parent:*`.

---

## Что ЕЩЁ НЕ готово на бэке (не делать пока / заглушка)
- **Платежи** (`invoices`, full/split, чеки, долги) — **следующая задача Кариса**, эндпоинтов пока НЕТ. UI PaymentModal можно верстать, но НЕ подключать. **Nasiya/рассрочка убрана** — только **Full** и **Split** (два поля cash+card, сумма частей = итог).
- **Отдельные отчёты** (`/api/admin/reports`) — отдельного эндпоинта нет; выручка/долги/прибыль берём из `/api/admin/dashboard`.

## Тестовый Admin
Заводится Super Admin'ом (`/api/super/admins`). Демо-Super: `azizbekamangeldiev.2010@gmail.com` / `ChangeMe123!` — создай через него админа и залогинься на `/login/staff`.

## Definition of Done
- [ ] `AdminLayout` + guard (`allow={['admin']}`), дашборд с реальными expenses/profit/students/groups
- [ ] Add-student показывает сгенерированные логин-код+пароль, копируются
- [ ] Таблица студентов: поиск, фильтр по группе, freeze/edit/regenerate-password/delete
- [ ] Группы: CRUD + archive/unarchive + состав (add/remove student), выбор ментора из `/api/admin/mentors`
- [ ] Менторы: список + создание (email/пароль) + freeze; удаление с обработкой `409`
- [ ] Расходы: список + добавление + удаление; чат в реальном времени
- [ ] Ошибки 409/422/404 показываются понятно; оформление по дизайн-системе
