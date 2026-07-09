import Cta from '../components/Cta.jsx';
import Icon from '../components/Icon.jsx';

export default function Finance() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">Финансы</span>
          <h1>Деньги центра — до копейки</h1>
          <p>
            Сплит-платежи, инвойсы, контроль долгов и живые отчёты. Кассовый
            разрыв видно заранее, а не в конце месяца.
          </p>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>Оплата — как удобно родителям</h2>
            <p>Любой способ, которым реально платят в центрах.</p>
          </div>
          <div className="cards-3">
            <article className="feature">
              <div className="feature__icon">
                <Icon name="coin" />
              </div>
              <h3>Полная оплата</h3>
              <p>
                Один счёт — одна транзакция. Наличные или карта, чек
                прикрепляется к платежу и хранится в облаке. Выручка филиала
                обновляется в ту же секунду.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="swap" />
              </div>
              <h3>Сплит-платёж</h3>
              <p>
                700 000 наличными + 500 000 картой? Не проблема: один счёт,
                несколько транзакций с общим batch-номером. Сумма частей
                проверяется до проведения — расхождений не бывает.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="receipt" />
              </div>
              <h3>Инвойс и чек</h3>
              <p>
                Каждая оплата привязана к счёту, чек хранится в облаке рядом
                с платежом. Спор через полгода? Открыли счёт — всё на месте.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Долги видны сразу</h2>
            <p>
              Не оплатили месяц — ученик автоматически в списке должников.
              Администратор видит это в дашборде сразу, а не узнаёт в конце
              месяца.
            </p>
          </div>
          <div className="steps">
            <article className="step">
              <h3>Оплата не пришла</h3>
              <p>
                Долг ученика вырос — система пересчитала его сама в момент
                выставления счёта. Никаких ручных сводок.
              </p>
            </article>
            <article className="step">
              <h3>Напоминание родителю</h3>
              <p>
                Родитель видит долг в своём кабинете и получает уведомление в
                Telegram. Большинство долгов закрывается после первого
                напоминания.
              </p>
            </article>
            <article className="step">
              <h3>Заморозка при необходимости</h3>
              <p>
                Ученик временно не ходит? Заморозили — долг перестал расти,
                история оплат целиком сохранилась.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container">
          <div className="section__head">
            <h2>До и после LevelUp Academy</h2>
          </div>
          <table className="compare">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Таблицы и чаты</th>
                <th>LevelUp Academy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td data-label="Задача">Приём сплит-оплаты</td>
                <td className="no" data-label="Таблицы и чаты">Две строки в разных таблицах, легко потерять</td>
                <td className="yes" data-label="LevelUp Academy">Один счёт, связанные транзакции</td>
              </tr>
              <tr>
                <td data-label="Задача">Контроль долгов</td>
                <td className="no" data-label="Таблицы и чаты">Вручную по тетради и памяти</td>
                <td className="yes" data-label="LevelUp Academy">Список должников обновляется сам</td>
              </tr>
              <tr>
                <td data-label="Задача">Выручка за месяц</td>
                <td className="no" data-label="Таблицы и чаты">Сводится день-два, с ошибками</td>
                <td className="yes" data-label="LevelUp Academy">Живая цифра в дашборде</td>
              </tr>
              <tr>
                <td data-label="Задача">Долг конкретного ученика</td>
                <td className="no" data-label="Таблицы и чаты">«Позвоните бухгалтеру»</td>
                <td className="yes" data-label="LevelUp Academy">Виден родителю и админу мгновенно</td>
              </tr>
              <tr>
                <td data-label="Задача">История после ухода ученика</td>
                <td className="no" data-label="Таблицы и чаты">Строку удалили — данных нет</td>
                <td className="yes" data-label="LevelUp Academy">Архив read-only: всё хранится</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Надёжность на уровне банка</h2>
            <p>Правила, которые нельзя нарушить даже случайно.</p>
          </div>
          <div className="cards-3">
            <article className="feature">
              <div className="feature__icon">
                <Icon name="lock" />
              </div>
              <h3>Деньги только в транзакциях</h3>
              <p>
                Каждая денежная операция атомарна: либо прошла целиком, либо
                не прошла вовсе. Половинчатых оплат не существует.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="receipt" />
              </div>
              <h3>Точная арифметика</h3>
              <p>
                Никаких «плавающих» копеек: суммы хранятся в точном денежном
                формате. 1 200 000 — это ровно 1 200 000.
              </p>
            </article>
            <article className="feature">
              <div className="feature__icon">
                <Icon name="shield" />
              </div>
              <h3>Ничего не исчезает</h3>
              <p>
                Физического удаления нет: архив и «мягкое» удаление. Любой
                платёж можно поднять и через год — для отчёта или спора.
              </p>
            </article>
          </div>
        </div>
      </section>

      <Cta
        title="Наведём порядок в финансах центра?"
        text="Оставьте заявку — расскажем, как LevelUp Academy ведёт платежи и должников."
      />
    </main>
  );
}
