# SEO / AEO / GEO — бэклог и статус

Живой список задач по поисковой и AI-поисковой оптимизации LevelUp Academy.
Ведёт Abdulaziz (`abdulazizSEO`). Технический гайд «как всё устроено» — в [SEO.md](./SEO.md).

- **Домен:** https://levelup-academy.uz (лендинг), noindex — на всех панелях и API
- **Search Console:** domain-property `sc-domain:levelup-academy.uz` (владельцы: thermidorplus@gmail.com, amangeldiev.azizbek.010@gmail.com)
- **GA4:** `G-RWCK0B6TXP` (ресурс `levelup-1c059 / 544460142`), связан с GSC
- **Bing Webmaster:** импортирован из GSC, sitemap отправлен
- Обновлено: 2026-07-15

---

## ✅ Сделано

| Что | Где | Дата |
|---|---|---|
| Prerender лендинга (Vite SSG) — краулеры видят текст без JS | `scripts/prerender.js`, `entry-server.jsx` | 14.07 |
| Полный SEO-каркас: meta, canonical, OG, JSON-LD (Organization/WebSite/SoftwareApplication/FAQ), sitemap, robots | `index.html`, `lib/seo.js` | 11–14.07 |
| AI-краулеры в robots (в т.ч. live-fetch агенты: Claude-User, Perplexity-User, OAI-SearchBot) | `public/robots.txt` | 14.07 |
| `llms.txt`, растровый `logo.png` для Organization.logo | `public/` | 14.07 |
| `noindex` на всех приватных панелях (main-admin, student) + API | панели + `backend/src/app.js` | 14.07 |
| staff и member: индексируется ТОЛЬКО `/login` (чтобы пользователь находил вход через Google), остальное `noindex` | `staff/`, `member/` (robots + vercel.json + index.html + sitemap) | 15.07 |
| Узбекская версия `/uz` — i18n, hreflang, 12 prerendered страниц | `src/i18n/`, `App.jsx` | 14–15.07 |
| GSC: sitemap отправлен, GA4 связан, prerender подтверждён (Google видит текст) | — | 15.07 |
| Bing: сайт добавлен (импорт из GSC), sitemap отправлен | — | 15.07 |

---

## 📝 Бэклог — контент

Порядок = приоритет. Обоснование и карта запросов: см. artifact «карта запросов и контент-план».
Приоритеты по намерению + конкуренции (замеренных объёмов пока нет — сверка через GSC → Эффективность через 2–4 недели).

### P1 — брать первым

- [ ] **Страница тарифов** (`/landing/pricing` + `/uz/...`). Запрос «сколько стоит / narxi» —
      частый, коммерческий, низкая конкуренция. Offer-разметка schema.org (её читают AI).
      **Блокер: нужны реальные цены** — модель (за филиал / за ученика / фикс), тарифы,
      что входит в бесплатную неделю.
- [ ] **Ниша «для языковой школы»** (`/landing/for-language-school` + `/uz/...`). Запрос
      «программа для языковой школы» / «til markazi uchun dastur». Крупнейший и наименее
      конкурентный сегмент в UZ; узбекская версия — шанс в топ быстрее русской. Цены не нужны.

### P2 — следом

- [ ] **Шлифовка on-page** главной и `/landing/finance` под точные запросы («программа для
      учёта учеников», «электронный журнал», «o'quvchilar hisobi dasturi»). Правки только в
      seo-блоках `i18n/ru.js` и `i18n/uz.js`. URL не менять — уже в индексе.
- [ ] **Ниша «для курсов и репетиторов»** (+ `/uz/...`). «CRM для курсов», «репетиторский центр».
- [ ] **Страница «CRM вместо Excel»** — запрос миграции, высокое намерение сменить инструмент.
      На `/landing/finance` уже есть таблица «до/после» — развернуть в отдельную страницу.

### P3 — длинный хвост + топливо для AI-поиска

- [ ] **Блог / база знаний**, 2–3 стартовые статьи (ru + uz): «как перейти с Excel на CRM»,
      «как не терять деньги на долгах учеников», «как автоматизировать посещаемость».
      Информационные запросы + именно такие тексты цитируют ChatGPT/Perplexity.

> При добавлении любой страницы — чеклист в [SEO.md](./SEO.md) §«Adding a page»
> (i18n ru+uz → App.jsx PAGES → prerender ROUTES → sitemap обе версии + hreflang).

---

## 🔧 Бэклог — технический / ops

- [ ] **Вычитка узбекских текстов носителем** — `src/i18n/uz.js`. Сейчас машинный черновик
      уже в проде (уехал в main вместе с мержем команды). Термины/SEO верны, тон — под вопросом.
      Править только этот файл, структура защищена (214 ключей сверены).
- [ ] **Telegram-ссылка в футере** — заглушка `https://t.me/` в `src/components/Footer.jsx`.
      Нужен реальный handle.
- [ ] **GSC: запросить индексацию 6 узбекских URL** (`/uz/landing`, `.../features`, `.../roles`,
      `.../finance`, `.../gamification`, `.../contacts`). Ручное действие в браузере.
- [ ] **После деплоя staff/member: проверить, что индексируется ТОЛЬКО `/login`.**
      `curl -sI https://staff.levelup-academy.uz/login` → НЕТ `X-Robots-Tag`;
      `curl -sI https://staff.levelup-academy.uz/` → ЕСТЬ `X-Robots-Tag: noindex`.
      То же для member. Затем в GSC запросить индексацию `staff.../login` и `member.../login`.
      Заголовок scoped через negative-lookahead в vercel.json — поведение проверяемо только на проде.
- [ ] **Ссылки из каталогов** (доверие домену): SaaS-каталоги (Product Hunt и т.п.) + узбекские
      бизнес-справочники. Ручная работа. Без ссылок новые страницы поднимаются медленно.
- [ ] **Развести бренд с одноимёнными** (entity disambiguation). Google AI Overview путает нас
      с другой «Levelup Academy» (IT-школа) и западными «Level Up CRM». Сделано в разметке:
      `alternateName`, описание «платформа/ПО, а не школа», `knowsAbout`, страна. **Не хватает
      `sameAs`** — соцсетей компании пока нет (Telegram-канал/Instagram/LinkedIn). Как появятся —
      дописать `sameAs` в Organization (index.html): это самый сильный сигнал различения брендов.
      Плюс каждое упоминание в каталоге с парой «LevelUp Academy CRM + levelup-academy.uz» учит
      Google, что это отдельная сущность. Лечится разметкой + упоминаниями + временем, не мгновенно.

---

## 👀 Мониторинг (не делать — просто заглядывать)

| Когда | Где | Что смотреть |
|---|---|---|
| через 3–7 дней | GSC → Индексирование → Страницы | все 12 URL в «Проиндексировано»; «Мягкая 404» должна убывать, не расти |
| через 1–2 недели | GSC → Эффективность | первые запросы и показы; сверить реальные объёмы с картой |
| через ~сутки | Bing → Sitemaps | статус `Processing` → `Success` |
| через 1–2 дня | GA4 → Органический поиск Google | данные из связки GSC↔GA4 |
| раз в неделю, вручную | ChatGPT / Perplexity / Claude | спросить «CRM для учебного центра в Узбекистане» / «o'quv markazi uchun CRM» — упоминают ли LevelUp. GSC AI-трафик НЕ видит |

---

## ⛅ Ждём входных данных от Abdulaziz

- **Цены/тарифы** — разблокирует страницу тарифов (P1).
- **Telegram-handle** — для футера.
- **Носитель узбекского** — вычитать `i18n/uz.js`.

---

## 🔗 Ссылки

- [SEO.md](./SEO.md) — как устроен prerender / i18n / hreflang (технический гайд)
- Artifact «карта запросов и контент-план»: https://claude.ai/code/artifact/20e09347-5615-4df4-907e-bb44d7558438
- GSC: https://search.google.com/search-console?resource_id=sc-domain:levelup-academy.uz
- Bing: https://www.bing.com/webmasters
