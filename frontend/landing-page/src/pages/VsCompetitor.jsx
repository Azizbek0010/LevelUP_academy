import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, faqPage, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

/**
 * Страница сравнения с конкретным конкурентом. Один компонент на все такие страницы:
 * структура у них общая, различаются только данные в словаре (`vsModme`, `vsUmai`).
 *
 * Правила, которым подчинён контент этих страниц:
 *
 * 1. **Только проверяемые факты.** Цены и функции конкурента взяты с его собственного
 *    сайта и датированы прямо на странице (`checkedNote`). Читатель должен иметь
 *    возможность перепроверить каждую цифру — иначе сравнение не стоит публиковать.
 * 2. **Есть блок «когда выбрать их».** Страница, которая утверждает, что мы лучше во
 *    всём, не читается как сравнение и не цитируется AI-поиском. Названные слабые места
 *    (нет мобильных приложений, нет воронок и рассылок) — настоящие.
 * 3. **Цены приводятся к одному знаменателю.** У конкурентов другой шаг оплаты
 *    (3 месяца, год), поэтому в таблице стоит и их исходная цена, и пересчёт в месяц.
 *
 * @param {{ dictKey: 'vsModme' | 'vsUmai', path: string }} props
 *   `path` — канонический путь страницы; он же ключ для sitemap и prerender.
 */
export default function VsCompetitor({ dictKey, path }) {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t[dictKey];

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: s.h1, path },
        ],
        lang,
      ),
      faqPage(s.faq),
    ],
    [t.seo.breadcrumbHome, s, path, lang],
  );

  useSeo({
    title: t.seo[dictKey].title,
    description: t.seo[dictKey].description,
    path,
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{s.badge}</span>
          <h1>{s.h1}</h1>
          <p>{s.lead}</p>
          <p className="pricing-note">{s.checkedNote}</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.priceHead}</h2>
            <p>{s.priceLead}</p>
          </div>
          <table className="compare">
            <thead>
              <tr>
                <th>{s.priceTable.param}</th>
                <th>{s.priceTable.us}</th>
                <th>{s.priceTable.them}</th>
              </tr>
            </thead>
            <tbody>
              {s.priceTable.rows.map((row) => (
                <tr key={row.task}>
                  <td data-label={s.priceTable.param}>{row.task}</td>
                  <td className="yes" data-label={s.priceTable.us}>
                    {row.before}
                  </td>
                  <td data-label={s.priceTable.them}>{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pricing-note" style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to={lp('/landing/pricing')}>{t.nav.pricing} →</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.compareHead}</h2>
          </div>
          <table className="compare">
            <thead>
              <tr>
                <th>{s.compare.task}</th>
                <th>{s.compare.before}</th>
                <th>{s.compare.after}</th>
              </tr>
            </thead>
            <tbody>
              {s.compare.rows.map((row) => (
                <tr key={row.task}>
                  <td data-label={s.compare.task}>{row.task}</td>
                  <td data-label={s.compare.before}>{row.before}</td>
                  <td data-label={s.compare.after}>{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.themHead}</h2>
            <p>{s.themLead}</p>
          </div>
          <div className="cards-3">
            {s.them.map((item) => (
              <article className="feature" key={item.title}>
                <div className="feature__icon">
                  <Icon name={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.usHead}</h2>
          </div>
          <div className="cards-2">
            {s.us.map((item) => (
              <article className="feature" key={item.title}>
                <div className="feature__icon">
                  <Icon name={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.faqHead}</h2>
          </div>
          <div className="faq" style={{ maxWidth: 760, margin: '0 auto' }}>
            {s.faq.map((f) => (
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

      <Cta title={s.ctaTitle} text={s.ctaText} />
    </main>
  );
}
