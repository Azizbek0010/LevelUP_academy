# LevelUp Academy — mentor panel (frontend)

Faqat frontend, Vite + React + Tailwind. Mentor uchun: davomat, o'quvchilarga
berilgan uy vazifalarini ko'rish/baholash, coinlar va oylik.

## Ishga tushirish

```bash
npm install
npm run dev
```

Keyin brauzerda `http://localhost:5173` ni oching.

## Struktura

```
src/
  nav.js                     — sidebar menyu ro'yxati
  App.jsx                    — sahifalarni almashtiruvchi asosiy komponent
  components/
    Sidebar.jsx               — chap menyu (LevelUp Academy logo)
    TopBar.jsx                — sahifa sarlavhasi + qidiruv/bildirishnoma
    EmptyHint.jsx             — bo'sh holat bloki
    StudentAvatar.jsx         — rasm/ism bilan avatar
    SubmissionCard.jsx        — Домашки: bitta topshiriq kartasi
    ReviewPanel.jsx           — Домашки: baholash paneli
    StudentCoinRow.jsx        — Коины: talaba balansi qatori
    HistoryFeed.jsx           — Коины: operatsiyalar tarixi
  pages/
    DashboardPage.jsx
    DavomatPage.jsx
    HomeworkPage.jsx           — mentor uy vazifasi bermaydi, faqat berilganini ko'rib baholaydi
    CoinsPage.jsx
    SalaryPage.jsx
```

Barcha ranglar/shriftlar `src/index.css` dagi CSS-token'lar orqali
(`--accent`, `--sidebar-bg`, `--ink` va h.k.) boshqariladi va
`tailwind.config.js` ichida Tailwind ranglariga bog'langan
(masalan `bg-accent`, `text-ink-faint`, `border-line`).
