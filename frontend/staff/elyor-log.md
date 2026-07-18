# Elyor — ish jurnali (frontend/staff, auth qismi)

_Faqat frontend (login/register) o'zgarishlari shu yerga yoziladi. Backendga tegilmaydi._

## 2026-07-16
- `task.md` va `error.md` ko'rib chiqildi (avvalgi QA-audit natijasi, `2026-07-10` sanasida yozilgan).
- Topilgan 4 ta muammo tekshirildi:
  1. Admin dashboard `api.adminDashboard is not a function` — `src/api.js` + `src/queries.js`
  2. Google login COOP konsol xatosi — `src/firebase.js` + `src/auth.jsx` yoki `vite.config.js`
  3. «Забыли пароль» mock ishlamaydi — `src/api.js` (mock blok)
  4. React Router v7 future-flag warning — `src/main.jsx`
- Xulosa: barcha 4 tasi umumiy fayllarga (`api.js`, `auth.jsx`, `main.jsx`, `vite.config.js`) tegadi — bu fayllar boshqa rollar (admin/mentor/super/methodist) tomonidan ham ishlatiladi, mening chegaramdan (faqat login+register) tashqarida.
- **Qaror: hech biriga tegilmadi.** Karis yoki tegishli egasiga alohida xabar qilinishi kerak.
