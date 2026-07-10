import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import SuperMoved from './pages/SuperMoved.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import MentorDashboard from './pages/mentor/Dashboard.jsx';
import MethodistDashboard from './pages/methodist/Dashboard.jsx';
import TrainingTypes from './pages/methodist/TrainingTypes.jsx';
import Topics from './pages/methodist/Topics.jsx';
import Lessons from './pages/methodist/Lessons.jsx';
import LessonEditor from './pages/methodist/LessonEditor.jsx';
import MethodistAnalytics from './pages/methodist/Analytics.jsx';

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  // Super Admin переехал в отдельное приложение frontend/superadmin (shohjahon).
  if (role === 'superadmin') return <SuperMoved />;
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
