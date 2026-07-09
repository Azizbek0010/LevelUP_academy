import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <img src="/logo-white.svg" alt="LevelUp Academy" />
            <p>
              CRM для учебного центра: финансы, учёба и мотивация в одной
              системе.
            </p>
          </div>
          <div className="footer__col">
            <h4>Продукт</h4>
            <Link to="/landing/features">Возможности</Link>
            <Link to="/landing/roles">Роли</Link>
            <Link to="/landing/finance">Финансы</Link>
            <Link to="/landing/gamification">Мотивация</Link>
          </div>
          <div className="footer__col">
            <h4>Навигация</h4>
            <Link to="/landing">Главная</Link>
            <Link to="/landing/contacts">Контакты</Link>
            <Link to="/landing/contacts">Оставить заявку</Link>
          </div>
          <div className="footer__col">
            <h4>Связь</h4>
            <Link to="/landing/contacts">Написать нам</Link>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 LevelUp Academy. Все права защищены.</span>
          <span>Сделано в Узбекистане 🇺🇿</span>
        </div>
      </div>
    </footer>
  );
}
