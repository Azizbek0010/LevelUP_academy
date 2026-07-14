import { useMemo } from 'react';
import Cta from '../components/Cta.jsx';
import { breadcrumb, useSeo } from '../lib/seo.js';
import { useLang, useT } from '../i18n/index.js';

export default function Roles() {
  const t = useT();
  const lang = useLang();
  const r = t.roles;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: r.badge, path: '/landing/roles' },
        ],
        lang,
      ),
    ],
    [t.seo.breadcrumbHome, r.badge, lang],
  );

  useSeo({
    title: t.seo.roles.title,
    description: t.seo.roles.description,
    path: '/landing/roles',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{r.badge}</span>
          <h1>{r.h1}</h1>
          <p>{r.lead}</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="cards-2">
            {r.items.map((item) => (
              <article className="big-card" key={item.tag}>
                <div className="role__avatar">{item.tag}</div>
                <h3 style={{ marginTop: 12 }}>{item.title}</h3>
                <p>{item.text}</p>
                <ul className="checklist">
                  {item.list.map((li) => (
                    <li key={li}>
                      <span className="tick">✓</span>
                      {li}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{r.howHead}</h2>
            <p>{r.howLead}</p>
          </div>
          <div className="steps">
            {r.how.map((s) => (
              <article className="step" key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Cta title={r.ctaTitle} text={r.ctaText} />
    </main>
  );
}
