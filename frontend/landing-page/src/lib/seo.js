import { useEffect } from 'react';

// Боевой домен лендинга — база для canonical, og:url, sitemap.
export const SITE_URL = 'https://levelup-academy.uz';
export const OG_IMAGE = `${SITE_URL}/og-cover.png`;

function upsert(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMetaName(name, content) {
  const el = upsert(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  });
  el.setAttribute('content', content);
}

function setMetaProp(property, content) {
  const el = upsert(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    return m;
  });
  el.setAttribute('content', content);
}

function setCanonical(href) {
  const el = upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  });
  el.setAttribute('href', href);
}

/**
 * Client-side per-route SEO: обновляет title, description, canonical и
 * переменную часть Open Graph / Twitter. Статический baseline (og:image,
 * og:type, twitter:card и JSON-LD Organization/WebSite/SoftwareApplication)
 * живёт в index.html — его видят соц-скраперы без JS.
 *
 * @param {{ title:string, description:string, path:string, jsonLd?:object[] }} opts
 *   jsonLd должен быть стабильной ссылкой (объявлять на уровне модуля страницы),
 *   иначе effect будет перезапускаться каждый рендер.
 */
export function useSeo({ title, description, path, jsonLd }) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    if (title) {
      document.title = title;
      setMetaProp('og:title', title);
      setMetaName('twitter:title', title);
    }
    if (description) {
      setMetaName('description', description);
      setMetaProp('og:description', description);
      setMetaName('twitter:description', description);
    }
    setCanonical(url);
    setMetaProp('og:url', url);

    const nodes = (jsonLd ?? []).map((obj) => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.setAttribute('data-seo-jsonld', '');
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
      return s;
    });

    return () => nodes.forEach((n) => n.remove());
  }, [title, description, path, jsonLd]);
}

/** BreadcrumbList JSON-LD из пар { name, path }. */
export function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
