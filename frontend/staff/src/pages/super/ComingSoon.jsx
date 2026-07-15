import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = {
  '/students':     { title: 'Студенты',      items: ['Список студентов по филиалам', 'Создание и редактирование профиля', 'Заморозка / архивация', 'Добавление в группу', 'История платежей студента'] },
  '/groups':       { title: 'Группы',        items: ['Все группы организации', 'Расписание занятий', 'Список студентов в группе', 'Статистика успеваемости', 'Управление ментором'] },
  '/attendance':   { title: 'Посещаемость',  items: ['Сводная таблица посещаемости', 'Фильтр по филиалу / группе', 'Графики динамики', 'Экспорт в CSV'] },
  '/stats':        { title: 'Статистика',    items: ['Сравнение филиалов по доходу', 'Динамика роста студентов', 'Конверсия лидов', 'KPI по месяцам', 'Прогнозирование'] },
  '/announcements':{ title: 'Объявления',    items: ['Рассылка по всей организации', 'Таргет по филиалу / группе / роли', 'Уведомления в Telegram', 'История рассылок'] },
  '/reminders':    { title: 'Напоминания',   items: ['Авто-напоминания должникам', 'Правила (триггер + задержка)', 'Отправка через Telegram-бот', 'Журнал отправленных'] },
  '/audit':        { title: 'Аудит',         items: ['Журнал всех действий в системе', 'Фильтр по пользователю и дате', 'Изменения в данных организации', 'Экспорт лога'] },
};

const WORKING = [
  { to: '/',         label: 'Дашборд' },
  { to: '/branches', label: 'Филиалы' },
  { to: '/admins',   label: 'Сотрудники' },
  { to: '/reports',  label: 'Аналитика' },
  { to: '/settings', label: 'Настройки' },
];

export default function ComingSoon({ path }) {
  const info = FEATURES[path] ?? { title: 'Страница', items: ['Функционал в разработке'] };

  return (
    <div className="max-w-xl mx-auto mt-16 text-center space-y-6">
      <div className="flex flex-col items-center gap-3">
        <span className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
          <Clock size={28} className="text-warning" />
        </span>
        <span className="badge badge-warning badge-sm uppercase tracking-wider font-bold">В разработке</span>
        <h1 className="text-2xl font-bold">{info.title}</h1>
        <p className="text-sm text-base-content/50">
          Страница появится когда бэкенд добавит нужные API-роуты.
        </p>
      </div>

      <div className="card bg-base-100 text-left">
        <div className="card-body p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-3">Что будет здесь</div>
          <ul className="space-y-2">
            {info.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-base-content/70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 text-left">
        <div className="card-body p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-3">Рабочие разделы</div>
          <div className="flex flex-wrap gap-2">
            {WORKING.map(({ to, label }) => (
              <Link key={to} to={to} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-sm font-medium transition-colors">
                {label} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
