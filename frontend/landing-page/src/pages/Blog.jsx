import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import { breadcrumb, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

export default function Blog() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const b = t.blog;
  const entries = Object.entries(b.articles);

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: b.badge, path: '/landing/blog' },
        ],
        lang,
      ),
    ],
    [t.seo.breadcrumbHome, b.badge, lang],
  );

  useSeo({
    title: t.seo.blog.title,
    description: t.seo.blog.description,
    path: '/landing/blog',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{b.badge}</span>
          <h1>{b.h1}</h1>
          <p>{b.lead}</p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="blog-list">
            {entries.map(([slug, a]) => (
              <article className="blog-card" key={slug}>
                <div className="blog-card__meta">
                  {a.date} · {a.reading} {b.minutesLabel}
                </div>
                <h2 className="blog-card__title">
                  <Link to={lp(`/landing/blog/${slug}`)}>{a.title}</Link>
                </h2>
                <p className="blog-card__excerpt">{a.excerpt}</p>
                <Link to={lp(`/landing/blog/${slug}`)} className="blog-card__more">
                  {b.readMore} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Cta />
    </main>
  );
}
