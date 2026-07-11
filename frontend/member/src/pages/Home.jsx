import { useEffect } from 'react';
import { useAuth } from '../auth.jsx';

// URL панели студента (frontend/student) — своя в dev, своя в проде.
const STUDENT_URL =
  (typeof import.meta !== 'undefined' && import.meta.env.VITE_STUDENT_URL) ||
  'http://localhost:5176';

// Заглушка личного кабинета после входа.
// Панель Student (Abdulaziz) уже готова отдельным SPA — сразу пробрасываем туда.
// Панели Parent пока не существует — для родителя остаётся заглушка.
export default function Home() {
  const { user, logout } = useAuth();
  const isParent = user?.role === 'parent';

  useEffect(() => {
    if (user?.role === 'student') {
      window.location.href = STUDENT_URL;
    }
  }, [user]);

  if (user?.role === 'student') return null;

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
