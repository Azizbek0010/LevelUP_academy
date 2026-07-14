import { createContext, useContext, useEffect } from 'react';

// Боевой домен лендинга — база для canonical, og:url, sitemap.
export const SITE_URL = 'https://levelup-academy.uz';
export const OG_IMAGE = `${SITE_URL}/og-cover.png`;

/**
 * Канал сбора SEO во время серверного рендера (prerender).
 * На клиенте провайдера нет → значение null → сбор не выполняется, работает только DOM-ветка.
 * На сервере entry-server кладёт сюда объект-приёмник и после renderToString читает из него
 * то, что объявила отрисованная страница.
 */
export const SeoCollectorContext = createContext(null);

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

function removeCanonical() {
  document.head.querySelector('link[rel="canonical"]')?.remove();
}

/**
 * Client-side per-route SEO: обновляет title, description, canonical и
 * переменную часть Open Graph / Twitter. Статический baseline (og:image,
 * og:type, twitter:card и JSON-LD Organization/WebSite/SoftwareApplication)
 * живёт в index.html — его видят соц-скраперы без JS.
 *
 * @param {{ title:string, description:string, path:string, jsonLd?:object[], noindex?:boolean }} opts
 *   jsonLd должен быть стабильной ссылкой (объявлять на уровне модуля страницы),
 *   иначе effect будет перезапускаться каждый рендер.
 *   noindex — страница не должна попасть в индекс (клиентский 404): робот получает
 *   noindex, а canonical снимается, т.к. указывать его на несуществующий URL нельзя.
 */
export function useSeo({ title, description, path, jsonLd, noindex = false }) {
  // Серверная ветка: useEffect при renderToString не выполняется, поэтому единственный
  // момент, когда страница может сообщить о себе, — сам рендер. Запись безопасна: приёмник
  // существует только внутри одного prerender-прохода и на клиенте всегда null.
  const collector = useContext(SeoCollectorContext);
  if (collector) collector.seo = { title, description, path, jsonLd, noindex };

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
    // Выставляется на каждом роуте, а не только на noindex-странице: иначе уход
    // с 404 на обычную страницу оставил бы noindex висеть в <head>.
    setMetaName('robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
    if (noindex) removeCanonical();
    else setCanonical(url);
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
  }, [title, description, path, jsonLd, noindex]);
}

const escapeAttr = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Собранный на сервере SEO → готовые теги для <head> статической страницы.
 * Клиентский useSeo делает ровно то же самое, но через DOM: списки тегов обязаны
 * совпадать, иначе гидратация даст странице другой <head>, чем видел краулер.
 *
 * Только переменная часть. Постоянная (og:image, og:type, twitter:card, JSON-LD @graph)
 * живёт статикой в index.html и здесь не дублируется.
 */
export function renderSeoHead(seo) {
  if (!seo) return '';
  const { title, description, path, jsonLd, noindex = false } = seo;
  const url = `${SITE_URL}${path}`;
  const tags = [];

  if (title) {
    tags.push(`<title>${escapeAttr(title)}</title>`);
    tags.push(`<meta property="og:title" content="${escapeAttr(title)}" />`);
    tags.push(`<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  }
  if (description) {
    tags.push(`<meta name="description" content="${escapeAttr(description)}" />`);
    tags.push(`<meta property="og:description" content="${escapeAttr(description)}" />`);
    tags.push(`<meta name="twitter:description" content="${escapeAttr(description)}" />`);
  }

  tags.push(
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
  );
  // canonical на несуществующий URL указывать нельзя — см. noindex в useSeo.
  if (!noindex) tags.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);
  tags.push(`<meta property="og:url" content="${escapeAttr(url)}" />`);

  for (const obj of jsonLd ?? []) {
    // </script> внутри JSON закрыл бы тег раньше времени.
    const json = JSON.stringify(obj).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json" data-seo-jsonld>${json}</script>`);
  }

  return tags.join('\n    ');
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
