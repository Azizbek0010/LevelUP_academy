import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, faqPage, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

export default function ForLanguageSchool() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.langSchool;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: s.badge, path: '/landing/for-language-school' },
        ],
        lang,
      ),
      faqPage(s.faq),
    ],
    [t.seo.breadcrumbHome, s, lang],
  );

  useSeo({
    title: t.seo.langSchool.title,
    description: t.seo.langSchool.description,
    path: '/landing/for-language-school',
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
            <h2>{s.fitHead}</h2>
            <p>{s.fitLead}</p>
          </div>
          <div className="cards-3">
            {s.fit.map((item) => (
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
        </div>
      </section>

      <section className="section section--white" id="faq">
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
