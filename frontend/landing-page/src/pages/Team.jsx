import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import { useLang, useLocalizePath, useT } from '../i18n/index.js';
import { breadcrumb, SITE_URL, useSeo } from '../lib/seo.js';

const MEMBERS = [
  { rank: '01', name: 'Azizbek', fullName: 'Azizbek Amangeldiev', role: 'Team Lead · Full-stack', tasks: '129', initials: 'AA', photo: '/team/azizbek-amangeldiev.png', photoClass: 'team-photo--amangeldiev', path: '/landing/team/azizbek-amangeldiev', areas: ['Architecture', 'Backend', 'Frontend', 'Billing'] },
  { rank: '02', name: 'Abdulaziz', fullName: 'Abdulaziz Yakubov', role: 'Backend engineer · SEO', tasks: '84', initials: 'AY', areas: ['Infrastructure', 'Mentor API', 'Student API', 'Parent API'] },
  { rank: '03', name: 'Abdulloh', fullName: 'Yunusov Abdulloh', role: 'Frontend engineer', tasks: '87+', initials: 'YA', photo: '/team/yunusov-abdulloh.jpg', photoClass: 'team-photo--abdulloh', path: '/landing/team/yunusov-abdulloh', areas: ['Admin cabinet', 'Full frontend access', 'i18n', 'Vite apps'] },
  { rank: '04', name: 'Azizbek', fullName: 'Azizbek Bokhodirov', role: 'Frontend engineer', tasks: '10+', initials: 'AB', photo: '/team/azizbek-bokhodirov.jpg', photoClass: 'team-photo--bokhodirov', areas: ['Finance manager', 'UI/UX'] },
  { rank: '05', name: 'Elyor', fullName: 'Elyor', role: 'Frontend engineer', tasks: '10+', initials: 'EL', areas: ['Authentication', 'SPA shell', 'API interceptors'] },
  { rank: '06', name: 'Odil', fullName: 'Odil', role: 'Frontend engineer', tasks: '17+', initials: 'OD', areas: ['Student', 'Admin', 'Design system'] },
];

const COPY = {
  ru: { badge: 'КОМАНДА LEVELUP ACADEMY', title: 'Команда LevelUp Academy', seoTitle: 'Команда LevelUp Academy — разработчики CRM', lead: 'Команда LevelUp Academy — шесть специалистов, которые создают и развивают CRM-систему для учебных центров.', seoDescription: 'Команда LevelUp Academy: разработчики и специалисты, которые создают CRM для учебных центров. Участники, роли, вклад и персональные профили.', tasks: 'задач', note: 'Показан подтверждённый минимум выполненных задач', profile: 'Открыть профиль', areas: 'Зона вклада' },
  uz: { badge: 'LEVELUP ACADEMY JAMOASI', title: 'LevelUp Academy jamoasi', seoTitle: 'LevelUp Academy jamoasi — CRM dasturchilari', lead: "LevelUp jamoasi — o‘quv markazlari uchun CRM tizimini yaratayotgan va rivojlantirayotgan olti nafar mutaxassis.", seoDescription: "LevelUp Academy jamoasi: o‘quv markazlari uchun CRM yaratayotgan dasturchilar va mutaxassislar. Jamoa a'zolari, vazifalari va profillari.", tasks: 'task', note: "Bajarilgan tasklarning tasdiqlangan minimumi ko'rsatilgan", profile: "Profilni ko'rish", areas: 'Hissa yo‘nalishi' },
  en: { badge: 'LEVELUP ACADEMY TEAM', title: 'LevelUp Academy team', seoTitle: 'LevelUp Academy team — CRM developers', lead: 'The LevelUp team is a group of six specialists building and developing a CRM system for education centers.', seoDescription: 'Meet the LevelUp Academy team: developers and specialists building a CRM for education centers. Team members, roles, contributions and profiles.', tasks: 'tasks', note: 'The verified minimum of completed tasks is shown', profile: 'View profile', areas: 'Contribution area' },
};

const TEAM_ALIASES = [
  'Команда LevelUp Academy',
  'Команда LevelUp',
  'LevelUp Academy jamoasi',
  'LevelUp jamoasi',
  'LevelUp Academy team',
  'LevelUp team',
];

export default function Team() {
  const lang = useLang();
  const lp = useLocalizePath();
  const t = useT();
  const c = COPY[lang] || COPY.ru;

  const jsonLd = useMemo(() => [
    breadcrumb([
      { name: t.seo.breadcrumbHome, path: '/landing' },
      { name: c.title, path: '/landing/team' },
    ], lang),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/landing/team#page`,
      url: `${SITE_URL}/landing/team`,
      name: c.title,
      alternateName: TEAM_ALIASES,
      description: c.seoDescription,
      about: { '@id': `${SITE_URL}/#organization` },
      mainEntity: {
        '@type': 'ItemList',
        name: c.title,
        numberOfItems: MEMBERS.length,
        itemListElement: MEMBERS.map((member, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Person',
            name: member.fullName,
            jobTitle: member.role,
            ...(member.path ? { url: `${SITE_URL}${member.path}` } : {}),
          },
        })),
      },
    },
  ], [c.seoDescription, c.title, lang, t.seo.breadcrumbHome]);

  useSeo({ title: c.seoTitle, description: c.seoDescription, path: '/landing/team', jsonLd });

  return (
    <main className="team-page">
      <section className="team-hero">
        <div className="container team-hero__inner">
          <div><span className="team-kicker">{c.badge}</span><h1>{c.title}</h1></div>
          <div className="team-hero__intro"><p>{c.lead}</p><span>{c.note}</span></div>
        </div>
      </section>

      <section className="team-list-section">
        <div className="container team-grid">
          {MEMBERS.map((member, index) => {
            const card = (
              <article className={`team-card${index === 0 ? ' team-card--lead' : ''}`}>
                <div className="team-card__top"><span>{member.rank}</span><strong>{member.tasks} <small>{member.metricLabel || c.tasks}</small></strong></div>
                <div className="team-card__avatar">
                  {member.photo ? <img className={member.photoClass || ''} src={member.photo} alt={member.fullName} width="480" height="560" /> : <span>{member.initials}</span>}
                </div>
                <div className="team-card__body"><span>{member.role}</span><h2>{member.name}</h2><p>{member.fullName}</p></div>
                <div className="team-card__areas"><small>{c.areas}</small><div>{member.areas.map((area) => <span key={area}>{area}</span>)}</div></div>
                {member.path && <span className="team-card__link">{c.profile} ↗</span>}
              </article>
            );
            return member.path ? <Link to={lp(member.path)} key={member.name}>{card}</Link> : <div key={member.name}>{card}</div>;
          })}
        </div>
      </section>
      <Cta title={t.about.ctaTitle} text={t.about.ctaText} />
    </main>
  );
}
