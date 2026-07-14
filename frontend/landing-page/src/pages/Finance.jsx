import { useMemo } from 'react';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { breadcrumb, useSeo } from '../lib/seo.js';
import { useLang, useT } from '../i18n/index.js';

export default function Finance() {
  const t = useT();
  const lang = useLang();
  const f = t.finance;

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: f.badge, path: '/landing/finance' },
        ],
        lang,
      ),
    ],
    [t.seo.breadcrumbHome, f.badge, lang],
  );

  useSeo({
    title: t.seo.finance.title,
    description: t.seo.finance.description,
    path: '/landing/finance',
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
          <div className="section__head">
            <h2>{f.payHead}</h2>
            <p>{f.payLead}</p>
          </div>
          <div className="cards-3">
            {f.pay.map((p) => (
              <article className="feature" key={p.title}>
                <div className="feature__icon">
                  <Icon name={p.icon} />
                </div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{f.debtHead}</h2>
            <p>{f.debtLead}</p>
          </div>
          <div className="steps">
            {f.debt.map((d) => (
              <article className="step" key={d.title}>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>{f.compareHead}</h2>
          </div>
          <table className="compare">
            <thead>
              <tr>
                <th>{f.compare.task}</th>
                <th>{f.compare.before}</th>
                <th>{f.compare.after}</th>
              </tr>
            </thead>
            <tbody>
              {f.compare.rows.map((row) => (
                <tr key={row.task}>
                  <td data-label={f.compare.task}>{row.task}</td>
                  <td className="no" data-label={f.compare.before}>
                    {row.before}
                  </td>
                  <td className="yes" data-label={f.compare.after}>
                    {row.after}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>{f.safetyHead}</h2>
            <p>{f.safetyLead}</p>
          </div>
          <div className="cards-3">
            {f.safety.map((s) => (
              <article className="feature" key={s.title}>
                <div className="feature__icon">
                  <Icon name={s.icon} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Cta title={f.ctaTitle} text={f.ctaText} />
    </main>
  );
}
