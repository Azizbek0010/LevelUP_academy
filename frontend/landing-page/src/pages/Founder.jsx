import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, useSeo, SITE_URL } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

// Личные контакты — только реальные значения, подтверждённые владельцем.
const TELEGRAM_URL = 'https://t.me/Azizbek2603';
const EMAIL = 'amangeldiev.azizbek.010@gmail.com';
const LINKEDIN_URL = 'https://www.linkedin.com/in/azizbek-amangeldiev-6045a342b';

/**
 * Персональная страница основателя — та же роль, что team-страницы вроде
 * wewatch.uz/team/<slug>: отдельный URL с именем + фото + био, который поисковик
 * может процитировать при запросе по имени. About.jsx даёт факт «есть такой
 * основатель», эта страница даёт содержание для карточки/AI Overview по имени.
 *
 * Карточки контактов/стека — .info-card (левое выравнивание, мягкая
 * icon-badge), а не общий .feature (центрированный, залитая иконка):
 * сознательно другой паттерн для «список фактов», подсмотренный на
 * tezcode.dev/ru/aloqa, а не переиспользование питчевых карточек с About.
 */
export default function Founder() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.founder;

  const contacts = [
    { icon: 'send', label: s.contactTelegramLabel, value: '@Azizbek2603', href: TELEGRAM_URL, note: s.contactTelegramNote },
    { icon: 'mail', label: s.contactEmailLabel, value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: 'linkedin', label: s.contactLinkedinLabel, value: 'in/azizbek-amangeldiev', href: LINKEDIN_URL },
  ];

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

            <div className="tag-row" style={{ justifyContent: 'flex-start' }}>
              {s.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
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
          <div className="section__head">
            <h2>{s.contactsHead}</h2>
            <p>{s.contactsLead}</p>
          </div>
          <div className="cards-3">
            {contacts.map((c) => (
              <a
                className="info-card"
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                style={{ display: 'block' }}
              >
                {c.note && (
                  <span className="badge badge--lime info-card__note">{c.note}</span>
                )}
                <div className="info-card__icon">
                  <Icon name={c.icon} />
                </div>
                <h3>{c.label}</h3>
                <p className="info-card__value">{c.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cards-3">
            {s.highlights.map((item) => (
              <article className="info-card" key={item.title}>
                <div className="info-card__icon">
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
            <h2>{s.stackHead}</h2>
            <p>{s.stackLead}</p>
          </div>
          <div className="cards-3">
            {s.stackGroups.map((group) => (
              <article className="info-card" key={group.label}>
                <div className="info-card__icon">
                  <Icon name={group.icon} />
                </div>
                <h3>{group.label}</h3>
                <div className="tag-row" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
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

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.bioHead}</h2>
          </div>
          <p className="pricing-note" style={{ maxWidth: 760, margin: '0 auto' }}>
            {s.bioText}
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.linksHead}</h2>
          </div>
          <div className="hero__actions" style={{ justifyContent: 'center' }}>
            {s.links.map((link) => (
              <Link to={lp(link.path)} className="btn btn--outline" key={link.path}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Cta title={t.about.ctaTitle} text={t.about.ctaText} />
    </main>
  );
}
