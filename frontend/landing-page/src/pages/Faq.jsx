import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import { breadcrumb, faqPage, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

/**
 * Хаб вопросов-ответов — точка входа для AI-поиска: ассистент цитирует прямой ответ
 * на прямой вопрос, а не абзац продающего текста.
 *
 * ⚠️ Вопросы здесь намеренно НЕ повторяют шесть существующих FAQ-блоков (главная,
 * возможности, тарифы, языковая школа, курсы, CRM вместо Excel). Дубль вопроса означал бы
 * две страницы сайта, конкурирующие за один запрос, и два FAQPage с одинаковым
 * `Question` в разметке. Темы, уже закрытые теми страницами, вынесены в блок ссылок ниже.
 *
 * Ответы опираются на реальное поведение системы: блокировка при просрочке —
 * `backend/src/middlewares/paymentGate.js`, логин-код и пароль —
 * `backend/src/modules/auth/credentials.js`, одноразовая ссылка привязки —
 * `backend/src/modules/telegram/constants.js`.
 */
export default function Faq() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.faqHub;

  // FAQPage объявляет плоский список: группировка нужна человеку на странице,
  // разметке — только пары «вопрос-ответ».
  const items = useMemo(() => s.groups.flatMap((g) => g.items), [s.groups]);

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: s.badge, path: '/landing/faq' },
        ],
        lang,
      ),
      faqPage(items),
    ],
    [t.seo.breadcrumbHome, s.badge, items, lang],
  );

  useSeo({
    title: t.seo.faqHub.title,
    description: t.seo.faqHub.description,
    path: '/landing/faq',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{s.badge}</span>
          <h1>{s.h1}</h1>
          <p>{s.lead}</p>
          <p className="pricing-note">{s.intro}</p>
        </div>
      </section>

      {s.groups.map((group, gi) => (
        <section className={gi % 2 === 0 ? 'section section--white' : 'section'} key={group.title}>
          <div className="container">
            <div className="section__head">
              <h2>{group.title}</h2>
            </div>
            <div className="faq" style={{ maxWidth: 760, margin: '0 auto' }}>
              {group.items.map((f) => (
                <details
                  key={f.q}
                  style={{
                    border: '1px solid var(--border, #E6EDD8)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    marginBottom: 12,
                    background: '#fff',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 700, listStyle: 'none' }}>
                    {f.q}
                  </summary>
                  <p style={{ marginTop: 10, color: 'var(--muted, #5E6E52)', lineHeight: 1.6 }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Нечётное число групп выше оставляет последней белую секцию — этот блок идёт
          на обычном фоне, чтобы две белые полосы не слиплись в одну. */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.moreHead}</h2>
          </div>
          <ul className="checklist" style={{ maxWidth: 520, margin: '0 auto' }}>
            {s.more.map((link) => (
              <li key={link.path}>
                <Link to={lp(link.path)}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Cta title={s.ctaTitle} text={s.ctaText} />
    </main>
  );
}
