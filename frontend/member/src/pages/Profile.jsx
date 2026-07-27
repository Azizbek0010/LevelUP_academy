import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Icon from '../components/Icons.jsx';
import { fmt } from '../format.js';

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedChild } = useChild();

  return (
    <>
      <PageHeader title="Профиль" subtitle="Настройки аккаунта" />

      {/* Profile Header */}
      <div className="card bg-gradient-to-br from-sidebar to-[#1a2e12] text-white mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-lg" />
        <div className="card-body relative z-10 py-5">
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

      {/* Child Info */}
      {selectedChild && (
        <div className="card bg-base-100 mb-6">
          <div className="card-body">
            <h3 className="card-title text-sm gap-2">
              <Icon name="user" className="w-4 h-4 text-primary" />
              Ребёнок
            </h3>
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 ring-2 ring-primary/30 mt-2">
              <div className="relative">
                <Avatar name={`${selectedChild.firstName} ${selectedChild.lastName}`} size={42} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-base-100 flex items-center justify-center">
                  <Icon name="check" className="w-2.5 h-2.5 text-primary-content" strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{selectedChild.firstName} {selectedChild.lastName}</p>
                <p className="text-xs opacity-40 flex items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Icon name="star" className="w-3 h-3" />
                    {fmt(selectedChild.coins)} коинов
                  </span>
                  <span className="opacity-30">·</span>
                  {Number(selectedChild.totalDebt) > 0 ? (
                    <span className="text-error flex items-center gap-0.5">
                      <Icon name="wallet" className="w-3 h-3" />
                      Долг
                    </span>
                  ) : (
                    <span className="text-success flex items-center gap-0.5">
                      <Icon name="check-circle" className="w-3 h-3" />
                      Без долга
                    </span>
                  )}
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary text-primary-content font-bold flex items-center gap-1">
                Активен
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Icon name="cog" className="w-4 h-4 text-primary" />
            Настройки
          </h3>
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 hover:bg-base-200/60 transition-colors">
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
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/40 hover:bg-base-200/60 transition-colors">
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

      {/* Logout */}
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
