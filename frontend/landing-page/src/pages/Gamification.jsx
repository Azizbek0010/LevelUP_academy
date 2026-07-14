import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';
import { useSeo, breadcrumb } from '../lib/seo.js';

const jsonLd = [
  breadcrumb([
    { name: 'Главная', path: '/landing' },
    { name: 'Мотивация', path: '/landing/gamification' },
  ]),
];

const leaders = [
  { place: 1, name: 'Азиза Р.', score: '2 480' },
  { place: 2, name: 'Бекзод К.', score: '2 190' },
  { place: 3, name: 'Дилноза Т.', score: '1 970' },
  { place: 4, name: 'Санжар У.', score: '1 640' },
  { place: 5, name: 'Мадина А.', score: '1 520' },
];

export default function Gamification() {
  useSeo({
    title: 'Мотивация и геймификация | LevelUp Academy',
    description:
      'Коины за успеваемость, магазин наград и живые лидерборды недели и месяца. Append-only журнал коинов — мотивация, которую видно каждый день.',
    path: '/landing/gamification',
    jsonLd,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">Мотивация</span>
          <h1>Ученики соревнуются, а не отсиживаются</h1>
          <p>
            Коины за успехи, магазин наград и живые лидерборды. Мотивация
            перестаёт быть словами на собрании — она видна каждому ученику
            каждый день.
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container split">
          <div>
            <h2>Как зарабатываются коины</h2>
            <p className="split__lead">
              Коины начисляются за реальные достижения, а каждая операция
              требует причины — «просто так» не бывает.
            </p>
            <ul className="checklist">
              <li>
                <span className="tick">✓</span>
                Высокие оценки за тесты и экзамены
              </li>
              <li>
                <span className="tick">✓</span>
                Сданные вовремя домашние задания
              </li>
              <li>
                <span className="tick">✓</span>
                Посещаемость без пропусков
              </li>
              <li>
                <span className="tick">✓</span>
                Активность на занятиях — отмечает ментор
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

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Куда тратятся коины</h2>
            <p>
              Магазин наград — витрина, которую центр наполняет сам: мерч,
              сертификаты, бесплатные занятия, что угодно.
            </p>
          </div>
          <div className="steps">
            <article className="step">
              <h3>Витрина центра</h3>
              <p>
                Администратор выкладывает награды и цены в коинах. Цена
                фиксируется в момент покупки — задним числом не меняется.
              </p>
            </article>
            <article className="step">
              <h3>Покупка учеником</h3>
              <p>
                Ученик копит и тратит прямо из кабинета. Баланс не может уйти
                в минус — система не даст потратить больше, чем есть.
              </p>
            </article>
            <article className="step">
              <h3>Выдача и учёт</h3>
              <p>
                Заказ появляется у администратора, награда выдаётся лично.
                Вся история покупок сохраняется навсегда.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container split">
          <div>
            <span className="badge badge--lime">Честность</span>
            <h2>Журнал, который нельзя переписать</h2>
            <p className="split__lead">
              Каждое начисление и списание коинов записывается в журнал
              навсегда: кто, кому, сколько и за что. Записи не редактируются и
              не удаляются — только добавляются.
            </p>
            <ul className="checklist">
              <li>
                <span className="tick">✓</span>
                Причина обязательна для любой операции
              </li>
              <li>
                <span className="tick">✓</span>
                Баланс и журнал меняются только вместе
              </li>
              <li>
                <span className="tick">✓</span>
                Лидерборды пересчитываются автоматически
              </li>
              <li>
                <span className="tick">✓</span>
                Спорная ситуация? Журнал покажет всё
              </li>
            </ul>
          </div>
          <div className="leader">
            <div className="leader__head">
              <span className="leader__title">Журнал коинов</span>
              <span className="pill pill--coins">append-only</span>
            </div>
            <div className="leader__row">
              <span className="leader__name">
                <b>+50</b> · Азиза Р. — экзамен на 96/100
              </span>
            </div>
            <div className="leader__row">
              <span className="leader__name">
                <b>+20</b> · Бекзод К. — ДЗ сдано до дедлайна
              </span>
            </div>
            <div className="leader__row">
              <span className="leader__name">
                <b>−300</b> · Дилноза Т. — покупка: футболка центра
              </span>
            </div>
            <div className="leader__row">
              <span className="leader__name">
                <b>+10</b> · Санжар У. — активность на занятии
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>Лидерборды недели и месяца</h2>
            <p>
              Рейтинг обнуляется каждую неделю и каждый месяц — у новичка
              всегда есть шанс догнать. Прошлые победы сохраняются в
              снапшотах: история достижений никуда не исчезает.
            </p>
          </div>
          <div className="cards-3">
            <article className="feature">
              <div className="feature__icon">
                <Icon name="zap" />
              </div>
              <h3>Живой рейтинг</h3>
              <p>
                Получил коины — позиция в лидерборде обновилась сразу.
                Ученики видят движение в реальном времени.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="refresh" />
              </div>
              <h3>Честный сброс</h3>
              <p>
                Неделя и месяц стартуют с нуля для всех. Соревнование не
                превращается в гонку с недосягаемым лидером.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="trophy" />
              </div>
              <h3>История побед</h3>
              <p>
                Победители каждого периода фиксируются. Доска почёта центра
                собирается сама.
              </p>
            </article>
          </div>
        </div>
      </section>

      <Cta
        title="Включите соревнование в вашем центре"
        text="Коины, магазин и лидерборды настраиваются под правила вашего центра."
      />
    </main>
  );
}
