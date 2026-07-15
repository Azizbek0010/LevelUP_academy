import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedChild, childList } = useChild();

  return (
    <>
      <PageHeader title="Профиль" subtitle="Настройки аккаунта" />

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size={64} />
            <div>
              <h2 className="text-xl font-extrabold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm opacity-50">Родитель</p>
              <p className="text-xs opacity-30 mt-1">Код: {user?.loginCode}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm">Дети</h3>
          <div className="space-y-2 mt-2">
            {childList.map((child) => (
              <div
                key={child.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  selectedChild?.id === child.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-base-200/40'
                }`}
              >
                <Avatar name={`${child.firstName} ${child.lastName}`} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{child.firstName} {child.lastName}</p>
                  <p className="text-xs opacity-40">
                    {child.coins} коинов · {Number(child.totalDebt) > 0 ? `Долг: ${child.totalDebt}` : 'Без долга'}
                  </p>
                </div>
                {selectedChild?.id === child.id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-content font-medium">
                    Выбран
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm">Настройки</h3>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40">
              <div>
                <p className="text-sm font-medium">Уведомления</p>
                <p className="text-xs opacity-40">Push-уведомления о занятиях</p>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40">
              <div>
                <p className="text-sm font-medium">Звуки чата</p>
                <p className="text-xs opacity-40">Звуковое оповещение</p>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <button className="btn btn-outline btn-error w-full rounded-xl" onClick={logout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  );
}
