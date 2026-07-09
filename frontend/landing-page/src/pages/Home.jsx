import { Link } from 'react-router-dom';
import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';

const features = [
  {
    icon: 'coin',
    title: 'Финансы под контролем',
    text: 'Сплит-платежи (нал + карта), инвойсы и чеки. Долги и выручка обновляются в реальном времени.',
  },
  {
    icon: 'check',
    title: 'Посещаемость',
    text: 'Davomat: журнал ментора и история для родителя. Пропуск — авто-уведомление в Telegram.',
  },
  {
    icon: 'clock',
    title: 'Экзамены с таймером',
    text: 'Конструктор тестов, серверный дедлайн и авто-сабмит. Оценка по прозрачной шкале 0–100.',
  },
  {
    icon: 'star',
    title: 'Мотивация',
    text: 'Коины за успеваемость и активность, магазин наград и лидерборды недели и месяца. История коинов — append-only.',
  },
  {
    icon: 'chat',
    title: 'Realtime-чаты',
    text: 'Общий чат центра и прямой канал родитель и администратор. Live-присутствие и мгновенная доставка.',
  },
  {
    icon: 'grid',
    title: 'Отчёты и роли',
    text: 'Выручка, долги, зарплаты менторов. RBAC на 5 ролей и мультифилиальность с первого дня.',
  },
];

const roles = [
  {
    tag: 'SA',
    title: 'SuperAdmin',
    text: 'Вся сеть филиалов и глобальные отчёты без branch-фильтра.',
  },
  {
    tag: 'A',
    title: 'Admin',
    text: 'Платежи, группы, ученики и отчёты своего филиала.',
  },
  {
    tag: 'M',
    title: 'Ментор',
    text: 'Davomat, проверка ДЗ, коины, экзамены и своя зарплата.',
  },
  {
    tag: 'P',
    title: 'Родитель',
    text: 'Успеваемость ребёнка, посещаемость, долг и прямой чат.',
  },
  {
    tag: 'S',
    title: 'Ученик',
    text: 'Тесты, ДЗ, видео, магазин за коины и лидерборд.',
  },
];

const leaders = [
  { place: 1, name: 'Азиза Р.', score: '2 480' },
  { place: 2, name: 'Бекзод К.', score: '2 190' },
  { place: 3, name: 'Дилноза Т.', score: '1 970' },
  { place: 4, name: 'Санжар У.', score: '1 640' },
];

const bars = [
  { label: '0–59', height: 32, opacity: 0.35 },
  { label: '60–74', height: 58, opacity: 0.55 },
  { label: '75–89', height: 92, opacity: 0.78 },
  { label: '90–100', height: 100, opacity: 1 },
];

export default function Home() {
  return (
    <main>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="badge">CRM для учебного центра</span>
            <h1>
              Учебный центр под полным контролем
            </h1>
            <p className="hero__lead">
              Оплаты, посещаемость, экзамены, геймификация и чаты — в одной
              системе. Пять ролей, live-счётчик онлайна и
              Telegram-уведомления из коробки.
            </p>
            <div className="hero__actions">
              <Link to="/landing/contacts" className="btn btn--accent btn--lg">
                Оставить заявку
              </Link>
              <Link to="/landing/features" className="btn btn--outline btn--lg">
                Смотреть возможности
              </Link>
            </div>
            <div className="trial-note">
              <Icon name="check" size={16} />
              Первая неделя — бесплатно, без карты и обязательств
            </div>
          </div>

          <div className="dash">
            <div className="dash__head">
              <div>
                <div className="dash__title">Дашборд администратора</div>
                <div className="dash__sub">Филиал: Чиланзар</div>
              </div>
            </div>
            <div className="dash__stats">
              <div className="stat-card">
                <div className="stat-card__label">Выручка / мес</div>
                <div className="stat-card__value num">48.2 млн</div>
                <div className="delta delta--up">▲ 12%</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">Учеников</div>
                <div className="stat-card__value num">1 240</div>
                <div className="delta delta--up">▲ 34</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__label">Должники</div>
                <div className="stat-card__value num">17</div>
                <div className="delta delta--down">▼ 5</div>
              </div>
            </div>
            <div className="dash__chart">
              <div className="dash__chart-title">Распределение оценок</div>
              <div className="bars">
                {bars.map((b) => (
                  <div className="bars__item" key={b.label}>
                    <div
                      className="bars__bar"
                      style={{
                        height: `${b.height}%`,
                        background: `rgba(198, 255, 52, ${b.opacity})`,
                      }}
                    />
                    <span className="bars__label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Полоса статов ===== */}
      <section className="band">
        <div className="container band__grid">
          <div className="band__item">
            <div className="band__value">5</div>
            <div className="band__label">ролей в одной системе</div>
          </div>
          <div className="band__item">
            <div className="band__value">12+</div>
            <div className="band__label">рабочих модулей</div>
          </div>
          <div className="band__item">
            <div className="band__value">Live</div>
            <div className="band__label">счётчик онлайна</div>
          </div>
          <div className="band__item">
            <div className="band__value">24/7</div>
            <div className="band__label">Telegram-уведомления</div>
          </div>
        </div>
      </section>

      {/* ===== Фичи ===== */}
      <section className="section section--white" id="features">
        <div className="container">
          <div className="section__head">
            <h2>Всё для управления центром</h2>
            <p>
              Один продукт вместо десятка таблиц и чатов. Финансы, учёба и
              мотивация — в общей системе с ролями и правами.
            </p>
          </div>
          <div className="cards-3">
            {features.map((f) => (
              <article className="feature" key={f.title}>
                <div className="feature__icon">
                  <Icon name={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Роли ===== */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Пять ролей — пять кабинетов</h2>
            <p>
              После входа роль из токена сама открывает нужный кабинет. Никто
              не видит лишнего — доступ решает RBAC на сервере.
            </p>
          </div>
          <div className="roles">
            {roles.map((r) => (
              <article className="role" key={r.tag}>
                <div className="role__avatar">{r.tag}</div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Мотивация (тёмная) ===== */}
      <section className="section section--dark">
        <div className="container split">
          <div>
            <span className="badge badge--lime">Мотивация</span>
            <h2>Мотивация, которую видно</h2>
            <p className="split__lead">
              Коины начисляются за оценки, посещаемость и активность — и тут
              же превращаются в награды. Дети соревнуются, а не отсиживаются.
            </p>
            <ul className="checklist">
              <li>
                <span className="tick">✓</span>
                Коины за успеваемость и активность
              </li>
              <li>
                <span className="tick">✓</span>
                Магазин наград — трата коинов на витрине
              </li>
              <li>
                <span className="tick">✓</span>
                Лидерборды недели и месяца, история — append-only
              </li>
            </ul>
          </div>
          <div className="leader">
            <div className="leader__head">
              <span className="leader__title">Лидерборд · Неделя</span>
              <span className="pill pill--coins">★ коины</span>
            </div>
            {leaders.map((l) => (
              <div className="leader__row" key={l.place}>
                <span className="leader__place num">{l.place}</span>
                <span className="leader__ava" />
                <span className="leader__name">{l.name}</span>
                <span className="leader__score num">
                  {l.score} <span>★</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Финансы ===== */}
      <section className="section">
        <div className="container split">
          <div className="invoice">
            <div className="invoice__head">
              <div>
                <div className="invoice__title">Счёт #1042</div>
                <div className="invoice__sub">
                  Азиза Рахимова · Frontend Pro
                </div>
              </div>
              <span className="pill pill--paid">Оплачен</span>
            </div>
            <div className="invoice__total">
              <div className="invoice__total-label">Сумма счёта</div>
              <div className="invoice__total-value num">1 200 000 сум</div>
            </div>
            <div className="invoice__caption">Сплит-платёж</div>
            <div className="invoice__line">
              <span>Наличные</span>
              <b className="num">700 000 сум</b>
            </div>
            <div className="invoice__line">
              <span>Карта</span>
              <b className="num">500 000 сум</b>
            </div>
            <div className="invoice__caption" style={{ marginTop: 16 }}>
              Итог
            </div>
            <div className="invoice__line">
              <span>Чек</span>
              <b>Прикреплён к платежу</b>
            </div>
            <div className="invoice__line">
              <span>Долг ученика</span>
              <b className="num">0 сум</b>
            </div>
          </div>

          <div>
            <h2>
              Деньги под контролем — до копейки
            </h2>
            <p className="split__lead">
              Один счёт — несколько транзакций с общим split_batch_id. Чек
              хранится при платеже, а долги видно в дашборде мгновенно.
            </p>
            <ul className="checklist">
              <li>
                <span className="tick">✓</span>
                Наличные + карта в одном платеже
              </li>
              <li>
                <span className="tick">✓</span>
                Чек прикрепляется к каждому платежу
              </li>
              <li>
                <span className="tick">✓</span>
                Инвойс и транзакции связаны единым batch
              </li>
              <li>
                <span className="tick">✓</span>
                Архив ≠ удаление: read-only, а не потеря данных
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Cta />
    </main>
  );
}
