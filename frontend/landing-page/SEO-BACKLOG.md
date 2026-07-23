# SEO / AEO / GEO — бэклог и статус

Живой список задач по поисковой и AI-поисковой оптимизации LevelUp Academy.
Ведёт Abdulaziz (`abdulazizSEO`). Технический гайд «как всё устроено» — в [SEO.md](./SEO.md).

- **Домен:** https://levelup-academy.uz (лендинг), noindex — на всех панелях и API
- **Search Console:** domain-property `sc-domain:levelup-academy.uz` (владельцы: thermidorplus@gmail.com, amangeldiev.azizbek.010@gmail.com)
- **GA4:** `G-RWCK0B6TXP` (ресурс `levelup-1c059 / 544460142`), связан с GSC
- **Bing Webmaster:** импортирован из GSC, sitemap отправлен
- **Yandex Webmaster:** сайт `https://levelup-academy.uz` подтверждён через DNS TXT (`yandex-verification: 3fad9273b6b005db`, Cloudflare). ⚠️ meta/HTML-file методы НЕ работают: корень `/` отдаёт 308→`/landing`, а `cleanUrls` режет `.html` — Яндексу нужен 200 на главной. Только DNS. **Настроен 23.07** — см. таблицу ниже.
- **DNS:** Cloudflare (NS `jobs/elle.ns.cloudflare.com`); там TXT для Google + Yandex + SPF
- Обновлено: 2026-07-23

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
| **Страница тарифов** `/landing/pricing` (+`/uz/...`) — реальные цены, Offer/AggregateOffer + FAQPage schema.org, акцент на гарантии | `pages/Pricing.jsx`, `i18n/`, sitemap | 16.07 |
| **Ниша «для языковой школы»** `/landing/for-language-school` (+`/uz/...`) — FAQPage + Breadcrumb, ссылка из футера + на тарифы (не orphan) | `pages/ForLanguageSchool.jsx`, `i18n/`, `Footer.jsx`, sitemap | 16.07 |
| **IndexNow** (Яндекс+Bing): ключ-файл + `scripts/indexnow.js` (URL из sitemap) → `npm run indexnow`. Пинг 24 URL отправлен (202) | `public/<key>.txt`, `scripts/indexnow.js` | 16.07 |
| **GA4 SPA-трекинг**: `send_page_view:false` + ручной `page_view` на каждый роут (верный path+title, без задвоения) + конверсия `generate_lead` на отправку формы | `lib/analytics.js`, `App.jsx`, `Contacts.jsx`, `index.html` | 17.07 |
| **Page speed**: аудит + preconnect к GA, `width/height` на логотипах (CLS). Шрифт уже ленивый (unicode-range, subsets не качаются), `font-display:swap`, рендер-картинок нет. Замер (локально): LCP 336мс, CLS 0 | `index.html`, `Header.jsx`, `Footer.jsx` | 17.07 |
| **A11y / семантика**: аудит (alt, aria, 1×h1/стр, label — уже были ок) + добавлено skip-to-content (WCAG 2.4.1) и `aria-label` на 2 `<nav>` | `App.jsx`, `Header.jsx`, `i18n/`, `index.css` | 17.07 |
| GSC: sitemap отправлен, GA4 связан, prerender подтверждён (Google видит текст) | — | 15.07 |
| Bing: сайт добавлен (импорт из GSC), sitemap отправлен | — | 15.07 |
| **Yandex Webmaster: сайт подтверждён** (DNS TXT в Cloudflare) + meta-тег в коде как доп. сигнал | `index.html` (meta), Cloudflare DNS | 16.07 |
| **Yandex Webmaster настроен полностью**: sitemap принят (26 URL, 0 ошибок в валидаторе); регион **Узбекистан** отправлен на модерацию (подтверждающая страница — `/landing/contacts`, до 7 дней); переобход всех 26 URL; 14 коммерческих страниц в «Мониторинг важных страниц»; robots.txt — 0 ошибок, `Sitemap:` виден; микроразметка парсится целиком (FAQPage, Organization, WebSite, SoftwareApplication, OG, Twitter) | Вебмастер (ручное) | 23.07 |
| **favicon для Яндекса**: `favicon.ico` (16/32/48) + `apple-touch-icon.png` (180) сгенерированы из `logo-mark.svg` (Pillow) и слинкованы в `index.html`. Причина: Яндекс не принимает SVG-only иконку и тянет её от корня, который 308-редиректится. **В проде** (`/favicon.ico` → 200, cherry-pick в `main`, Vercel задеплоил) | `public/favicon.ico`, `public/apple-touch-icon.png`, `index.html`, `SEO.md` | 23.07 |

---

## 📝 Бэклог — контент

Порядок = приоритет. Обоснование и карта запросов: см. artifact «карта запросов и контент-план».
Приоритеты по намерению + конкуренции (замеренных объёмов пока нет — сверка через GSC → Эффективность через 2–4 недели).

### P1 — брать первым

- [x] ~~**Страница тарифов** (`/landing/pricing` + `/uz/...`)~~ — ✅ 16.07. Реальные цены получены
      (фикс по бакету учеников, совпадает с `backend/config/plans.js` TIERS), Offer/AggregateOffer +
      FAQPage schema.org, акцент на гарантии (возврат 30 дней, бэкап, запуск за неделю). Блокер снят.
- [x] ~~**Ниша «для языковой школы»** (`/landing/for-language-school` + `/uz/...`)~~ — ✅ 16.07.
      Запрос «программа для языковой школы» / «til markazi uchun dastur». Полный SEO-каркас +
      FAQPage, ссылка из футера (sitewide) и на тарифы. Верифицировано: build + браузер (гидратация чистая).

### P2 — следом

- [x] ~~**Шлифовка on-page** главной и `/landing/finance`~~ — ✅ 16.07. title/description
      главной и finance (ru+uz) переписаны под точные запросы: «программа для учёта учеников»,
      «электронный журнал», «учёт оплат/долгов учеников», «o'quvchilar hisobi dasturi»,
      «elektron jurnal». URL не тронуты, title ≤60. Правки только в seo-блоках `i18n`.
- [x] ~~**Ниша «для курсов и репетиторов»** `/landing/for-courses` (+`/uz/...`)~~ — ✅ 17.07.
      «CRM для курсов», «репетиторский центр», «kurslar uchun CRM». FAQPage + Breadcrumb,
      ссылка из футера + на тарифы. Verify: build (sitemap 26 URL) + браузер (гидратация чистая, ru+uz).
- [ ] **Страница «CRM вместо Excel»** — запрос миграции, высокое намерение сменить инструмент.
      На `/landing/finance` уже есть таблица «до/после» — развернуть в отдельную страницу.

### P3 — длинный хвост + топливо для AI-поиска

- [x] ~~**Блог / база знаний**, 3 стартовые статьи (ru + uz)~~ — ✅ 16.07.
      `/landing/blog` (индекс) + `excel-to-crm`, `student-debts`, `attendance-automation`.
      Каждая: `BlogPosting` + `BreadcrumbList` JSON-LD, тело в prerender (видно AI без JS),
      ссылка из футера. Инфраструктура блога (индекс + шаблон статьи по `:slug`) готова —
      новые статьи добавляются одним ключом в `i18n .blog.articles` + путь в prerender/sitemap.
      Verify: build (24 URL) + браузер (гидратация чистая, ru+uz).

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
- [ ] **GSC: запросить индексацию 2 URL тарифов** (`/landing/pricing`, `/uz/landing/pricing`)
      после деплоя. Приоритетные — коммерческий запрос «сколько стоит / narxi».
- [x] ~~**Yandex: отправить sitemap**~~ — ✅ принят, 26 URL, валидатор без ошибок.
- [x] ~~**Yandex: указать регион «Узбекистан»»**~~ — ✅ 23.07 отправлен на модерацию (до 7 дней).
      Если Яндекс отклонит — причина в том, что на `/landing/contacts` нет физического адреса,
      только «Сделано в Узбекистане». Тогда либо добавить адрес/телефон на страницу контактов,
      либо завести организацию в **Яндекс Бизнесе** (регион подтянется автоматически).
- [x] ~~**IndexNow**~~ — ✅ 16.07, `scripts/indexnow.js` + ключ-файл.
- [x] ~~**Yandex: включить email-уведомления**~~ — ✅ 23.07, адрес `yakubov02009@yandex.ru`.
      По почте включены «Ошибки», «Изменение регионов сайта», «Обновление главного адреса»,
      «Краткая еженедельная сводка»; выключены «Рекомендации» и «Обновление поисковой базы»
      (шум). Внешний Gmail сюда поставить нельзя без добавления его в Яндекс ID.
      ⚠️ Готча: список адресов в дропдауне **подгружается с задержкой** — если открыть его
      сразу после загрузки страницы, видно только «Другой адрес» / «Не получать», и кажется,
      что у аккаунта нет почты. Подождать пару секунд и открыть снова.
- [ ] **Yandex Бизнес** — организация не добавлена (рекомендация Вебмастера). Даёт телефон и
      блок «Компания» в сниппете + автоматический регион. Нужны адрес офиса и телефон.
- [ ] **Yandex: проверка мобильных страниц** — инструмент висел на «подождите» (сайта ещё нет
      в базе Яндекса). Перепроверить после первой индексации.
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
| через 3–7 дней | Yandex → Мониторинг важных страниц | 14 URL: «Робот не посещал» → должен появиться код ответа 200 и статус в базе. На 23.07 сайта в поисковой базе Яндекса **нет вообще** |
| через ≤7 дней | Yandex → Региональность | заявка на «Узбекистан» принята или отклонена |
| через 1–2 недели | Yandex → Диагностика | должны уйти «Нет файлов Sitemap» (после обработки) и «favicon не найден» (после деплоя favicon в прод) |
| через 1–2 дня | GA4 → Органический поиск Google | данные из связки GSC↔GA4 |
| раз в неделю, вручную | ChatGPT / Perplexity / Claude | спросить «CRM для учебного центра в Узбекистане» / «o'quv markazi uchun CRM» — упоминают ли LevelUp. GSC AI-трафик НЕ видит |

---

## ⛅ Ждём входных данных от Abdulaziz

- ~~**Цены/тарифы**~~ — ✅ получены 16.07, страница тарифов сделана.
- **Telegram-handle** — для футера.
- **Носитель узбекского** — вычитать `i18n/uz.js` (теперь и блок `pricing`).

---

## 🔗 Ссылки

- [SEO.md](./SEO.md) — как устроен prerender / i18n / hreflang (технический гайд)
- [GEO-OFFSITE.md](./GEO-OFFSITE.md) — off-site GEO/AEO задачи (соцсети, Reddit/Quora, каталоги, `sameAs`, мониторинг)
- Artifact «карта запросов и контент-план»: https://claude.ai/code/artifact/20e09347-5615-4df4-907e-bb44d7558438
- GSC: https://search.google.com/search-console?resource_id=sc-domain:levelup-academy.uz
- Bing: https://www.bing.com/webmasters
