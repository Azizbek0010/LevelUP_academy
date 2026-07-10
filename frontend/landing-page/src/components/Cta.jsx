import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function Cta({
  title = 'Готовы навести порядок в центре?',
  text = 'Подключите LevelUp Academy и перенесите платежи, учёбу и мотивацию в одну систему уже сегодня.',
}) {
  return (
    <section className="cta">
      <div className="container">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link to="/landing/contacts" className="btn btn--dark btn--lg">
          Связаться с нами
        </Link>
        <div className="trial-note trial-note--cta">
          <Icon name="check" size={16} />
          Первая неделя — бесплатно, без карты и обязательств
        </div>
      </div>
    </section>
  );
}
