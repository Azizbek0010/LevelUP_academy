# LevelUp Academy — Frontend Architecture

> Полная архитектура frontend-части Educational CRM: React (JS/JSX) + Vite + Tailwind CSS + DaisyUI + CSS Variables + Socket.io-client.
> Пары к backend-документу: имена API-путей и сокет-событий совпадают с `BACKEND-ARCHITECTURE.md`.

---

## 1. Обзор

| Компонент | Технология | Зачем |
|---|---|---|
| Сборка | Vite | Быстрый dev-сервер, code-splitting из коробки |
| UI | React 18 (JS/JSX) | SPA, 5 ролевых кабинетов |
| Стили | Tailwind CSS + DaisyUI | Утилиты + готовые компоненты (модалки, таблицы, дровер) |
| Темизация | CSS Variables в `:root` | Светлая тема + брендовые лайм-токены без пересборки |
| Роутинг | React Router v6 | Ленивые ролевые layouts, guards |
| Серверное состояние | TanStack Query | Кэш, инвалидация, retry, optimistic updates |
| Клиентское состояние | Redux Toolkit | auth, UI, socket-статусы — createSlice + единый store, DevTools |
| HTTP | axios (единый instance) | Interceptors: токен + auto-refresh |
| Realtime | socket.io-client (singleton) | Чаты, live-счётчик онлайна, presence |
| Формы | react-hook-form + zod | Те же zod-схемы, что валидируют на бэке |

**Принцип:** одна SPA, пять ролей. После логина роль из JWT определяет layout и дерево маршрутов. Никакой ролевой логики «на глазок» в компонентах — только через `RoleGuard` и ролевые layouts.

---

## 2. Структура директорий

Feature-based: фича владеет своими страницами, компонентами, хуками и API-вызовами.

```
educrm-frontend/
├── src/
│   ├── app/
│   │   ├── App.jsx               # провайдеры: Redux Provider, Router, QueryClient, Theme
│   │   ├── router.jsx            # всё дерево маршрутов + lazy()
│   │   └── queryClient.js        # настройки TanStack Query
│   │
│   ├── components/               # переиспользуемое, без бизнес-логики
│   │   ├── ui/                   # Button, Modal, Table, Badge, Skeleton, EmptyState
│   │   ├── layout/               # Sidebar, Topbar, PageHeader
│   │   └── feedback/             # ErrorBoundary, Toast, ConfirmDialog
│   │
│   ├── layouts/                  # каркас кабинета на роль
│   │   ├── SuperAdminLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   ├── MentorLayout.jsx
│   │   ├── ParentLayout.jsx
│   │   └── StudentLayout.jsx
│   │
│   ├── features/
│   │   ├── auth/                 # LoginPage, useAuth, tokenStore
│   │   ├── dashboard/            # ролевые дашборды + live-счётчик онлайна
│   │   ├── users/                # студенты/менторы/родители (Admin CRUD, заморозка)
│   │   ├── groups/               # группы, архивация, состав
│   │   ├── attendance/           # Davomat: журнал ментора, история для родителя
│   │   ├── payments/             # PaymentModal (full/split/nasiya), инвойсы, долги
│   │   ├── homework/             # список, сдача (upload), проверка ментором
│   │   ├── tests/                # конструктор (mentor), прохождение с таймером (student)
│   │   ├── gamification/         # коины ±, coin history, лидерборды
│   │   ├── shop/                 # витрина, покупка за коины
│   │   ├── videos/               # каталог, защищённый плеер
│   │   ├── chat/                 # global chat + parent direct
│   │   └── reports/              # выручка/долги (admin), зарплата (mentor)
│   │
│   ├── hooks/                    # общие: useDebounce, usePagination, useOnlineCount
│   ├── services/
│   │   ├── api.js                # axios instance + interceptors
│   │   └── upload.js             # presigned URL upload в MinIO/S3
│   ├── sockets/
│   │   └── socket.js             # singleton socket.io-client + useSocket
│   ├── store/
│   │   ├── index.js              # configureStore + типизированные хуки
│   │   ├── authSlice.js          # Redux Toolkit: user, accessToken
│   │   └── uiSlice.js            # тема, sidebar, активные модалки
│   ├── styles/
│   │   ├── index.css             # Tailwind directives + @layer
│   │   └── themes.css            # CSS variables (:root / [data-theme])
│   └── main.jsx
│
├── tailwind.config.js
├── vite.config.js
└── .env.example                  # VITE_API_URL, VITE_SOCKET_URL
```

Внутри фичи:

```
features/payments/
├── pages/            # PaymentsPage.jsx, InvoiceDetailsPage.jsx
├── components/       # PaymentModal.jsx, SplitPaymentForm.jsx, ScheduleTable.jsx
├── hooks/            # usePayments.js, useCreatePayment.js (TanStack Query)
├── api.js            # функции запросов: createPayment(), getInvoices()
└── schemas.js        # zod-схемы форм
```

---

## 3. Роутинг и клиентский RBAC

> Клиентские guards — это UX, не безопасность. Реальная защита — RBAC на бэке; фронт просто не показывает лишнего.

```jsx
// src/app/router.jsx
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RoleGuard } from '../features/auth/RoleGuard';

const StudentLayout = lazy(() => import('../layouts/StudentLayout'));
const AdminLayout   = lazy(() => import('../layouts/AdminLayout'));
// ... остальные layouts аналогично

export const router = createBrowserRouter([
  // 3 РАЗДЕЛЬНЫХ входа по группам ролей — у каждого СВОЙ endpoint (безопасность):
  //   main   → POST /api/auth/main/login   (main_admin)
  //   staff  → POST /api/auth/staff/login  (admin, superadmin, mentor)
  //   member → POST /api/auth/member/login (student, parent)
  // Чужая роль на чужом endpoint → 401 (как неверный пароль). Тело у всех { login, password }.
  { path: '/login',        element: <Navigate to="/login/staff" replace /> },
  { path: '/login/main',   element: <LoginPage variant="main" /> },     // Main Admin (платформа)
  { path: '/login/staff',  element: <LoginPage variant="staff" /> },    // Super Admin + Admin + Mentor
  { path: '/login/member', element: <LoginPage variant="member" /> },   // Student + Parent

  {
    element: <ProtectedRoute />,          // нет токена → /login
    children: [
      {
        path: '/student',
        element: <RoleGuard allow={['student']}><StudentLayout /></RoleGuard>,
        children: [
          { index: true, element: <StudentHome /> },
          { path: 'profile',  element: <ProfilePage /> },
          { path: 'shop',     element: <ShopPage /> },
          { path: 'tests',    element: <TestsPage /> },
          { path: 'tests/:id/take', element: <TakeTestPage /> },   // таймер
          { path: 'homework', element: <HomeworkPage /> },
          { path: 'videos',   element: <VideosPage /> },
          { path: 'leaderboard', element: <LeaderboardPage /> },
        ],
      },
      {
        path: '/admin',
        element: <RoleGuard allow={['admin', 'superadmin']}><AdminLayout /></RoleGuard>,
        children: [
          { index: true, element: <AdminDashboard /> },          // live-онлайн, выручка
          { path: 'students', element: <StudentsPage /> },
          { path: 'groups',   element: <GroupsPage /> },
          { path: 'groups/:id', element: <GroupDetailsPage /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'reports',  element: <ReportsPage /> },
          { path: 'chat',     element: <ChatPage /> },
        ],
      },
      // /mentor, /parent, /superadmin — по тому же паттерну
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
```

```jsx
// src/features/auth/RoleGuard.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HOME_BY_ROLE = {
  main_admin: '/main',
  superadmin: '/superadmin',
  admin: '/admin',
  mentor: '/mentor',
  parent: '/parent',
  student: '/student',
};

export function RoleGuard({ allow, children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }
  return children;
}
```

После логина: `navigate(HOME_BY_ROLE[user.role])` — каждый попадает в свой кабинет.

### 3 раздельные login-страницы (по группам ролей) — у каждой свой endpoint

Один компонент `LoginPage` с пропом `variant` — 3 URL, разное оформление (заголовок,
иллюстрация, акценты) и **разный API-endpoint** (безопасность: чужая роль на чужом входе → 401).
Тело у всех одинаковое `{ login, password }`, где `login` = email (main/staff) ИЛИ логин-код (member).
Роль приходит в JWT — фронт не «выбирает» роль, он её получает и редиректит по `HOME_BY_ROLE`.

| URL | Для кого | variant | endpoint |
|---|---|---|---|
| `/login/main` | Main Admin (владельцы платформы) | `main` | `POST /api/auth/main/login` |
| `/login/staff` | Super Admin + Admin + Mentor | `staff` | `POST /api/auth/staff/login` |
| `/login/member` | Student + Parent | `member` | `POST /api/auth/member/login` |

- Голый `/login` → редирект на `/login/staff` (дефолт).
- Каждая страница фиксированно шлёт в свой endpoint (не выбирать endpoint на лету).
- После успешного логина: `navigate(HOME_BY_ROLE[user.role])` **независимо** от того,
  с какой страницы вошли (роль решает JWT, а не URL).
- Чужая роль на чужом входе режется на бэке — возвращается 401 (тот же, что при неверном
  пароле), фронту достаточно показать общее «неверный логин или пароль».

Задача на реализацию — `frontend/TEAM-TASKS.md` §7 (исполнитель: @Elyor2011).

---

## 4. State management

Два слоя, никогда не смешиваются:

| Слой | Инструмент | Что хранит |
|---|---|---|
| Серверное состояние | TanStack Query | Всё, что пришло из API: группы, инвойсы, ДЗ, лидерборды. Кэш по ключам, авто-refetch, инвалидация после мутаций |
| Клиентское состояние | Redux Toolkit | `user` + `accessToken`, тема, открытые модалки, socket-статус, live-счётчик онлайна |

**Почему Redux Toolkit:** серверные данные забирает TanStack Query (~80 % состояния CRM), поэтому в Redux живёт только клиентский слой — auth-сессия и UI. RTK (`createSlice` + `configureStore`) даёт единый предсказуемый store, Redux DevTools и middleware без старого boilerplate.

```js
// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: null }, // токен только в памяти; refresh — httpOnly cookie
  reducers: {
    setSession: (state, { payload }) => {
      state.user = payload.user;             // { id, role, branchId, firstName, ... }
      state.accessToken = payload.accessToken;
    },
    clearSession: (state) => {
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;

// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: { auth: authReducer, ui: uiReducer },
});
```

```js
// пример фичевого хука
// src/features/payments/hooks/useCreatePayment.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPayment } from '../api';

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayment,       // POST /api/payments
    onSuccess: (_data, { studentId }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['student', studentId] });
      qc.invalidateQueries({ queryKey: ['reports', 'debts'] });
    },
  });
}
```

---

## 5. API-слой: axios + auto-refresh

```js
// src/services/api.js
import axios from 'axios';
import { store } from '../store';
import { setSession, clearSession } from '../store/authSlice';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,   // http://localhost:5000/api
  withCredentials: true,                   // refresh-cookie
});

// --- request: access-token из памяти ---
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- response: 401 → один общий refresh, очередь повторов ---
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;

    // 403 от archiveGuard — показываем «архив, только чтение», не логаутим
    if (response?.status === 403 && response.data?.message?.includes('archived')) {
      window.dispatchEvent(new CustomEvent('app:archived-entity'));
      return Promise.reject(error);
    }

    if (response?.status === 401 && !config._retried) {
      config._retried = true;
      try {
        refreshPromise ??= axios
          .post(`${import.meta.env.VITE_API_URL}/auth/refresh`, null, { withCredentials: true })
          .finally(() => { refreshPromise = null; });

        const { data } = await refreshPromise;   // rotation: новая пара токенов
        store.dispatch(setSession({ user: data.user, accessToken: data.accessToken }));
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(config);                      // повтор исходного запроса
      } catch {
        store.dispatch(clearSession());
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
```

- Access-token живёт **только в памяти** (Redux store) — XSS-стойкость; refresh — httpOnly cookie, ротация на бэке.
- `refreshPromise` — единый на все параллельные 401 (нет шторма refresh-запросов).
- Событие `app:archived-entity` ловит глобальный Toast: «Эта сущность в архиве — доступна только для чтения».

---

## 6. Socket.io клиент

```js
// src/sockets/socket.js
import { io } from 'socket.io-client';
import { store } from '../store';

let socket = null;

export function connectSocket() {
  const { accessToken } = store.getState().auth;
  if (socket?.connected || !accessToken) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token: accessToken },        // socketAuth на бэке проверяет JWT
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    const { user } = store.getState().auth;
    if (user?.role === 'student') {
      socket.emit('presence:online');
      startHeartbeat();
    }
  });

  return socket;
}

let heartbeatId = null;
function startHeartbeat() {
  clearInterval(heartbeatId);
  heartbeatId = setInterval(() => socket?.emit('presence:heartbeat'), 25_000);
  // TTL на бэке = 60 сек — двойной запас
}

export function disconnectSocket() {
  clearInterval(heartbeatId);
  socket?.disconnect();
  socket = null;
}
```

```js
// src/hooks/useOnlineCount.js — live-счётчик для дашбордов SuperAdmin/Admin
import { useEffect, useState } from 'react';
import { connectSocket } from '../sockets/socket';

export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const socket = connectSocket();
    const onCount = ({ count }) => setCount(count);
    socket.on('presence:count', onCount);           // broadcast из комнаты dashboards
    return () => socket.off('presence:count', onCount);
  }, []);

  return count;
}
```

```jsx
// чат: события совпадают с backend-доком
// global:  emit 'chat:global:send'  → on 'chat:global:message'
// parent:  emit 'chat:parent:send'  → on 'chat:parent:message'
//          admin/mentor: emit 'chat:parent:join' перед открытием диалога
// история: GET /api/chat/:roomKey/messages?cursor= (REST, не сокет)
```

Жизненный цикл: `connectSocket()` после логина, `disconnectSocket()` при логауте. На токен-refresh — переподключение с новым токеном.

---

## 7. Темизация: CSS Variables + DaisyUI

```css
/* src/styles/themes.css */
/* Значения — из FRONTEND-DESIGN-SYSTEM.md (лайм-палитра, hex). Тема одна — светлая. */
:root {
  /* бренд-токены — единственный источник цветов */
  --color-primary: #C6FF34;      /* лайм — кнопки, прогресс, активная навигация */
  --color-primary-ink: #141B10;  /* текст НА лайме (тёмный, не белый) */
  --color-success: #2ECC71;      /* «оплачен / активен» */
  --color-danger: #E8543E;       /* «должник / просрочка» */

  --color-bg: #F6FBEA;           /* фон (лайм-тинт) */
  --color-surface: #FFFFFF;      /* карточки */
  --color-text: #1D2417;         /* графитово-зелёный */
  --color-text-muted: #5E6E52;
  --color-border: #E6EDD8;

  --color-sidebar: #1D2417;      /* тёмный сайдбар/шапка */
  --color-sidebar-text: #DCE9CC;

  --radius-card: 1rem;
  --radius-btn: 0.5rem;
  --shadow-card: 0 10px 28px rgba(29, 36, 23, 0.14), 0 2px 6px rgba(29, 36, 23, 0.08);
}
```

```js
// tailwind.config.js
import daisyui from 'daisyui';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // токены — hex-переменные; для прозрачности задавать rgba явно (см. success/danger фоны в DESIGN)
        primary:      'var(--color-primary)',
        'primary-ink':'var(--color-primary-ink)',
        success:      'var(--color-success)',
        danger:       'var(--color-danger)',
        surface:      'var(--color-surface)',
        sidebar:      'var(--color-sidebar)',
        // ...
      },
      borderRadius: { card: 'var(--radius-card)', btn: 'var(--radius-btn)' },
    },
  },
  plugins: [daisyui],
  daisyui: { themes: ['light'] },   // одна тема — светлая
};
```

Тема фиксированная — светлая (в DESIGN тёмная отклонена). Токены живут в `:root`, DaisyUI работает в теме `light`.

---

## 8. Страницы по ролям ↔ API и сокеты

| Роль | Страница | REST | Socket |
|---|---|---|---|
| **Student** | Home | `/api/gamification/leaderboard`, свои коины/долг | `presence:online`, `presence:heartbeat` |
| | Shop | `GET /api/shop/items`, `POST /api/shop/orders` | — |
| | Test | `GET /api/tests`, `POST /api/tests/:id/start`, `/submit` | — (таймер на клиенте, дедлайн — на сервере) |
| | Homework | `GET /api/homework`, submit + upload | — |
| | Video | `GET /api/videos`, `GET /api/videos/:id/url` | — |
| | Leaderboard | `GET /api/gamification/leaderboard?period=week\|month` | — |
| **Parent** | Ребёнок | `GET /api/parent/child` (посещаемость/оценки/ДЗ/долг) | — |
| | Чат | `GET /api/chat/parent:<id>/messages` | `chat:parent:message` |
| **Mentor** | Davomat | `GET/POST /api/attendance` | — |
| | Проверка ДЗ | `POST /api/homework/submissions/:id/grade` | — |
| | Коины | `POST /api/gamification/coins` (± с причиной) | — |
| | Экзамены | `POST /api/tests` (starts_at/ends_at/duration) | — |
| | Зарплата | `GET /api/reports/my-salary` | — |
| **Admin** | Дашборд | `GET /api/reports/revenue`, `/debts` | `presence:count` |
| | Платежи | `POST /api/payments` (full/split), `/installment` | — |
| | Группы/студенты | CRUD, `/:id/archive`, `/users/:id/freeze` | — |
| | Чат | история по REST | `chat:global:*`, `chat:parent:*` |
| **SuperAdmin** | Глобальный дашборд | те же отчёты без branch-фильтра | `presence:count` |

### Ключевые UI-паттерны страниц

- **TakeTestPage (экзамен с таймером):** при `POST /start` сервер возвращает `finishedBy` (абсолютное время конца). Клиентский таймер — только отображение обратного отсчёта от `finishedBy - Date.now()`; автосабмит на нуле. Сервер всё равно отвергнет ответы после дедлайна.
- **SplitPaymentForm:** два поля (cash/card) + live-валидация «сумма частей = итог» той же zod-схемой, что на бэке; кнопка неактивна при расхождении.
- **Архивная группа:** бейдж «Архив», все кнопки мутаций скрыты/disabled; если бэк всё же вернул 403 — глобальный toast (см. §5).

---

## 9. Файлы: presigned upload и защищённое видео

```js
// src/services/upload.js
import { api } from './api';

/**
 * 1. Бэк выдаёт presigned PUT-URL (клиент не знает S3-креды)
 * 2. Файл летит напрямую в MinIO/S3 — API-сервер не проксирует байты
 * 3. В сущность сохраняется только objectKey
 */
export async function uploadFile(file, purpose /* 'homework' | 'receipt' | 'avatar' */) {
  const { data } = await api.post('/uploads/presign', {
    purpose,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });

  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  return data.objectKey;   // передаётся в POST /api/homework/:id/submissions и т.п.
}
```

Видео: `GET /api/videos/:id/url` возвращает короткоживущий (например, 2 часа) presigned GET-URL — бэк предварительно проверяет, что студент состоит в группе видео. Плеер — обычный `<video src={signedUrl}>`; прямых постоянных ссылок на S3 в DOM нет.

---

## 10. UX-паттерны

| Паттерн | Реализация |
|---|---|
| Optimistic updates | Коины и сообщения чата: TanStack Query `onMutate` → мгновенный UI → откат в `onError` |
| Загрузка | Skeleton-компоненты (DaisyUI `skeleton`) на каждый список; никаких полноэкранных спиннеров |
| Ошибки | ErrorBoundary на каждый layout; сетевые ошибки → toast; 403 archive → отдельное сообщение |
| Формы | react-hook-form + zodResolver; схемы в `features/*/schemas.js`, зеркалят серверные |
| Пустые состояния | `EmptyState` с call-to-action («Добавьте первую группу») |
| Пагинация | cursor-based для чата, page-based для таблиц (`usePagination`) |
| Доступность | DaisyUI/нативные элементы, focus-trap в модалках, `aria-live` для live-счётчика |
| Code-splitting | `lazy()` на каждый layout — студент не грузит код админки |

---

## Приложение: переменные окружения

```bash
# .env.example
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> Секретов во фронте нет и быть не может: всё, что попало в бандл, — публичное.
