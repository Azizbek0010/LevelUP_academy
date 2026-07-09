# TASK (Frontend): 3 login-страницы — исполнитель @Elyor2011

> ⚠️ ОБНОВЛЕНО: вход разбит на **3 раздельных API-endpoint** по группам ролей (было — один
> общий `/api/auth/login`, его больше НЕТ). Если уже начал по старой версии — переделать
> запросы под новые адреса (см. ниже). Бэкенд auth готов и работает (ветка `karis/auth`).
> Дизайн-система: `docs/FRONTEND-DESIGN-SYSTEM.md` (лайм `#C6FF34`, графит `#1D2417`, светлая тема).
> Логотипы: `frontend/logos/*.svg` (`01-primary` — цветной, `10-mono-white` — белый для тёмного фона).

## Что делать

Сделать **3 раздельные страницы входа** по группам ролей. Один компонент `LoginPage`
с пропом `variant` — разные URL, оформление **и разный API-endpoint**.

| URL | Для кого | variant | endpoint | поле `login` |
|---|---|---|---|---|
| `/login/main` | Main Admin (владелец платформы) | `main` | `POST /api/auth/main/login` | **email** |
| `/login/staff` | Super Admin + Admin + Mentor | `staff` | `POST /api/auth/staff/login` | **email** |
| `/login/member` | Student + Parent | `member` | `POST /api/auth/member/login` | **логин-код** |

- Голый `/login` → редирект на `/login/staff`.
- **Каждая страница шлёт в СВОЙ endpoint** — это главное отличие от старой версии.
- Тело запроса у всех одинаковое, поле называется **`login`** (не `email`):
  - `main` / `staff` → в `login` кладут **email**
  - `member` → в `login` кладут **логин-код** (8 символов, буквы+цифры, напр. `k7x2m9qp`)
- Пароль: у main/staff — их пароль; у student/parent — 6-значный код (выдаёт Admin).
- «Забыли пароль?» — только на страницах с email (`main` / `staff`). У student/parent сброса нет —
  пароль перевыдаёт Admin. На `member` ссылку «Забыли пароль» не показывать.
- Лейбл поля разный по `variant`: «Email» или «Логин-код», но имя поля в запросе всегда `login`.

## ⚠️ Безопасность: почему нельзя слать всех в один endpoint

Каждый endpoint пускает **только свою группу ролей**. Если ввести на `/login/main` креды
mentor'а (или наоборот) — бэк вернёт **401**, точно такой же, как при неверном пароле,
даже если пароль верный. Это сделано специально (чтобы чужой вход не подтверждал валидность
креды). Поэтому:
- страница ДОЛЖНА слать в свой endpoint из таблицы выше;
- не пытаться «угадывать» роль на фронте и переключать endpoint — у каждой страницы он фиксирован.

## API (база: `http://localhost:4000`)

### 1. Вход — 3 endpoint (выбирается по странице)
```
POST /api/auth/main/login     ← страница /login/main   (main_admin)
POST /api/auth/staff/login    ← страница /login/staff  (admin, superadmin, mentor)
POST /api/auth/member/login   ← страница /login/member (student, parent)

Content-Type: application/json
{ "login": "user@mail.com | k7x2m9qp", "password": "..." }
```
Тело **идентичное** у всех трёх. Поле `login` = email (main/staff) ИЛИ логин-код (member).
Ответ 200 одинаковый для всех:
```json
{
  "user": { "id","role","organizationId","branchId","firstName","lastName" },
  "accessToken": "eyJ..."
}
```
- `accessToken` — держать в памяти (Zustand `authStore`), НЕ в localStorage.
- refresh-токен придёт сам как **httpOnly-cookie** `refresh_token` (JS его не видит — так и надо).
- `user.role` определяет редирект (см. HOME_BY_ROLE).
- 401 — неверный login/пароль **ИЛИ роль не для этого входа**. 422 — пустой login/пароль.
  429 — слишком много попыток.

### 2. Обновить accessToken (когда истёк, живёт 15 мин)
```
POST /api/auth/refresh      // тело НЕ нужно, берёт cookie
```
Ответ 200: `{ user, accessToken }` (новый). 401 — refresh мёртв → редирект на login.
Общий для всех ролей (endpoint один).

### 3. Выход
```
POST /api/auth/logout       // тело НЕ нужно
```
Общий для всех ролей.

### 4. Забыли пароль (шлёт код на email) — только main/staff
```
POST /api/auth/forgot-password
{ "email": "user@mail.com" }
```
Всегда 200 (нейтральный ответ, не раскрывает есть ли аккаунт).

### 5. Сброс пароля по коду — только main/staff
```
POST /api/auth/reset-password
{ "email": "...", "otp": "123456", "newPassword": "минимум 8 символов" }
```

## ВАЖНО про cookie (иначе refresh/logout не будут работать)

refresh-токен — это **httpOnly-cookie**. Чтобы браузер её сохранял и отправлял:

1. Все запросы к `/api/auth/*` слать с **`credentials: 'include'`** (включая три login-endpoint):
   ```js
   fetch(url, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body })
   // axios: axios.create({ baseURL, withCredentials: true })
   ```
2. Cookie ставится на пути `/api/auth`, `sameSite=lax` — на localhost работает из коробки.
3. `accessToken` в защищённые запросы слать заголовком: `Authorization: Bearer <accessToken>`.
4. Схема жизни сессии: `login` → держишь accessToken в памяти → на 401 дергаешь `refresh` →
   получаешь новый accessToken → повторяешь запрос. На `logout` — чистишь authStore.

## После логина — редирект по роли (роль из JWT, не из URL)
```js
const HOME_BY_ROLE = {
  main_admin:'/main', superadmin:'/superadmin', admin:'/admin',
  mentor:'/mentor', parent:'/parent', student:'/student',
};
navigate(HOME_BY_ROLE[user.role]);
```
Роль решает бэк — с какой бы страницы ни вошли, редирект в кабинет по роли.
(Напр. на `/login/staff` могут войти admin, superadmin или mentor — каждый уедет в свой кабинет.)

## Дизайн
- Палитра/тени/типографика — строго по `docs/FRONTEND-DESIGN-SYSTEM.md`.
- Стиль — как лендинг (`frontend/landing-page`): чисто, лайм точечно, графит, светлый фон.
- Разные `variant` — разный заголовок/иллюстрация, форма одинаковая.

## Локальный запуск бэка (для проверки)
```
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run dev
```
Тестовые аккаунты (после `npm run seed`):
- main_admin — `hp8187081014laptop@gmail.com` / `ChangeMe123!`  → `/login/main`
- superadmin — `azizbekamangeldiev.2010@gmail.com` / `ChangeMe123!`  → `/login/staff`
- mentor — `mentor.demo@levelup.local` / `ChangeMe123!`  → `/login/staff`
- student — логин-код `demostud` / пароль `123456`  → `/login/member`
- parent — логин-код `demopare` / пароль `654321`  → `/login/member`

Быстрая проверка курлом, что endpoint отдаёт 200 и что чужой вход даёт 401:
```
# свой вход — 200
curl -X POST http://localhost:4000/api/auth/staff/login -H "Content-Type: application/json" \
  -d '{"login":"azizbekamangeldiev.2010@gmail.com","password":"ChangeMe123!"}'
# чужой вход (main_admin в staff) — 401
curl -X POST http://localhost:4000/api/auth/main/login  -H "Content-Type: application/json" \
  -d '{"login":"azizbekamangeldiev.2010@gmail.com","password":"ChangeMe123!"}'
```

## Как заводят student/parent (контекст, форма — отдельный таск K-ADMIN)

Логин-код и пароль student/parent **не придумываются** — их генерит система, когда **Admin
заводит ученика**. Форма Admin'а «Добавить ученика»: ФИО ученика, телефоны (отца, матери,
ученика), группа. На сохранении бэк генерит **логин-код (8 симв.)** + **пароль (6 цифр)** и
показывает их Admin'у — он передаёт их семье. SMS не используется. Эта форма — следующий таск,
здесь только login-страницы.

## Definition of Done
- [ ] 3 роута login работают, каждый шлёт в СВОЙ endpoint (`main` / `staff` / `member`)
- [ ] все три запроса идут с `credentials:'include'`
- [ ] `login` = email (main/staff) или логин-код (member); поле называется `login`
- [ ] accessToken в памяти, редирект по роли (HOME_BY_ROLE)
- [ ] «Забыли пароль» → forgot → reset по коду с email — только на main/staff, на member нет
- [ ] обработаны 401 (в т.ч. чужая роль) / 422 / 429 — понятные сообщения
- [ ] оформление по дизайн-системе
