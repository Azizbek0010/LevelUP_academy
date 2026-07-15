import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { ChildProvider } from './child-context.jsx';
import Splash from './components/Splash.jsx';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Attendance from './pages/Attendance.jsx';
import Grades from './pages/Grades.jsx';
import Debt from './pages/Debt.jsx';
import Chat from './pages/Chat.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function ParentLayout() {
  return (
    <ChildProvider>
      <Layout />
    </ChildProvider>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'student') {
    const url = import.meta.env.VITE_STUDENT_URL || 'http://localhost:5176';
    window.location.href = url;
    return <Splash />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { token, loading } = useAuth();
  if (loading) return <Splash />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

        <Route
          path="/"
          element={
            <Protected>
              <HomeRedirect />
            </Protected>
          }
        />

        <Route
          element={
            <Protected>
              <ParentLayout />
            </Protected>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/grades" element={<Grades />} />
          <Route path="/debt" element={<Debt />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
