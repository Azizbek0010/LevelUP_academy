import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import { breadcrumb, useSeo, SITE_URL } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

/**
 * Персональная страница основателя — та же роль, что team-страницы вроде
 * wewatch.uz/team/<slug>: отдельный URL с именем + фото + био, который поисковик
 * может процитировать при запросе по имени. About.jsx даёт факт «есть такой
 * основатель», эта страница даёт содержание для карточки/AI Overview по имени.
 */
export default function Founder() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.founder;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: t.about.badge, path: '/landing/about' },
          { name: s.h1, path: '/landing/team/azizbek-amangeldiev' },
        ],
        lang,
      ),
      {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/landing/team/azizbek-amangeldiev#profile`,
        mainEntity: { '@id': `${SITE_URL}/#founder` },
      },
    ],
    [t.seo.breadcrumbHome, t.about.badge, s.h1, lang],
  );

  useSeo({
    title: t.seo.founder.title,
    description: t.seo.founder.description,
    path: '/landing/team/azizbek-amangeldiev',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{s.badge}</span>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', marginTop: 24 }}>
            <img
              src="/team/azizbek-amangeldiev.png"
              alt={s.h1}
              width={160}
              height={160}
              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <h1 style={{ marginBottom: 4 }}>{s.h1}</h1>
              <p className="pricing-note" style={{ margin: 0 }}>
                {s.subName} · {s.location}
              </p>
              <p style={{ maxWidth: 620, marginTop: 16 }}>{s.lead}</p>
              <div className="tag-row" style={{ marginTop: 14 }}>
                {s.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.bioHead}</h2>
          </div>
          <p className="pricing-note" style={{ maxWidth: 760, margin: '0 auto' }}>
            {s.bioText}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.linksHead}</h2>
          </div>
          <ul className="checklist" style={{ maxWidth: 520, margin: '0 auto' }}>
            {s.links.map((link) => (
              <li key={link.path}>
                <Link to={lp(link.path)}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Cta title={t.about.ctaTitle} text={t.about.ctaText} />
    </main>
  );
}
