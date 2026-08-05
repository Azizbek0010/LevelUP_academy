# Main Admin Design Audit — 30 Jul 2026

> Full page-by-page Playwright visual & API audit

## Summary

| Metric | Result |
|--------|--------|
| Pages audited | 8 (Dashboard, Organizations, OrgDetail, Leads, Settings, Billing, Revenue, Announcements) |
| Font consistency | ✅ Manrope everywhere |
| Sidebar minimalism | ✅ 4 items (Дашборд, Партнёры, Заявки, Настройки) |
| Inline lime violations | ⚠️ ~44 hardcoded `lime-*` classes across all pages |
| API health | ✅ All endpoints return 200 |
| Screenshots captured | 7 PNGs |

## Hardcoded Lime Elements (should use semantic tokens)

### Per-Page Breakdown

| Page | Count | Key Violations |
|------|:-----:|----------------|
| **OrgDetail.jsx** | **11** 🔴 | `from-lime-400 to-lime-500` card gradient, `text-lime-950` value, `text-lime-700` badge, `bg-lime-50 border-lime-200` |
| **Settings** | **9** 🔴 | `from-lime-400 to-lime-600` avatar/bars, `bg-lime-100 text-lime-800` badge, `bg-lime-50` card |
| **Billing.jsx** | **9** 🔴 | `from-lime-400 to-lime-500` KPI card, `text-lime-950/60`, `bg-lime-400` badge, `bg-lime-50` row |
| **Revenue.jsx** | **7** 🟡 | `from-lime-400 to-lime-500` KPI card, `text-lime-950`, `hover:text-lime-600` |
| **Dashboard** | **5** 🟡 | `text-lime-600` links, `hover:bg-lime-50/60`, `bg-lime-50 text-lime-700` |
| **Leads.jsx** | **2** 🟢 | `bg-lime-400 hover:bg-lime-500 text-lime-950` buttons |
| **Announcements** | **1** 🟢 | `bg-lime-400 hover:bg-lime-500 text-lime-950` button |

### Common Patterns Found

```css
/* CARD GRADIENT — appears in OrgDetail, Billing, Revenue */
bg-gradient-to-br from-lime-400 to-lime-500 border-lime-400

/* KPI VALUE TEXT — appears in OrgDetail, Billing, Revenue, Settings */
text-lime-950

/* KPI LABEL */
text-lime-950/60

/* PRIMARY BUTTONS — appears in Leads, Announcements, Revenue */
bg-lime-400 hover:bg-lime-500 border-0 text-lime-950

/* BADGE — OrgDetail, Settings */
bg-lime-100 text-lime-800 border-lime-200

/* PROGRESS BAR — OrgDetail, Settings */
bg-gradient-to-r from-lime-400 to-lime-500

/* LINK TEXT — Dashboard, Revenue */
text-lime-600 hover:text-lime-600
```

### Refactoring Target

Replace all `lime-*` classes with DaisyUI semantic tokens:

| Hardcoded | Semantic Token |
|-----------|---------------|
| `from-lime-400 to-lime-500` | `bg-success` or `bg-primary` |
| `text-lime-950` | `text-success-content` |
| `text-lime-950/60` | `text-success-content/60` |
| `text-lime-950/55` | `text-success-content/55` |
| `text-lime-600` / `text-lime-700` | `text-success` |
| `bg-lime-400 border-0 text-lime-950` (btn) | `btn-success` |
| `bg-lime-50 border-lime-200` (badge) | `badge badge-success` or `bg-success/10` |
| `bg-lime-100 text-lime-800 border-lime-200` | `badge badge-soft badge-success` |
| `bg-lime-50` (row/card) | `bg-success/5` |
| `from-lime-100 via-lime-50` (section bg) | `bg-success/5` |
| `hover:bg-lime-50/60` | `hover:bg-success/10` |
| `hover:text-lime-600` | `hover:text-success` |
| `bg-lime-50 text-lime-700` (icon bg) | `bg-success/10 text-success` |

## API Audit

| Endpoint | Status | Data |
|----------|--------|------|
| `POST /api/auth/refresh` | 401 (initial) | expected — session recovery |
| `GET /api/main/dashboard` | 200 | totals (1 partner, 1 student, 1 branch), pricing tiers, partners list |
| `GET /api/main/leads` | 200 | 1 lead (Levelup, Aziz, +998945731545) |
| `GET /api/main/announcements` | 200 | empty array |

## Screenshots

All saved to `C:\Users\user\OneDrive\Desktop\LevelUP_academy\`:
- `main-admin-dashboard.png`
- `main-admin-organizations.png`
- `main-admin-orgdetail.png`
- `main-admin-leads.png`
- `main-admin-settings.png`
- `main-admin-billing.png`
- `main-admin-revenue.png`
- `main-admin-announcements.png`
- `main-admin-login.png`

## Recommended Next Steps

1. **Refactor `_ui.jsx`** — ensure `TONES.success` maps properly (currently uses `bg-success/10 text-success` etc.)
2. **Refactor OrgDetail.jsx** — replace 11 inline lime classes with `TONES` tokens
3. **Refactor Billing.jsx** — replace 9 inline lime classes
4. **Refactor Settings** — replace 9 inline lime classes
5. **Refactor Revenue.jsx** — replace 7 inline lime classes
6. **Verify** — re-run Playwright audit to confirm zero hardcoded lime classes
