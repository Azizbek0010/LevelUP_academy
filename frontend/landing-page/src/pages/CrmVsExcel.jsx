import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, faqPage, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

/**
 * Коммерческая страница сравнения «Excel или CRM».
 *
 * Намеренно отделена от статьи /landing/blog/excel-to-crm: та отвечает на «как перейти»
 * (информационный запрос, пошаговый гайд), эта — на «чем заменить и стоит ли»
 * (коммерческий). Разные title/description и перекрёстная ссылка ниже держат их
 * в разных выдачах: две страницы под один запрос конкурировали бы между собой.
 */
export default function CrmVsExcel() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.vsExcel;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: s.badge, path: '/landing/crm-vs-excel' },
        ],
        lang,
      ),
      faqPage(s.faq),
    ],
    [t.seo.breadcrumbHome, s, lang],
  );

  useSeo({
    title: t.seo.vsExcel.title,
    description: t.seo.vsExcel.description,
    path: '/landing/crm-vs-excel',
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
          <p className="pricing-note">
            <Link to={lp('/landing/pricing')}>{s.pricingLink} →</Link>
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.painHead}</h2>
            <p>{s.painLead}</p>
          </div>
          <div className="cards-3">
            {s.pain.map((item) => (
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
                  <td className="no" data-label={s.compare.before}>
                    {row.before}
                  </td>
                  <td className="yes" data-label={s.compare.after}>
                    {row.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.howHead}</h2>
            <p>{s.howLead}</p>
          </div>
          <div className="steps">
            {s.how.map((item) => (
              <article className="step" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className="pricing-note" style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to={lp('/landing/blog/excel-to-crm')}>{s.guideLink} →</Link>
          </p>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="container">
          <div className="section__head">
            <h2>{s.faqHead}</h2>
          </div>
          <div className="faq" style={{ maxWidth: 760, margin: '0 auto' }}>
            {s.faq.map((f, i) => (
              <details
                key={i}
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
