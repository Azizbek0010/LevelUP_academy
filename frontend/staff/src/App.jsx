import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import MentorDashboard from './pages/mentor/Dashboard.jsx';
import MethodistDashboard from './pages/methodist/Dashboard.jsx';
import TrainingTypes from './pages/methodist/TrainingTypes.jsx';
import Topics from './pages/methodist/Topics.jsx';
import Lessons from './pages/methodist/Lessons.jsx';
import LessonEditor from './pages/methodist/LessonEditor.jsx';
import MethodistAnalytics from './pages/methodist/Analytics.jsx';

// Super Admin (ветка shohjahon) — свой Layout/дизайн, смонтирован под /super.
import AuthSync from './pages/super/AuthSync.jsx';
import SuperAdminLayout from './pages/super/layouts/SuperAdminLayout.tsx';
import SuperDashboardPage from './pages/super/features/superadmin/dashboard/DashboardPage.tsx';
import SuperBranchesPage from './pages/super/features/superadmin/branches/BranchesPage.tsx';
import SuperBranchDetailPage from './pages/super/features/superadmin/branches/BranchDetailPage.tsx';
import SuperUsersPage from './pages/super/features/superadmin/users/UsersPage.tsx';
import SuperSettingsPage from './pages/super/features/superadmin/settings/SettingsPage.tsx';
import SuperComingSoonPage from './pages/super/features/superadmin/ComingSoonPage.tsx';

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function RequireSuperadmin({ children }) {
  const { user } = useAuth();
  return user?.role === 'superadmin' ? children : <Navigate to="/" replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === 'superadmin') return <Navigate to="/super" replace />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'mentor') return <MentorDashboard />;
  if (role === 'methodist') return <MethodistDashboard />;
  return <AdminDashboard />;
}

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

      {/* Super Admin — отдельный Layout (не общий Layout ниже), тот же логин/токен (AuthSync) */}
      <Route
        path="/super"
        element={
          <Protected>
            <RequireSuperadmin>
              <AuthSync>
                <SuperAdminLayout />
              </AuthSync>
            </RequireSuperadmin>
          </Protected>
        }
      >
        <Route index element={<SuperDashboardPage />} />
        <Route path="branches" element={<SuperBranchesPage />} />
        <Route path="branches/:id" element={<SuperBranchDetailPage />} />
        <Route path="users" element={<SuperUsersPage />} />
        <Route path="users/:id" element={<SuperComingSoonPage title="Сотрудник" />} />
        <Route path="settings" element={<SuperSettingsPage />} />
        <Route path="students" element={<SuperComingSoonPage title="Студенты" />} />
        <Route path="students/:id" element={<SuperComingSoonPage title="Студент" />} />
        <Route path="groups" element={<SuperComingSoonPage title="Группы" />} />
        <Route path="groups/:id" element={<SuperComingSoonPage title="Группа" />} />
        <Route path="attendance" element={<SuperComingSoonPage title="Посещаемость" />} />
        <Route path="attendance/:id" element={<SuperComingSoonPage title="Занятие" />} />
        <Route path="stats" element={<SuperComingSoonPage title="Отчёты и статистика" />} />
        <Route path="reminders" element={<SuperComingSoonPage title="Уведомления" />} />
        <Route path="audit" element={<SuperComingSoonPage title="Журнал аудита" />} />
        <Route path="announcements" element={<SuperComingSoonPage title="Объявления" />} />
      </Route>

      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardRedirect />} />
        {/* Methodist routes */}
        <Route path="/methodist/types" element={<TrainingTypes />} />
        <Route path="/methodist/types/:trainingTypeId/topics" element={<Topics />} />
        <Route path="/methodist/topics/:topicId/lessons" element={<Lessons />} />
        <Route path="/methodist/lessons/:lessonId/edit" element={<LessonEditor />} />
        <Route path="/methodist/analytics" element={<MethodistAnalytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
