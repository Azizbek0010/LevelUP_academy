import { ArrowLeft, Clock, Layers, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_FEATURES: Record<string, string[]> = {
  '/superadmin/students': [
    'Список студентов с поиском и фильтрами',
    'Добавление / редактирование профиля',
    'Заморозка аккаунтов',
    'История платежей студента',
    'Перевод между группами',
  ],
  '/superadmin/groups': [
    'CRUD групп (создание, редактирование, архив)',
    'Расписание занятий и наставники',
    'Список участников группы',
    'Финансовый план по группам',
  ],
  '/superadmin/attendance': [
    'Сводный журнал посещаемости',
    'Статистика по группам и датам',
    'Экспорт в Excel/PDF',
  ],
  '/superadmin/stats': [
    'Финансовые отчёты по месяцам',
    'Сравнение показателей между филиалами',
    'Долги и история платежей',
    'Диаграммы посещаемости и успеваемости',
  ],
  '/superadmin/announcements': [
    'Отправка анонсов всем сотрудникам',
    'Telegram-рассылка через бот',
    'Адресация: филиал / роль / все',
    'История отправленных анонсов',
  ],
  '/superadmin/reminders': [
    'Автоматические напоминания об оплате',
    'Гибкие правила (N дней до срока)',
    'Ручная отправка уведомлений',
    'Статистика доставки',
  ],
  '/superadmin/audit': [
    'Лог всех действий в системе',
    'Фильтрация по пользователю / типу',
    'Экспорт логов',
    'Временная шкала событий',
  ],
};

export default function ComingSoonPage({ title }: { title: string }): React.ReactElement {
  const { pathname } = useLocation();
  const features = ROUTE_FEATURES[pathname] ?? [];

  return (
    <div className="p-8 max-w-2xl">
      <Link
        to="/superadmin"
        className="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors mb-8 -ml-1"
      >
        <ArrowLeft className="size-4" />
        Назад на дашборд
      </Link>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-warning/15 border border-warning/25 text-warning text-[11px] font-semibold uppercase tracking-wider mb-5">
        <Clock className="size-3.5" />
        В разработке
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-base-content/60 mt-2 leading-relaxed">
        Этот раздел ожидает реализации API на бэкенде. Как только эндпоинты
        появятся в <code className="text-xs bg-base-200 px-1.5 py-0.5 rounded font-mono">/api/super/</code>, интерфейс
        будет подключён в течение одного спринта.
      </p>

      {features.length > 0 && (
        <div className="card bg-base-100 border border-base-300 p-5 mt-7 chart-rise">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-7 rounded-lg bg-primary/10 grid place-items-center">
              <Layers className="size-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider">
              Что будет доступно
            </h2>
          </div>
          <ul className="space-y-2.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-base-content/80">
                <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phase info */}
      <div className="mt-6 flex items-center gap-2 text-[12px] text-base-content/40">
        <Sparkles className="size-3.5" />
        <span>Ожидается в рамках MVP v1.0 — Phase 3</span>
      </div>

      {/* Quick nav */}
      <div className="mt-8 pt-6 border-t border-base-300">
        <p className="text-[11px] text-base-content/40 uppercase tracking-wider mb-3 font-semibold">
          Уже доступно
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/superadmin', label: 'Дашборд' },
            { to: '/superadmin/branches', label: 'Филиалы' },
            { to: '/superadmin/users', label: 'Сотрудники' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex items-center h-7 px-3 rounded-full border border-base-300 text-[12px] text-base-content/60 hover:text-primary hover:border-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
