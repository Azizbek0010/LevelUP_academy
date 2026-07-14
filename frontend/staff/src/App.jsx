import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import RoleGuard from './components/RoleGuard.jsx';
import Splash from './components/Splash.jsx';

// Lazy-loaded pages
const SuperDashboard = lazy(() => import('./pages/super/Dashboard.jsx'));
const SuperBranches = lazy(() => import('./pages/super/Branches.jsx'));
const SuperAdmins = lazy(() => import('./pages/super/Admins.jsx'));
const SuperBranchDetail = lazy(() => import('./pages/super/BranchDetail.jsx'));
const SuperReports = lazy(() => import('./pages/super/Reports.jsx'));
const SuperSettings = lazy(() => import('./pages/super/Settings.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminStudents = lazy(() => import('./pages/admin/Students.jsx'));
const AdminGroups = lazy(() => import('./pages/admin/Groups.jsx'));
const AdminGroupDetail = lazy(() => import('./pages/admin/GroupDetail.jsx'));
const AdminPayments = lazy(() => import('./pages/admin/Payments.jsx'));
const AdminExpenses = lazy(() => import('./pages/admin/Expenses.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminMentors = lazy(() => import('./pages/admin/Mentors.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));

const MentorDashboard = lazy(() => import('./pages/mentor/Dashboard.jsx'));
const MentorGroups = lazy(() => import('./pages/mentor/Groups.jsx'));
const MentorAttendance = lazy(() => import('./pages/mentor/Attendance.jsx'));
const MentorHomework = lazy(() => import('./pages/mentor/Homework.jsx'));
const MentorCoins = lazy(() => import('./pages/mentor/Coins.jsx'));

const MethodistDashboard = lazy(() => import('./pages/methodist/Dashboard.jsx'));
const TrainingTypes = lazy(() => import('./pages/methodist/TrainingTypes.jsx'));
const Topics = lazy(() => import('./pages/methodist/Topics.jsx'));
const Lessons = lazy(() => import('./pages/methodist/Lessons.jsx'));
const LessonEditor = lazy(() => import('./pages/methodist/LessonEditor.jsx'));
const MethodistAnalytics = lazy(() => import('./pages/methodist/Analytics.jsx'));

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === 'superadmin') return <SuperDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'mentor') return <MentorDashboard />;
  if (role === 'methodist') return <MethodistDashboard />;
  return <AdminDashboard />;
}

// Один путь, разные компоненты по роли (каждый юзер — одна роль).
function RoleView({ views }) {
  const { user } = useAuth();
  const Comp = views[user?.role];
  return Comp ? <Comp /> : <Navigate to="/" replace />;
}

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Splash />}>{children}</Suspense>
);

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
        <Route path="/" element={<SuspenseWrapper><DashboardRedirect /></SuspenseWrapper>} />

        {/* Общие пути, диспетчеризуемые по роли */}
        <Route path="/groups" element={<SuspenseWrapper><RoleView views={{ mentor: MentorGroups, admin: AdminGroups }} /></SuspenseWrapper>} />
        <Route path="/reports" element={<SuspenseWrapper><RoleView views={{ superadmin: SuperReports, admin: AdminReports }} /></SuspenseWrapper>} />
        <Route path="/settings" element={<SuspenseWrapper><RoleView views={{ superadmin: SuperSettings, admin: AdminSettings }} /></SuspenseWrapper>} />

        {/* Mentor routes */}
        <Route path="/attendance" element={<SuspenseWrapper><MentorAttendance /></SuspenseWrapper>} />
        <Route path="/homework" element={<SuspenseWrapper><MentorHomework /></SuspenseWrapper>} />
        <Route path="/coins" element={<SuspenseWrapper><MentorCoins /></SuspenseWrapper>} />

        {/* Admin routes — RoleGuard admin */}
        <Route element={<RoleGuard allow={['admin']} />}>
          <Route path="/students" element={<SuspenseWrapper><AdminStudents /></SuspenseWrapper>} />
          <Route path="/groups/:id" element={<SuspenseWrapper><AdminGroupDetail /></SuspenseWrapper>} />
          <Route path="/payments" element={<SuspenseWrapper><AdminPayments /></SuspenseWrapper>} />
          <Route path="/expenses" element={<SuspenseWrapper><AdminExpenses /></SuspenseWrapper>} />
          <Route path="/mentors" element={<SuspenseWrapper><AdminMentors /></SuspenseWrapper>} />
        </Route>

        {/* Super Admin routes — RoleGuard superadmin */}
        <Route element={<RoleGuard allow={['superadmin']} />}>
          <Route path="/branches" element={<SuspenseWrapper><SuperBranches /></SuspenseWrapper>} />
          <Route path="/branches/:id" element={<SuspenseWrapper><SuperBranchDetail /></SuspenseWrapper>} />
          <Route path="/admins" element={<SuspenseWrapper><SuperAdmins /></SuspenseWrapper>} />
        </Route>

        {/* Methodist routes */}
        <Route path="/methodist/types" element={<SuspenseWrapper><TrainingTypes /></SuspenseWrapper>} />
        <Route path="/methodist/types/:trainingTypeId/topics" element={<SuspenseWrapper><Topics /></SuspenseWrapper>} />
        <Route path="/methodist/topics/:topicId/lessons" element={<SuspenseWrapper><Lessons /></SuspenseWrapper>} />
        <Route path="/methodist/lessons/:lessonId/edit" element={<SuspenseWrapper><LessonEditor /></SuspenseWrapper>} />
        <Route path="/methodist/analytics" element={<SuspenseWrapper><MethodistAnalytics /></SuspenseWrapper>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
