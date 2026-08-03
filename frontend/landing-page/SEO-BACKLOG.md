# SEO / AEO / GEO — бэклог и статус

Живой список задач по поисковой и AI-поисковой оптимизации LevelUp Academy.
Ведёт Abdulaziz (`abdulazizSEO`). Технический гайд «как всё устроено» — в [SEO.md](./SEO.md).

- **Домен:** https://levelup-academy.uz (лендинг), noindex — на всех панелях и API
- **Search Console:** domain-property `sc-domain:levelup-academy.uz` (владельцы: thermidorplus@gmail.com, amangeldiev.azizbek.010@gmail.com)
- **GA4:** `G-RWCK0B6TXP` (ресурс `levelup-1c059 / 544460142`), связан с GSC
- **Bing Webmaster:** импортирован из GSC, sitemap отправлен
- **Yandex Webmaster:** сайт `https://levelup-academy.uz` подтверждён через DNS TXT (`yandex-verification: 3fad9273b6b005db`, Cloudflare). ⚠️ meta/HTML-file методы НЕ работают: корень `/` отдаёт 308→`/landing`, а `cleanUrls` режет `.html` — Яндексу нужен 200 на главной. Только DNS. **Настроен 23.07** — см. таблицу ниже.
- **DNS:** Cloudflare (NS `jobs/elle.ns.cloudflare.com`); там TXT для Google + Yandex + SPF
- Обновлено: 2026-08-03

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
| **Security headers на лендинге** — CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` в правиле `/(.*)`. Allowlist собран по реальным ресурсам сборки (GA4 + `api.levelup-academy.uz`), а не по шаблону. HSTS не трогал: Vercel уже отдаёт `max-age=63072000`, а `includeSubDomains` затронул бы `api./staff./member.` — решение Team Lead'а | `vercel.json`, `SEO.md` §Security headers | 24.07 |
| **Страница «CRM вместо Excel»** `/landing/crm-vs-excel` (+`/uz/...`) — сравнение таблиц и CRM по 8 задачам, FAQPage + Breadcrumb, ссылка из футера; разведена по намерению с блог-гайдом `excel-to-crm` | `pages/CrmVsExcel.jsx`, `i18n/`, `Footer.jsx`, sitemap, `llms.txt` | 24.07 |
| **Ключевые слова в meta**: в узбекскую `for-language-school` возвращены `A1–C1, IELTS` (были в теле страницы, но не в description — а узбекоязычная аудитория ищет «IELTS» напрямую); в русскую `features` возвращено слово «посещаемость» — это была единственная meta, где `davomat` стоял без русского эквивалента. Verify: build 28 роутов + grep по `dist/` (обе meta на месте, 0 `undefined`) | `i18n/uz.js:1177`, `i18n/ru.js:1150` | 03.08 |
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
- [x] ~~**Страница «CRM вместо Excel»** (`/landing/crm-vs-excel` + `/uz/...`)~~ — ✅ 24.07.
      Запрос миграции: «CRM вместо Excel», «Excel или CRM для учебного центра».
      Таблица сравнения на 8 задач (шире, чем «до/после» на `/landing/finance`: добавлены
      посещаемость, уведомления, права доступа, работа с телефона), 6 карточек «где ломаются
      таблицы», 3 шага перехода, FAQPage + BreadcrumbList, ссылка из футера (sitewide) и
      на тарифы.
      ⚠️ **Разведено с блог-статьёй `/landing/blog/excel-to-crm`** — они конкурировали бы
      за один запрос. Статья = информационный гайд «как перейти» (пошагово, миграция);
      страница = коммерческое сравнение «чем заменить и стоит ли». Разные title/description,
      со страницы стоит ссылка на гайд. Причина зафиксирована в шапке `CrmVsExcel.jsx`.
      Verify: build (sitemap 28 URL, prerender 28 роутов) + браузер на статике —
      title/canonical/hreflang по одному, 0 `undefined`, консоль чистая (ru+uz).

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

- [ ] 🔴 **Microsoft Clarity не в проде** — коммит `7878f18` (`index.html` +11 строк тега Clarity,
      `vercel.json` +домен в CSP) лежит в `save-zone`. Сверено 03.08: в `origin/main` его нет,
      `curl` главной не находит `clarity` в HTML → тепловые карты и записи сессий **не пишутся**.
      Это **единственное** SEO-изменение, застрявшее между `save-zone` и `main`; весь остальной
      SEO-контент (включая `crm-vs-excel`) уже в проде. Ждёт явной команды на промоушен
      `save-zone → main` от владельца.

- [ ] **Вычитка узбекских текстов носителем** — `src/i18n/uz.js`. Машинный черновик уже в проде
      (уехал в main вместе с мержем команды). Термины/SEO верны, тон — под вопросом.
      Править только этот файл, структура защищена (214 ключей сверены).
      **Подготовлено 03.08:** [UZ-REVIEW.md](./UZ-REVIEW.md) — чеклист для носителя с конкретными
      строками (3 подозрения на грамматику + 3 вопроса тона), списком того, что менять НЕ надо,
      и честным охватом аудита. Автопроверки уже прогнаны: кириллицы нет, апострофы единообразны
      (797 в словах, все ASCII — оставляем). Носителю остаётся смысловая часть.
- [ ] **Telegram-ссылка в футере** — заглушка `https://t.me/` в `src/components/Footer.jsx`.
      Нужен реальный handle.
- [x] ~~**GSC: запросить индексацию 6 узбекских URL**~~ — ✅ 25.07, все 6 отправлены через
      «Проверка URL» → «Запросить индексирование» (`/uz/landing`, `.../features`, `.../roles`,
      `.../finance`, `.../gamification`, `.../contacts`).
- [x] ~~**GSC: запросить индексацию 2 URL тарифов**~~ — ✅ 25.07 проверено: `/landing/pricing`
      и `/uz/landing/pricing` **уже в индексе Google** («URL есть в индексе Google»), запрос
      не потребовался.
- [x] ~~**IndexNow: 2 URL «CRM вместо Excel»**~~ — ✅ 03.08. Блокер снят сам собой: страница
      **доехала в прод** (обе версии → 200). Перед пингом проверены все 28 URL из sitemap
      (`curl` каждого → 200) и ключ-файл на проде → 200. `npm run indexnow` → **HTTP 200 OK**,
      28 URL отправлены в Яндекс/Bing/Seznam/Naver.
- [ ] **GSC: запросить индексацию 2 URL «CRM вместо Excel»** (`/landing/crm-vs-excel`,
      `/uz/...`) — ручное действие в браузере, IndexNow Google не обслуживает.
- [x] ~~**Yandex: отправить sitemap**~~ — ✅ принят, 26 URL, валидатор без ошибок.
- [x] ~~**Yandex: указать регион «Узбекистан»»**~~ — ✅ 23.07 отправлен на модерацию, **✅ 25.07
      подтверждён** (Вебмастер → Представление в поиске → Региональность показывает
      «Узбекистан» + «Изменить регион», т.е. промодерирован). Это регион **Вебмастера**, отдельно
      от Яндекс Бизнеса — там региона всё ещё нет (см. пункт ниже, тот же блокер — адрес/телефон).
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
      в базе Яндекса). Перепроверено 25.07 — та же картина: висит, сайт всё ещё не в поисковой
      базе (Мониторинг важных страниц: все 14 URL — 200 OK при обходе, но «Страницы нет в
      поисковой базе»). Перепроверить снова после первой индексации.
- [x] ~~**После деплоя staff/member: проверить, что индексируется ТОЛЬКО `/login`**~~ — ✅ 03.08,
      **negative-lookahead в `vercel.json` работает как задумано**, проверено на живом проде:
      `staff/login` и `member/login` → 200 **без** `X-Robots-Tag`; `staff/` и `member/` → 200
      **с** `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
      Sitemap обоих хостов отдаёт ровно один URL — `/login`.
- [ ] **GSC: запросить индексацию `staff.../login` и `member.../login`** — ручное, в браузере.
      Технически всё готово (см. пункт выше).
- [ ] **Ссылки из каталогов** (доверие домену): SaaS-каталоги (Product Hunt и т.п.) + узбекские
      бизнес-справочники. Ручная работа. Без ссылок новые страницы поднимаются медленно.
      Тексты листингов готовы — [GEO-OFFSITE.md](./GEO-OFFSITE.md) →
      [DIRECTORY-LISTINGS.md](./DIRECTORY-LISTINGS.md). Yandex Бизнес/2GIS ждут адрес+телефон
      офиса; Crunchbase — год основания + размер команды. Остальное (Product Hunt, G2, Capterra,
      GetApp, SaaSHub, AlternativeTo, Slashdot) готово к подаче владельцем.
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
- **Носитель узбекского** — вычитать `i18n/uz.js` (теперь и блоки `pricing`, `vsExcel`).

---

## 🔗 Ссылки

- [SEO.md](./SEO.md) — как устроен prerender / i18n / hreflang (технический гайд)
- [GEO-OFFSITE.md](./GEO-OFFSITE.md) — off-site GEO/AEO задачи (соцсети, Reddit/Quora, каталоги, `sameAs`, мониторинг)
- Artifact «карта запросов и контент-план»: https://claude.ai/code/artifact/20e09347-5615-4df4-907e-bb44d7558438
- GSC: https://search.google.com/search-console?resource_id=sc-domain:levelup-academy.uz
- Bing: https://www.bing.com/webmasters
