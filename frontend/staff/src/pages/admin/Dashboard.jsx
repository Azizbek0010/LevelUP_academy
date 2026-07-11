// ВРЕМЕННАЯ ЗАГЛУШКА — реальные страницы Admin-панели лежат в
// ./admin_page/ (ветки rey/xob) как отдельное вложенное Vite-приложение,
// не подключённое к общему роутеру/api.js. Требуется миграция компонентов
// сюда (см. TASK.md, разбор в TG-группе Ichvoganlar+Siqilganlar).
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader title="Дашборд админа" subtitle="Филиал: доход, расход, студенты, группы" />
      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <p className="text-base-content/40 text-sm py-6 text-center">
            Панель админа в разработке. Скоро здесь появятся доход/расход, студенты, группы и платежи.
          </p>
        </div>
      </div>
    </div>
  );
}
