import { useMemo } from 'react';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, faqPage, useSeo } from '../lib/seo.js';
import { useLang, useT } from '../i18n/index.js';

export default function Features() {
  const t = useT();
  const lang = useLang();
  const f = t.features;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: f.badge, path: '/landing/features' },
        ],
        lang,
      ),
      faqPage(f.faq),
    ],
    [t.seo.breadcrumbHome, f.badge, f.faq, lang],
  );

  useSeo({
    title: t.seo.features.title,
    description: t.seo.features.description,
    path: '/landing/features',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{f.badge}</span>
          <h1>{f.h1}</h1>
          <p>{f.lead}</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="cards-3">
            {f.modules.map((m) => (
              <article className="feature" key={m.title}>
                <div className="feature__icon">
                  <Icon name={m.icon} />
                </div>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
                <div className="tag-row" style={{ marginTop: 14 }}>
                  {m.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{f.flowHead}</h2>
            <p>{f.flowLead}</p>
          </div>
          <div className="steps">
            {f.flow.map((s) => (
              <article className="step" key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{f.faqHead}</h2>
          </div>
          <div className="faq">
            {f.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Cta title={f.ctaTitle} text={f.ctaText} />
    </main>
  );
}
