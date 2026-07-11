# SEO — LevelUp Academy Landing

How SEO is wired in this app and how to keep it correct when you add or change pages.

- **Domain:** `https://levelupacademy.uz`
- **Landing base path:** `/landing` (root `/` redirects to `/landing`)
- **Stack:** React 18 + Vite SPA (client-side rendering)

---

## Architecture — two layers

A Vite SPA ships an empty HTML shell; content appears only after JS runs. Social
scrapers (Telegram, Facebook, LinkedIn) **do not execute JS**, and crawlers render on a
separate, budget-limited pass. So SEO is split in two:

| Layer | Where | Seen by | Purpose |
|-------|-------|---------|---------|
| **Static baseline** | `index.html` `<head>` | Everyone, incl. no-JS scrapers | Default title/description, full Open Graph + Twitter Card, canonical, JSON-LD (Organization / WebSite / SoftwareApplication) |
| **Per-route** | `useSeo()` hook | Googlebot (post-render) | Unique title/description/canonical/OG per page + page-specific JSON-LD (breadcrumbs, FAQ) |

> **Order of impact** (from the SEO knowledge base): crawlable + indexable first
> (robots, sitemap, canonical), then per-page relevance (title, description, headings),
> then rich presentation (Open Graph, JSON-LD).

---

## Files

| File | Role |
|------|------|
| `index.html` | Static `<head>` baseline: meta, OG/Twitter, canonical, `theme-color`, JSON-LD `@graph` |
| `src/lib/seo.js` | `useSeo({ title, description, path, jsonLd })` hook + `breadcrumb()` helper + `SITE_URL` / `OG_IMAGE` |
| `public/robots.txt` | Allow all + `Sitemap:` line |
| `public/sitemap.xml` | All 6 canonical URLs |
| `public/og-cover.png` | 1200×630 social share image (referenced by `og:image`) |
| `src/pages/*.jsx` | Each page calls `useSeo()` with its own title/description/JSON-LD |

---

## How to maintain

### Adding a new page
1. Add the route in `src/App.jsx`.
2. In the page component, call the hook at the top:
   ```jsx
   import { useSeo, breadcrumb } from '../lib/seo.js';

   const jsonLd = [
     breadcrumb([
       { name: 'Главная', path: '/landing' },
       { name: 'Название', path: '/landing/new-page' },
     ]),
   ];

   export default function NewPage() {
     useSeo({
       title: 'Заголовок — LevelUp Academy',   // unique, ≤ 60 chars
       description: '...',                       // unique, 150–160 chars
       path: '/landing/new-page',
       jsonLd,                                   // optional
     });
     // ...
   }
   ```
3. Add a `<url>` entry to `public/sitemap.xml`.

### Rules
- **One unique `<title>` and one `<meta description>` per page** — never reuse across routes.
- `jsonLd` must be a **module-level constant** (stable reference), not built inline in
  render — otherwise the effect re-runs every render.
- Keep `SITE_URL` in `src/lib/seo.js` in sync with the real domain.
- If the OG image changes, keep it 1200×630 PNG/JPG (SVG is not accepted by scrapers) and
  update `og:image:width/height` in `index.html`.

---

## Verify

```bash
npm run build                      # must pass; og-cover.png / robots.txt / sitemap.xml land in dist/
npm run preview -- --port 4173     # then check per-route <head> updates
```

Runtime check (per route): `document.title`, `meta[name=description]`,
`link[rel=canonical]`, `meta[property=og:url]` must all change on navigation, and
`script[data-seo-jsonld]` must not accumulate across routes.

External validators:
- **Rich Results Test** (Google) — validate JSON-LD.
- **Facebook Sharing Debugger** / **Telegram** — preview the OG card.
- **GSC URL Inspection → View Crawled Page** — confirm what Googlebot actually renders.

---

## Known limitation & next step

`useSeo()` sets per-page meta **client-side**. It helps Googlebot (which renders JS) but
does **not** fix the empty first HTML response — deep-link social scrapers only ever see
the `index.html` baseline OG, not per-page OG.

**Recommended follow-up:** add **prerendering / SSG** (e.g. `vite-plugin-prerender`) so
each route is baked to static HTML at build time. This is the strongest fix for a
marketing SPA and makes per-page OG + content visible on the first response. It changes
the build/deploy pipeline, so it belongs in its own task.

Other open items:
- Footer Telegram link is a placeholder (`https://t.me/`) — set the real handle.
- `Organization.logo` in JSON-LD points to an SVG; Google prefers a raster logo.
