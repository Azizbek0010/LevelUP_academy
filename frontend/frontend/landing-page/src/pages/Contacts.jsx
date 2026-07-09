import { useState } from 'react';
import Icon from '../components/Icon.jsx';

// в dev — vite-прокси на :4000; в prod задаётся VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL ?? '';

export default function Contacts() {
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

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
        setError(
          res.status === 429
            ? 'Слишком много попыток — подождите минуту и отправьте снова.'
            : 'Не удалось отправить заявку. Проверьте имя и телефон и попробуйте ещё раз.'
        );
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setError('Сервер недоступен. Попробуйте позже или напишите нам в Telegram.');
      setStatus('error');
    }
  };

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">Контакты</span>
          <h1>Обсудим ваш центр?</h1>
          <p>
            Оставьте заявку — расскажем о LevelUp Academy и ответим на все
            вопросы.
          </p>
          <div className="trial-note">
            <Icon name="check" size={16} />
            Первая неделя — бесплатно, без карты и обязательств
          </div>
        </div>
      </section>

      <section className="section section--white">
        <div className="container contact-grid">
          <form className="contact-form" onSubmit={onSubmit}>
            <div>
              <label htmlFor="name">Имя</label>
              <input id="name" name="name" placeholder="Как к вам обращаться" required />
            </div>
            <div>
              <label htmlFor="phone">Телефон</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+998 90 000 00 00"
                required
              />
            </div>
            <div>
              <label htmlFor="center">Учебный центр</label>
              <input id="center" name="center" placeholder="Название центра" />
            </div>
            <div>
              <label htmlFor="size">Размер центра</label>
              <select id="size" name="size" defaultValue="">
                <option value="" disabled>
                  Сколько учеников
                </option>
                <option>До 100 учеников</option>
                <option>100–500 учеников</option>
                <option>500+ учеников</option>
                <option>Сеть филиалов</option>
              </select>
            </div>
            <div>
              <label htmlFor="msg">Сообщение</label>
              <textarea
                id="msg"
                name="msg"
                placeholder="Что хотите улучшить в управлении центром?"
              />
            </div>
            {status === 'sent' ? (
              <div className="form-success">
                Заявка принята! Свяжемся с вами в ближайшее время.
              </div>
            ) : (
              <>
                {error && <div className="form-error">{error}</div>}
                <button
                  type="submit"
                  className="btn btn--accent btn--lg"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                </button>
              </>
            )}
            <p className="form-note">
              Нажимая кнопку, вы соглашаетесь с политикой обработки данных.
            </p>
          </form>

          <div className="contact-info">
            <div className="big-card">
              <h3>
                <Icon name="send" size={18} /> Telegram
              </h3>
              <p>
                Быстрее всего — написать нам в Telegram: ответим и расскажем
                о системе.
              </p>
            </div>
            <div className="big-card">
              <h3>
                <Icon name="rocket" size={18} /> Статус продукта
              </h3>
              <p>
                LevelUp Academy активно развивается. Оставьте контакт — и вы
                первыми узнаете о запуске.
              </p>
            </div>
            <div className="big-card">
              <h3>
                <Icon name="message" size={18} /> Вопросы и предложения
              </h3>
              <p>
                Расскажите, чего не хватает вашему центру — лучшие идеи
                попадают в продукт.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
