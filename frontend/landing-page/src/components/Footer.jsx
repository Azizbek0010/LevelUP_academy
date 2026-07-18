import { Link } from 'react-router-dom';
import { useLocalizePath, useT } from '../i18n/index.js';

export default function Footer() {
  const t = useT();
  const lp = useLocalizePath();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src="/logo-white.svg" alt="LevelUp Academy" width="168" height="30" />
            <p>{t.footer.tagline}</p>
          </div>
          <div className="footer__col">
            <h4>{t.footer.product}</h4>
            <Link to={lp('/landing/features')}>{t.nav.features}</Link>
            <Link to={lp('/landing/roles')}>{t.nav.roles}</Link>
            <Link to={lp('/landing/finance')}>{t.nav.finance}</Link>
            <Link to={lp('/landing/gamification')}>{t.nav.gamification}</Link>
            <Link to={lp('/landing/pricing')}>{t.nav.pricing}</Link>
            <Link to={lp('/landing/for-language-school')}>{t.nav.langSchool}</Link>
            <Link to={lp('/landing/for-courses')}>{t.nav.courses}</Link>
            <Link to={lp('/landing/blog')}>{t.nav.blog}</Link>
          </div>
          <div className="footer__col">
            <h4>{t.footer.navigation}</h4>
            <Link to={lp('/landing')}>{t.nav.home}</Link>
            <Link to={lp('/landing/contacts')}>{t.nav.contacts}</Link>
            <Link to={lp('/landing/contacts')}>{t.footer.leaveRequest}</Link>
          </div>
          <div className="footer__col">
            <h4>{t.footer.contact}</h4>
            <Link to={lp('/landing/contacts')}>{t.footer.writeUs}</Link>
            <a href="https://t.me/levelupacademycrm" target="_blank" rel="noreferrer">
              Telegram
            </a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>{t.footer.rights}</span>
          <span>{t.footer.madeIn}</span>
        </div>
      </div>
    </footer>
  );
}
