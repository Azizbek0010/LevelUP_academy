import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, useSeo } from '../lib/seo.js';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';

/**
 * Страница «О компании» — базовая для E-E-A-T: до неё сайт нигде не отвечал на вопрос
 * «кто за этим стоит».
 *
 * Все факты берутся из DIRECTORY-LISTINGS.md (единый источник для сайта и каталогов):
 * 2026 год, 6 человек, Узбекистан, почта и соцсети. С 20.08.2026 добавлен реальный
 * основатель (Azizbek Amangeldiev, по его прямой просьбе) — прежний принцип
 * «выдуманные имена вредят доверию сильнее, чем их отсутствие» был про фиктивные
 * персоналии, а не про запрет указывать настоящего фаундера.
 *
 * Блок «Нас часто путают» повторяет `disambiguatingDescription` из index.html человеческим
 * текстом: разметку читает поисковик, а цитирует AI то, что написано на странице.
 */
export default function About() {
  const t = useT();
  const lang = useLang();
  const lp = useLocalizePath();
  const s = t.about;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: s.badge, path: '/landing/about' },
        ],
        lang,
      ),
    ],
    [t.seo.breadcrumbHome, s.badge, lang],
  );

  useSeo({
    title: t.seo.about.title,
    description: t.seo.about.description,
    path: '/landing/about',
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
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.whyHead}</h2>
            <p>{s.whyLead}</p>
          </div>
          <div className="cards-3">
            {s.why.map((item) => (
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
            <h2>{s.principlesHead}</h2>
            <p>{s.principlesLead}</p>
          </div>
          <div className="cards-2">
            {s.principles.map((item) => (
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

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{s.factsHead}</h2>
            <p>{s.factsLead}</p>
          </div>
          <table className="compare">
            <tbody>
              {s.facts.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{s.sameHead}</h2>
          </div>
          <p className="pricing-note" style={{ maxWidth: 760, margin: '0 auto' }}>
            {s.sameText}
          </p>
        </div>
      </section>

      <section className="section section--white">
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

      <Cta title={s.ctaTitle} text={s.ctaText} />
    </main>
  );
}
