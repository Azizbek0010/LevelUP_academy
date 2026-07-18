# PARENT Panel — Task List (iface9808-sketch)

> Backend tayyor: `AB-PARENT` ✅ (child overview + assertParentOwnsChild guard)
> Panel: `frontend/member` — parent tomoni

---

## ✅ Tugallangan (karkas bazasi)

- [x] Auth: login/member endpoint (login-code + parol)
- [x] AuthProvider + useAuth hook
- [x] ChildProvider + useChild hook (bir nechta farzand support)
- [x] Layout: sidebar + topbar + Outlet
- [x] Routing: /dashboard, /attendance, /grades, /debt, /chat, /notifications, /profile
- [x] ProtectedRoute + HomeRedirect (student → student SPA)
- [x] Mock data + API layer (api.js)
- [x] Socket.io client + mock
- [x] UI kit: EmptyState, ErrorState, ProgressRing, ProgressBar, StatCard
- [x] Skeleton loader components
- [x] ErrorBoundary
- [x] Avatar (generative by name)
- [x] PageHeader

---

## 🔥 QOLGAN TASKLAR (8 ta)

### TASK 1: PARENT: Child overview — coins, qarz, reyting, guruhlar, davomat, baholar

**Sahifa:** `/dashboard` (Dashboard.jsx)

**Hozirgi holat:** Bor, lekin sodd. Zamonaviylashtirish kerak.

**Qilinishi kerak:**
- [ ] Hero card — gradient background, child name + attendance ring + groups count
- [ ] KPI cards — coins (🪙→icon), debt (💰→icon), ranking (🏆→icon), attendance (📊→icon)
- [ ] Attendance widget — ring + 4 status bar breakdown (present/absent/late/excused)
- [ ] Groups list — mentor name, subject badge, hover effects
- [ ] Recent lessons — timeline style, status pills
- [ ] Recent grades table — score bar, type badge (ДЗ/Тест), time ago
- [ ] Responsive: 1280 → 2 col, 768 → stacked, 375 → mobile

**Design:**
- Hero: gradient `from-sidebar to-[#1a2e12]` + decorative circles
- KPI: white card, icon in colored bg, value + sub text
- Animations: card hover `translate-y`, ring animation

---

### TASK 2: PARENT: Bir nechta farzand — bolalar orasida almashtirish

**Sahifa:** Layout sidebar + Profile page

**Hozirgi holat:** Bor (sidebar dropdown + profile list). Sodd.

**Qilinishi kerak:**
- [ ] Sidebar: dropdown select — chiroyli qilish (hozir oddiy `<select>`)
- [ ] Sidebar: single child — avatar + name + "Ребёнок" badge (hozir bor, yaxshilash)
- [ ] Profile page: child cards — active state, coins, debt, "Выбран" badge
- [ ] Animatsiya: child switch → data refresh + toast notification
- [ ] localStorage persistence — tanlangan child saqlanadi
- [ ] EmptyState: child yo'q bo'lsa — "Add child" prompt

**Design:**
- Dropdown: custom select with avatar thumbnails
- Active child: lime ring + shadow
- Switch animation: fade transition

---

### TASK 3: PARENT: Davomat detali — farzandning davomat tarixi

**Sahifa:** `/attendance` (Attendance.jsx)

**Hozirgi holat:** Bor, lekin sodd.

**Qilinishi kerak:**
- [ ] Summary ring — katta, animation bilan
- [ ] 4 ta filter button — present/absent/late/excused (rangli, active state)
- [ ] History table — date, group name, status pill, comment
- [ ] Filter logic — status bo'yicha filterlash
- [ ] EmptyState — "Данных пока нет"
- [ ] Responsive: mobile → stacked cards instead of table

**Design:**
- Ring: 90px, animated stroke-dashoffset
- Filter buttons: colored bg when active, ring outline
- Table: hover highlight, status pills with bg+color

---

### TASK 4: PARENT: Baholar / uy vazifa natijalari

**Sahifa:** `/grades` (Grades.jsx)

**Hozirgi holat:** Bor, lekin sodd.

**Qilinishi kerak:**
- [ ] Tabs: ДЗ / Тесты (icon + label)
- [ ] Stats row: total, avg (color-coded), best score
- [ ] Grade list: icon + title + progress bar + score + date
- [ ] Progress bar: color by percentage (green/yellow/red)
- [ ] EmptyState per tab
- [ ] Responsive: stacked on mobile

**Design:**
- Tabs: lime active, grey inactive
- Stats: 3-col grid, centered numbers
- Grade items: rounded cards, progress bar, time ago

---

### TASK 5: PARENT: To'lov / qarz — farzandning invoice va qarzi

**Sahifa:** `/debt` (Debt.jsx)

**Hozirgi holat:** Bor, lekin sodd.

**Qilinishi kerak:**
- [ ] Debt card — amount + color (red if debt, green if clear)
- [ ] Coins card — balance + earned label
- [ ] Progress bar — paid vs pending
- [ ] Warning state — pulsing dot + "Требуется внимание"
- [ ] Clear state — checkmark + "Задолженностей нет"
- [ ] Responsive: 2-col → stacked

**Design:**
- Debt card: red/green gradient bg circle decoration
- Coins card: lime bg circle decoration
- Warning: animate-pulse dot
- Clear: green checkmark in circle

---

### TASK 6: PARENT: Chat — mentor / admin bilan realtime (Socket.io)

**Sahifa:** `/chat` (Chat.jsx)

**Hozirgi holat:** Bor, lekin sodd.

**Qilinishi kerak:**
- [ ] Room tabs: global / direct (icon + label)
- [ ] Online indicator — green dot + "Онлайн"
- [ ] Message list — avatars, role badges, timestamps
- [ ] Message bubbles — sent (lime) vs received (grey), rounded
- [ ] Input + send button (global only, direct = read-only)
- [ ] Auto-scroll to bottom
- [ ] Empty state per room
- [ ] Responsive: full height on mobile

**Design:**
- Tabs: lime active
- Messages: bubble style, tail on last in group
- Role badges: colored pills (admin=blue, mentor=purple, parent=green)
- Send button: lime circle with arrow icon
- Input: rounded-xl, border

---

### TASK 7: PARENT: Bildirishnomalar

**Sahifa:** `/notifications` (Notifications.jsx)

**Hozirgi holat:** Bor, lekin sodd.

**Qilinishi kerak:**
- [ ] Filter tabs: all / grades / attendance / payment (with counts)
- [ ] Notification cards: icon + title + body + time ago
- [ ] Unread indicator: lime dot + ring highlight
- [ ] Empty state: "Нет уведомлений"
- [ ] Responsive: stacked on mobile

**Design:**
- Tabs: pill style, count badge
- Cards: icon in colored circle, title bold, body muted, time ago
- Unread: ring-1 ring-primary/20 + dot

---

### TASK 8: PARENT: Design-system — laym #C6FF34, Manrope, 3 holat, responsive

**Global qoidalar:**

- [ ] Har bir sahifada 3 holat: Skeleton (loading), EmptyState (no data), Error (retry)
- [ ] Responsive: 1280px (2-col), 768px (stacked), 375px (mobile)
- [ ] TanStack Query cache invalidation after mutations
- [ ] Hover effects: cards `hover:-translate-y-0.5`, table rows `hover:bg-base-200/50`
- [ ] Shadows: `0 10px 28px rgba(29,36,23,.14), 0 2px 6px rgba(29,36,23,.08)`
- [ ] Font: Manrope (variable) — already loaded
- [ ] Colors: lime #C6FF34, sidebar #1D2417, bg #F6FBEA, surface #FFFFFF
- [ ] Border radius: 1rem (cards), 0.6rem (buttons), 0.75rem (inputs)

---

## ICON UPGRADE (emoji → SVG)

Hozir emoji ishlatilmoqda. Zamonaviy SVG iconalar bilan almashtirish kerak.

| Joy | Hozir | Yangi icon |
|-----|-------|-----------|
| Sidebar: Dashboard | 🏠 house | SVG house icon |
| Sidebar: Attendance | 📅 calendar | SVG calendar icon |
| Sidebar: Grades | 🎓 grades | SVG academic icon |
| Sidebar: Debt | 💰 wallet | SVG wallet icon |
| Sidebar: Chat | 💬 chat | SVG chat icon |
| Sidebar: Notifications | 🔔 bell | SVG bell icon |
| StatCard: Coins | 🪙 | SVG coin/star icon |
| StatCard: Debt | 💰 | SVG wallet icon |
| StatCard: Ranking | 🏆 | SVG trophy icon |
| StatCard: Attendance | 📊 | SVG chart icon |
| EmptyState icons | 📭📝📅 | Context-aware SVG |
| ErrorState icon | ⚠️ | SVG alert icon |
| Chat send button | → arrow | SVG paper-plane |
| Notification types | 📝📅💰💬🔔 | SVG per type |

---

## IMPLEMENTATION ORDER

```
1. Icons upgrade (emoji → SVG) ──── BIRINCHI
2. Dashboard redesign ──────────── KEYIN
3. Attendance upgrade ─────────────
4. Grades upgrade ─────────────────
5. Debt/Payment upgrade ───────────
6. Chat upgrade ───────────────────
7. Notifications upgrade ───────────
8. Profile + Child Switcher ───────
9. Responsive polish ──────────────
10. Build + test ──────────────────
```
