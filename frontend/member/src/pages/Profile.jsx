import { useAuth } from '../auth.jsx';
import { useChild } from '../child-context.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import {
  Check,
  CircleUser,
  User,
  Star,
  Settings,
  Bell,
  MessageCircle,
  LogOut,
  Shield,
  Users,
  Coins,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const { selectedChild, childList, selectChild } = useChild();

  return (
    <>
      <PageHeader title="Профиль" subtitle="Настройки аккаунта" />

      {/* Hero card — parent info */}
      <div className="card bg-gradient-to-br from-sidebar to-[#1a2e12] text-white mb-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-lg" />
        <div className="card-body relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size={64} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-sidebar flex items-center justify-center">
                <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm opacity-50 flex items-center gap-1.5 mt-0.5">
                <CircleUser className="w-4 h-4" />
                Родитель
              </p>
              <p className="text-xs opacity-30 mt-1 font-mono">Код: {user?.loginCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Children section */}
      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Users className="w-4 h-4 text-primary" />
            Дети
            <span className="text-xs font-normal text-base-content/40 ml-auto">{childList.length} чел.</span>
          </h3>
          <div className="space-y-2 mt-3">
            {childList.map((child) => {
              const isActive = selectedChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => selectChild(child.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
                    isActive
                      ? 'bg-primary/10 ring-1 ring-primary/30 shadow-sm'
                      : 'bg-base-200/40 hover:bg-base-200 hover:shadow-sm'
                  }`}
                >
                  <Avatar name={`${child.firstName} ${child.lastName}`} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-base-content/40 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      {child.coins} коинов
                      <span className="opacity-30">·</span>
                      {Number(child.totalDebt) > 0 ? (
                        <span className="text-error flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Долг: {child.totalDebt}
                        </span>
                      ) : (
                        'Без долга'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary text-primary-content font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        Выбран
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-base-content/20 group-hover:text-base-content/40 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings section */}
      <div className="card bg-base-100 mb-6">
        <div className="card-body">
          <h3 className="card-title text-sm gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Настройки
          </h3>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Уведомления</p>
                  <p className="text-xs text-base-content/40">Push-уведомления о занятиях</p>
                </div>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Звуки чата</p>
                  <p className="text-xs text-base-content/40">Звуковое оповещение</p>
                </div>
              </div>
              <input type="checkbox" className="toggle toggle-sm toggle-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Security badge */}
      <div className="card bg-base-100 mb-6">
        <div className="card-body p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Аккаунт защищён</p>
              <p className="text-xs text-base-content/40">Последний вход: сегодня</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="card bg-base-100">
        <div className="card-body p-4">
          <button
            className="btn btn-outline btn-error w-full rounded-xl gap-2 hover:shadow-md transition-all duration-200"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  );
}
