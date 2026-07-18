# LevelUp Member — Student & Parent SPA

> `frontend/member` — логин + кабинет Student/Parent (по логин-коду).

## Stack

| Component | Technology |
|-----------|-----------|
| Build | Vite |
| UI | React 18 (JSX) |
| Styles | Tailwind CSS + DaisyUI |
| Routing | React Router v6 |
| Server State | TanStack Query |
| Realtime | Socket.io-client |
| Font | Manrope (variable) |

## запуск

```bash
cd frontend/member
npm install
npm run dev        # порт 5175
npm run build      # production build
```

## Структура

```
src/
├── api.js              # axios-like fetch + mock data
├── auth.jsx            # AuthProvider, useAuth
├── child-context.jsx   # ChildProvider, useChild (выбор ребёнка)
├── queries.js          # TanStack Query хуки
├── format.js           # форматирование дат, денег, статусов
├── socket.js           # socket.io singleton + mock
├── index.css           # Tailwind + кастомные стили
├── main.jsx            # entry point
├── App.jsx             # роутинг
├── components/
│   ├── Layout.jsx      # сайдбар + topbar + <Outlet/>
│   ├── ui.jsx          # EmptyState, ErrorState, ProgressRing, StatCard
│   ├── Avatar.jsx      # генеративный аватар по имени
│   ├── PageHeader.jsx  # заголовок страницы
│   ├── Skeleton.jsx    # скелетоны загрузки
│   ├── Splash.jsx      # стартовый экран
│   └── ErrorBoundary.jsx
└── pages/
    ├── Login.jsx       # вход по логин-коду + пароль
    ├── Dashboard.jsx   # обзор ребёнка (коины, долг, рейтинг, посещаемость, оценки)
    ├── Attendance.jsx  # посещаемость (детально)
    ├── Grades.jsx      # оценки (ДЗ + тесты)
    ├── Debt.jsx        # оплата / долг / коины
    ├── Chat.jsx        # realtime чат (global + direct)
    ├── Notifications.jsx # уведомления
    ├── Profile.jsx     # профиль + настройки
    └── Home.jsx        # редирект по роли
```

## Task Flow (PARENT панель)

```
┌─────────────────────────────────────────────────────┐
│                   FASE 1: KARKAS                     │
│  ✅ Layout (sidebar + topbar)                        │
│  ✅ Auth (login/member)                              │
│  ✅ ChildContext (выбор ребёнка)                      │
│  ✅ Routing + guards                                 │
│  ✅ Mock data + API layer                            │
│  ✅ UI kit (EmptyState, ErrorState, ProgressRing)    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                FASE 2: SAHIFALAR                     │
│                                                      │
│  2.1 Dashboard ──────→ обзор ребёнка                │
│       ├── Hero card (child name + attendance ring)   │
│       ├── KPI cards (коины, долг, рейтинг, посещ.)   │
│       ├── Attendance chart (ring + bar breakdown)    │
│       ├── Groups list                                │
│       ├── Recent lessons                             │
│       └── Recent grades table                        │
│                                                      │
│  2.2 Attendance ─────→ davomat detali                │
│       ├── Summary ring + filter buttons              │
│       ├── History table (date, group, status, note)  │
│       └── Status filter (present/absent/late/excused)│
│                                                      │
│  2.3 Grades ─────────→ baholar                       │
│       ├── Tabs (ДЗ / Тесты)                          │
│       ├── Stats (total, avg, best)                   │
│       └── List with progress bars                    │
│                                                      │
│  2.4 Debt/Payment ───→ to'lov / qarz                 │
│       ├── Total debt card                            │
│       ├── Coins card                                 │
│       └── Debt status (warning / all-clear)          │
│                                                      │
│  2.5 Chat ───────────→ realtime chat                 │
│       ├── Room tabs (global / direct)                │
│       ├── Message list (avatars, roles, timestamps)  │
│       └── Input + send (global only)                 │
│                                                      │
│  2.6 Notifications ──→ bildirishnomalar              │
│       ├── Filter tabs (all/grades/attendance/payment) │
│       └── Notification cards (icon, title, time)     │
│                                                      │
│  2.7 Profile ────────→ profil + child switcher       │
│       ├── User info                                  │
│       ├── Child list (switch)                        │
│       ├── Settings toggles                           │
│       └── Logout                                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               FASE 3: DESIGN UPGRADE                 │
│                                                      │
│  3.1 Icons ──────────→ emoji → custom SVG icons      │
│       ├── Sidebar nav icons (Lucide-style)           │
│       ├── Page icons (stat cards, empty states)      │
│       └── Action icons (send, filter, etc.)          │
│                                                      │
│  3.2 Modern UI ──────→ zamonaviy ko'rinish           │
│       ├── Glass morphism effects                     │
│       ├── Gradient hero cards                        │
│       ├── Smooth transitions + animations            │
│       ├── Better shadows + hover effects             │
│       └── Responsive polish (1280/768/375)           │
│                                                      │
│  3.3 Child Switcher ─→ bir nechta farzand            │
│       ├── Sidebar dropdown (multi-child)             │
│       ├── Profile page child list                    │
│       └── localStorage persistence                   │
└─────────────────────────────────────────────────────┘
```

## API Endpoints (Backend — Abdulaziz ✅)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/member/login` | POST | Login (login-code + password) |
| `/api/auth/refresh` | POST | Refresh JWT (cookie) |
| `/api/auth/logout` | POST | Logout |
| `/api/parent/children` | GET | List children |
| `/api/parent/children/:id/overview` | GET | Child overview (coins, debt, rank, groups, attendance, grades) |
| `/api/parent/notifications` | GET | Notifications |
| `/api/chat/:roomKey/messages` | GET | Chat messages |

## Тестовые аккаунты

| Роль | Код | Пароль |
|------|-----|--------|
| Student | demostud | 123456 |
| Parent | demopare | 654321 |
