import { useAuth } from '../auth.jsx';

// Заглушка личного кабинета после входа.
// Полные панели Student/Parent — отдельные задачи (не в этом таске про логин).
export default function Home() {
  const { user, logout } = useAuth();
  const isParent = user?.role === 'parent';

  return (
    <div className="min-h-screen grid place-items-center bg-base-200 p-6">
      <div className="card bg-base-100 w-full max-w-md p-8 text-center space-y-4">
        <img src="/logo-primary.svg" alt="LevelUp Academy" className="h-9 w-auto mx-auto" />
        <h1 className="text-2xl font-bold">Добро пожаловать, {user?.firstName}!</h1>
        <p className="opacity-60">
          Вы вошли как <b>{isParent ? 'родитель' : 'ученик'}</b>. Личный кабинет скоро появится здесь.
        </p>
        <button className="btn btn-outline btn-sm w-full" onClick={logout}>
          Выйти
        </button>
      </div>
    </div>
  );
}
