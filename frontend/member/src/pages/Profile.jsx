import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icons.jsx';

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedChild, childList, selectChild } = useChild();

  return (
    <>
      <PageHeader title="Профиль" subtitle="Настройки аккаунта" />

      <div className="card bg-gradient-to-br from-sidebar to-[#1a2e12] text-white mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="card-body relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size={64} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-sidebar flex items-center justify-center">
                <Icon name="check" className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm opacity-50 flex items-center gap-1.5 mt-0.5">
                <Icon name="user-circle" className="w-4 h-4" />
                Родитель
              </p>
              <p className="text-xs opacity-30 mt-1 font-mono">Код: {user?.loginCode}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Icon name="user" className="w-4 h-4 text-primary" />
            Дети
          </h3>
          <div className="space-y-2 mt-2">
            {childList.map((child) => {
              const isActive = selectedChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => selectChild(child.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-primary/10 ring-1 ring-primary/30 shadow-sm'
                      : 'bg-base-200/40 hover:bg-base-200'
                  }`}
                >
                  <Avatar name={`${child.firstName} ${child.lastName}`} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{child.firstName} {child.lastName}</p>
                    <p className="text-xs opacity-40 flex items-center gap-1">
                      <Icon name="star" className="w-3 h-3" />
                      {child.coins} коинов
                      <span className="opacity-30">·</span>
                      {Number(child.totalDebt) > 0 ? (
                        <span className="text-error">Долг: {child.totalDebt}</span>
                      ) : (
                        'Без долга'
                      )}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-content font-medium flex items-center gap-1">
                      <Icon name="check" className="w-3 h-3" strokeWidth={2.5} />
                      Выбран
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Icon name="cog" className="w-4 h-4 text-primary" />
            Настройки
          </h3>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="bell" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Уведомления</p>
                  <p className="text-xs opacity-40">Push-уведомления о занятиях</p>
                </div>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="chat" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Звуки чата</p>
                  <p className="text-xs opacity-40">Звуковое оповещение</p>
                </div>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <button className="btn btn-outline btn-error w-full rounded-xl gap-2" onClick={logout}>
            <Icon name="logout" className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  );
}
