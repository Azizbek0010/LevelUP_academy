import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import { SITE_URL, breadcrumb, useSeo } from '../lib/seo.js';
import { localizePath, useLang, useLocalizePath, useT } from '../i18n/index.js';

/** One content block: paragraph, subheading, or bullet list. */
function Block({ block }) {
  if (block.type === 'h2') return <h2>{block.text}</h2>;
  if (block.type === 'ul') {
    return (
      <ul>
        {block.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

export default function BlogArticle() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const { slug } = useParams();
  const b = t.blog;
  const article = b.articles[slug];
  const path = `/landing/blog/${slug}`;

  // Hooks run unconditionally; jsonLd is empty when the slug is unknown.
  const jsonLd = useMemo(() => {
    if (!article) return [];
    return [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: b.badge, path: '/landing/blog' },
          { name: article.title, path },
        ],
        lang,
      ),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.seoDescription,
        datePublished: article.date,
        dateModified: article.date,
        inLanguage: lang === 'uz' ? 'uz' : 'ru',
        author: { '@type': 'Organization', name: 'LevelUp Academy' },
        publisher: {
          '@type': 'Organization',
          name: 'LevelUp Academy',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: `${SITE_URL}${localizePath(path, lang)}`,
      },
    ];
  }, [article, b.badge, t.seo.breadcrumbHome, lang, path]);

  useSeo({
    title: article ? article.seoTitle : '',
    description: article ? article.seoDescription : '',
    path,
    jsonLd,
    noindex: !article,
  });

  // Unknown slug (client-side only — prerender never emits these): soft 404.
  if (!article) {
    return (
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="badge badge--lime">404</span>
            <h1>{t.notFound.h1}</h1>
            <p>{t.notFound.text}</p>
            <Link to={lp('/landing/blog')} className="btn btn--dark">
              {b.backToBlog}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <article className="article">
        <section className="page-hero">
          <div className="container">
            <div className="article__meta">
              {b.tocLabel}: {article.date} · {article.reading} {b.minutesLabel}
            </div>
            <h1>{article.title}</h1>
          </div>
        </section>

        <section className="section section--white">
          <div className="container">
            <div className="article__body">
              {article.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
            <div className="article__back">
              <Link to={lp('/landing/blog')}>{b.backToBlog}</Link>
            </div>
          </div>
        </section>
      </article>

      <Cta />
    </main>
  );
}
