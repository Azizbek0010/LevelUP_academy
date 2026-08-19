import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, useSeo, SITE_URL } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

// Личные контакты — только реальные значения, заполняются по мере подтверждения.
// null → кнопка не рендерится, вместо выдуманной ссылки.
const TELEGRAM_URL = 'https://t.me/Azizbek2603';
const EMAIL = 'amangeldiev.azizbek.010@gmail.com';
const LINKEDIN_URL = 'https://www.linkedin.com/in/azizbek-amangeldiev-6045a342b';

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
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="badge badge--lime">{s.badge}</span>
            <h1>{s.h1}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 18px' }}>
              {s.subName} <span aria-hidden="true">·</span>
              <Icon name="pin" size={15} /> {s.location}
            </p>
            <p className="hero__lead">{s.lead}</p>

            <div className="tag-row" style={{ justifyContent: 'flex-start', marginBottom: 26 }}>
              {s.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className="hero__actions">
              {TELEGRAM_URL && (
                <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="btn btn--dark">
                  <Icon name="send" size={17} />
                  {s.contactTelegram}
                </a>
              )}
              {EMAIL && (
                <a href={`mailto:${EMAIL}`} className="btn btn--outline">
                  <Icon name="mail" size={17} />
                  {s.contactEmail}
                </a>
              )}
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="btn btn--outline">
                <Icon name="linkedin" size={17} />
                LinkedIn
              </a>
            </div>
          </div>

          <div className="dash" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            <img
              src="/team/azizbek-amangeldiev.png"
              alt={s.h1}
              width={640}
              height={520}
              style={{ width: '100%', height: 420, objectFit: 'cover', display: 'block' }}
            />
            <span
              className="badge"
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                background: 'rgba(20, 24, 16, 0.72)',
                color: '#fff',
                border: 'none',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Icon name="pin" size={15} />
              {s.location}
            </span>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="cards-3">
            {s.highlights.map((item) => (
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
            <h2>{s.stackHead}</h2>
            <p>{s.stackLead}</p>
          </div>
          <div className="cards-3">
            {s.stackGroups.map((group) => (
              <article className="feature" key={group.label}>
                <h3>{group.label}</h3>
                <div className="tag-row" style={{ marginTop: 10 }}>
                  {group.items.map((item) => (
                    <span className="tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
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
