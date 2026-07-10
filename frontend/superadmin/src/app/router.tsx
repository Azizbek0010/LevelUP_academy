import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import DashboardPage from '../features/superadmin/dashboard/DashboardPage';
import BranchesPage from '../features/superadmin/branches/BranchesPage';
import BranchDetailPage from '../features/superadmin/branches/BranchDetailPage';
import UsersPage from '../features/superadmin/users/UsersPage';
import SettingsPage from '../features/superadmin/settings/SettingsPage';
import ComingSoonPage from '../features/superadmin/ComingSoonPage';
import { RequireRole } from './RequireRole';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/superadmin" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireRole roles={['superadmin']} />,
    children: [
      {
        path: '/superadmin',
        element: <SuperAdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'branches', element: <BranchesPage /> },
          { path: 'branches/:id', element: <BranchDetailPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'students', element: <ComingSoonPage title="Студенты" /> },
          { path: 'students/:id', element: <ComingSoonPage title="Студент" /> },
          { path: 'groups', element: <ComingSoonPage title="Группы" /> },
          { path: 'groups/:id', element: <ComingSoonPage title="Группа" /> },
          { path: 'attendance', element: <ComingSoonPage title="Посещаемость" /> },
          { path: 'attendance/:id', element: <ComingSoonPage title="Занятие" /> },
          { path: 'stats', element: <ComingSoonPage title="Отчёты и статистика" /> },
          { path: 'reminders', element: <ComingSoonPage title="Уведомления" /> },
          { path: 'users/:id', element: <ComingSoonPage title="Сотрудник" /> },
          { path: 'audit', element: <ComingSoonPage title="Журнал аудита" /> },
          { path: 'announcements', element: <ComingSoonPage title="Объявления" /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">404</h1>
          <p className="text-base-content/60 mt-2">Страница не найдена</p>
        </div>
      </div>
    ),
  },
]);
