import { Navigate, useLocation, Outlet } from 'react-router-dom';
import type { Role } from '@/shared/types';
import { useAuthStore } from '../shared/stores/auth';

interface Props {
  roles: Role[];
}

export function RequireRole({ roles }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">403 · Доступ запрещён</h1>
          <p className="text-base-content/60">
            Требуется роль: <code>{roles.join(' / ')}</code>. Ваша: <code>{user.role}</code>
          </p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
