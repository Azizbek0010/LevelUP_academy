# SEO / GEO / AEO — LevelUp Academy Landing

How search and AI-search are wired in this app, and how to keep them correct.

- **Domain:** `https://levelup-academy.uz` (with the hyphen — `levelupacademy.uz` does not resolve)
- **Landing base path:** `/landing`; `/` is a 308 redirect to it
- **Stack:** React 18 + Vite, **prerendered to static HTML at build time**

---

## The core constraint

A Vite SPA ships an empty `<div id="root">`. Googlebot executes JavaScript and renders it
eventually, but **the AI crawlers that produce citations do not** — ChatGPT's crawler cannot
run JS at all. An unrendered page gives them nothing to quote, no matter how good the copy is.

So every route is **prerendered**: a real HTML file with its text, headings and metadata
already inside. No part of SEO here depends on the browser running JavaScript.

---

## How the build works

```
npm run build
  ├─ build:client   vite build                → dist/ (assets + index.html template)
  ├─ build:server   vite build --ssr          → dist/server/entry-server.js
  └─ prerender      node scripts/prerender.js → dist/landing/**/index.html
```

`scripts/prerender.js` renders each route through `src/entry-server.jsx` and fills two
markers in the `index.html` template:

| Marker | Filled with |
|---|---|
| `<!--app-head-->` | Per-route `<title>`, description, robots, canonical, `og:url`, route JSON-LD |
| `<!--app-html-->` | The rendered page markup |

The server bundle (`dist/server/`) is deleted afterwards — it is a build tool, not a deploy
artifact. The build **fails loudly** if a route renders empty or forgets its `<title>`.

---

## Two layers of metadata

| Layer | Lives in | Seen by |
|---|---|---|
| **Static** — `og:image`, `og:type`, `twitter:card`, JSON-LD `@graph` (Organization, WebSite, SoftwareApplication, FAQPage) | `index.html` | Everyone, always |
| **Per-route** — title, description, canonical, `og:url`, BreadcrumbList / FAQ | `useSeo()` in each page | Baked into the HTML **and** re-applied client-side on navigation |

`src/lib/seo.js` serves both: in the browser `useSeo()` writes to the DOM; during the server
pass it reports the same data through `SeoCollectorContext`, and `renderSeoHead()` turns it
into tags. **Keep the two in sync** — add a tag to one and not the other, and the crawler and
the browser end up with different heads.

---

## Languages (ru / uz)

The site is bilingual. **Language lives in the URL, never in state:**

| Language | URL | `<html lang>` |
|---|---|---|
| Russian (default) | `/landing/finance` | `ru` |
| Uzbek | `/uz/landing/finance` | `uz` |

Russian keeps its original paths — they are already indexed, and changing a URL throws away
its ranking. Uzbek is added under a `/uz` prefix.

A language toggle in `localStorage` would be **invisible to search engines**: one URL cannot
rank in two languages. Each version needs its own address, and `hreflang` ties them together —
without it Google treats them as competing duplicates and may serve the wrong one.

- `src/i18n/{ru,uz}.js` — the dictionaries. **Structures must match key for key**; a missing
  key renders as `undefined` on the page, not a build error.
- `src/i18n/index.js` — `useT()` (dictionary), `useLang()`, `useLocalizePath()` (`lp()` for links).
- Pages pass the **canonical** path to `useSeo` (`/landing/finance`); it localises internally
  and emits the `hreflang` set (ru + uz + x-default, each listing all three — Google drops a
  cluster whose references are not reciprocal).
- FAQ/Breadcrumb JSON-LD is generated **in code**, not in `index.html`: the markup has to be in
  the language of the page. A Russian FAQ on an Uzbek page would contradict its own content —
  and FAQ is exactly what AI assistants quote.

## Adding a page

1. Add the strings to **both** `src/i18n/ru.js` and `src/i18n/uz.js`.
2. Call `useSeo({ title, description, path, jsonLd })` with the **canonical** path.
   `jsonLd` **must have a stable reference** — wrap it in `useMemo`, otherwise the effect
   re-runs every render.
3. Add the route to `PAGES` in `src/App.jsx` — the `/uz` variant is generated from it.
4. Add the canonical path to `PAGES` in `scripts/prerender.js`. **Skip this and the page ships
   as an empty shell** — invisible to AI crawlers.
5. Add **both** URLs to `public/sitemap.xml` with the full `hreflang` block.

Rules: one unique `<title>` (≤60 chars) and one `<meta description>` (150–160 chars) per page
**per language**. `og:image` must stay raster (1200×630 PNG) — scrapers reject SVG.

---

## Favicons

`index.html` links three icons, and the raster ones are not optional:

| File | Why it exists |
|---|---|
| `public/favicon.ico` (16/32/48) | Yandex.Webmaster reports **"favicon not found"** for an SVG-only icon. It also fetches the icon relative to `/`, which 308-redirects here, so the file must exist at the root. |
| `public/logo-mark.svg` | What modern browsers actually prefer — crisp at any size. |
| `public/apple-touch-icon.png` (180×180) | iOS home-screen bookmarks. |

The rasters are generated from `logo-mark.svg` (lime `#C6FF34` open ring on brand dark
`#1d2417`, same geometry as the SVG) — regenerate with Pillow if the mark changes; do not
hand-edit them. Same rule as `og:image`: **search engines want raster, not SVG.**

---

## Hosting (`vercel.json`)

- `/` → `/landing` is a **308 redirect**. A client-side redirect is a dead end for a crawler
  that doesn't run JS.
- **No SPA rewrite.** Every route is a real file now, so an unknown URL returns a genuine 404
  (`public/404.html`) instead of a soft-404 rendering the homepage. This matters: AI
  assistants send users to hallucinated URLs ~2.9× more often than Google does.

### Security headers

The `/(.*)` rule sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` and a CSP. The CSP allowlist is **derived from what the app actually
loads**, not copied from a template — widen it only after checking the build:

| Directive | Why these hosts |
|---|---|
| `script-src` | `googletagmanager.com` (GA4 tag) + `'unsafe-inline'` — `index.html` carries an inline `gtag()` bootstrap and Vercel serves static files, so there is no nonce to issue. |
| `connect-src` | `api.levelup-academy.uz` (the lead form) and `*.google-analytics.com` — GA4 posts to regional hosts like `region1.`, so the wildcard is required. |
| `style-src` | `'unsafe-inline'` — React `style={{…}}` props compile to inline style attributes. |
| `font-src 'self'` | Manrope ships in the bundle (`@fontsource-variable/manrope`), nothing is fetched from Google Fonts. |

`frame-ancestors 'none'` duplicates `X-Frame-Options` on purpose: the latter is what older
crawlers and scanners still look for.

**HSTS is deliberately not set here.** Vercel already sends
`Strict-Transport-Security: max-age=63072000`; overriding it would only lower the max-age, and
adding `includeSubDomains` would bind `api.`, `staff.` and `member.` for two years — a call for
the Team Lead, not a landing-page commit.

Vercel applies headers server-side, so a plain static server proves nothing about them. To test
a CSP change before deploying, serve `dist/` through something that reads the same
`vercel.json` and watch the console for violations — they surface as console errors, and a
clean console after a reload is the pass condition.

---

## Verifying a change

**Do not verify with `vite preview`.** It is an SPA server: it serves the root `index.html`
for every path, so the browser gets the homepage markup while React renders the real route.
That fakes a hydration mismatch (React error #418/#423) which does **not** happen in
production. Serve `dist/` as plain static files instead:

```bash
npm run build
cd dist && python -m http.server 4179
```

Check that the content is there **before** any JS runs:

```bash
curl -s localhost:4179/landing/finance/ | grep -o '<title>[^<]*</title>'   # unique per route
curl -s localhost:4179/landing/finance/ | grep -c 'rel="canonical"'        # exactly 1
```

In the browser the console must be **clean**. React #418/#423 means the server HTML and the
client render disagree and React threw the prerendered markup away — the prerender is then
worthless for users, and the mismatch usually points at markup that depends on browser state.

External validators: Google **Rich Results Test** (JSON-LD), **Facebook Sharing Debugger**
(OG card), **GSC URL Inspection → View Crawled Page** (what Googlebot really sees).

---

## AI crawlers (GEO / AEO)

`public/robots.txt` allows two families, and the difference matters:

- `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot` — training / indexing.
- `OAI-SearchBot`, `Claude-User`, `Claude-SearchBot`, `Perplexity-User`, `ChatGPT-User` —
  **live fetch when a user asks an assistant a question. These are the ones that generate the
  citation.** Block them and the assistant cannot cite you even if it knows you exist.

`public/llms.txt` is a plain-language product summary. Keep it truthful, but don't lean on
it — as of 2026 no major provider has confirmed acting on it. `robots.txt` and rendered HTML
are what actually work.

---

## Open items

- **Uzbek copy is a machine draft and needs a native review.** The structure, terms and SEO
  are correct; tone and phrasing are not guaranteed. Edit `src/i18n/uz.js` — nothing else.
- Footer Telegram link is still a placeholder (`https://t.me/`, `src/components/Footer.jsx`).
  Needs the real handle — do not guess one.
