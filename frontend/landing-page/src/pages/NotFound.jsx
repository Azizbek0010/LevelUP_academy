import { Link, useLocation } from 'react-router-dom';
import { useSeo } from '../lib/seo.js';

export default function NotFound() {
  const { pathname } = useLocation();

  useSeo({
    title: 'Страница не найдена — LevelUp Academy',
    description: 'Такой страницы нет. Вернитесь на главную LevelUp Academy.',
    path: pathname,
    noindex: true,
  });

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="badge badge--lime">404</span>
          <h1>Такой страницы нет</h1>
          <p>
            Возможно, ссылка устарела или в адресе опечатка. Вернитесь на
            главную — оттуда доступны все разделы LevelUp Academy.
          </p>
          <Link className="btn btn--accent btn--lg" to="/landing">
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
