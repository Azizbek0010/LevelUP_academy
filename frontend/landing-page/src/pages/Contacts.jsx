import { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { breadcrumb, useSeo } from '../lib/seo.js';
import { trackEvent } from '../lib/analytics.js';
import { useLang, useT } from '../i18n/index.js';

// в dev — vite-прокси на :4000; в prod задаётся VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL ?? '';

export default function Contacts() {
  const t = useT();
  const lang = useLang();
  const c = t.contacts;

  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const jsonLd = useMemo(
    () => [
      breadcrumb(
        [
          { name: t.seo.breadcrumbHome, path: '/landing' },
          { name: c.badge, path: '/landing/contacts' },
        ],
        lang,
      ),
    ],
    [t.seo.breadcrumbHome, c.badge, lang],
  );

  useSeo({
    title: t.seo.contacts.title,
    description: t.seo.contacts.description,
    path: '/landing/contacts',
    jsonLd,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const lead = { name: form.get('name').trim(), phone: form.get('phone').trim() };
    const centerName = form.get('center').trim();
    const centerSize = form.get('size');
    const message = form.get('msg').trim();
    if (centerName) lead.centerName = centerName;
    if (centerSize) lead.centerSize = centerSize;
    if (message) lead.message = message;

    setStatus('sending');
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!res.ok) {
        setError(res.status === 429 ? c.form.errorRate : c.form.errorGeneric);
        setStatus('error');
        return;
      }
      setStatus('sent');
      // GA4 conversion: mark this as a lead in Analytics (set as a key event in GA4).
      trackEvent('generate_lead', {
        method: 'landing_form',
        center_size: centerSize || undefined,
      });
    } catch {
      setError(c.form.errorNetwork);
      setStatus('error');
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">{c.badge}</span>
          <h1>{c.h1}</h1>
          <p>{c.lead}</p>
          <div className="trial-note">
            <Icon name="check" size={16} />
            {t.common.trial}
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <div>
              <label htmlFor="name">{c.form.name}</label>
              <input id="name" name="name" placeholder={c.form.namePlaceholder} required />
            </div>
            <div>
              <label htmlFor="phone">{c.form.phone}</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+998 90 000 00 00"
                required
              />
            </div>
            <div>
              <label htmlFor="center">{c.form.center}</label>
              <input id="center" name="center" placeholder={c.form.centerPlaceholder} />
            </div>
            <div>
              <label htmlFor="size">{c.form.size}</label>
              <select id="size" name="size" defaultValue="">
                <option value="" disabled>
                  {c.form.sizePlaceholder}
                </option>
                {c.form.sizeOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="msg">{c.form.message}</label>
              <textarea id="msg" name="msg" placeholder={c.form.messagePlaceholder} />
            </div>
            {status === 'sent' ? (
              <div className="form-success">{c.form.success}</div>
            ) : (
              <>
                {error && <div className="form-error">{error}</div>}
                <button
                  type="submit"
                  className="btn btn--accent btn--lg"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? c.form.sending : c.form.submit}
                </button>
              </>
            )}
            <p className="form-note">{c.form.note}</p>
          </form>

          <div className="contact-info">
            {c.info.map((item) => (
              <div className="big-card" key={item.title}>
                <h3>
                  <Icon name={item.icon} size={18} /> {item.title}
                </h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
