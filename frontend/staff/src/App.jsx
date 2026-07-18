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
const SuperStudents = lazy(() => import('./pages/super/Students.jsx'));
const SuperGroups = lazy(() => import('./pages/super/Groups.jsx'));
const SuperStats = lazy(() => import('./pages/super/Stats.jsx'));
const SuperAnnouncements = lazy(() => import('./pages/super/Announcements.jsx'));
const SuperReminders = lazy(() => import('./pages/super/Reminders.jsx'));
const SuperAudit = lazy(() => import('./pages/super/Audit.jsx'));
const SuperAttendance = lazy(() => import('./pages/super/Attendance.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminStudents = lazy(() => import('./pages/admin/Students.jsx'));
const AdminGroups = lazy(() => import('./pages/admin/Groups.jsx'));
const AdminGroupDetail = lazy(() => import('./pages/admin/GroupDetail.jsx'));
const AdminStudentDetail = lazy(() => import('./pages/admin/StudentDetail.jsx'));
const AdminPayments = lazy(() => import('./pages/admin/Payments.jsx'));
const AdminExpenses = lazy(() => import('./pages/admin/Expenses.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminMentors = lazy(() => import('./pages/admin/Mentors.jsx'));
const AdminChat = lazy(() => import('./pages/admin/Chat.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/Settings.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/Profile.jsx'));

const MentorDashboard = lazy(() => import('./pages/mentor/Dashboard.jsx'));
const MentorChat = lazy(() => import('./pages/mentor/Chat.jsx'));
const MentorGroups = lazy(() => import('./pages/mentor/Groups.jsx'));
const MentorGroupWorkspace = lazy(() => import('./pages/mentor/group/GroupWorkspace.jsx'));
const MentorProfile = lazy(() => import('./pages/mentor/Profile.jsx'));
const MentorStudents = lazy(() => import('./pages/mentor/Students.jsx'));
const MentorStudentDetail = lazy(() => import('./pages/mentor/StudentDetail.jsx'));

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

function RoleView({ views }) {
  const { user } = useAuth();
  const Comp = views[user?.role];
  return Comp ? <Comp /> : <Navigate to="/" replace />;
}

/**
 * У ментора журнал, тесты и коины больше не отдельные экраны — это вкладки
 * внутри группы. Старые адреса оставлены живыми: по ним уже могли разойтись
 * ссылки, и молчаливый 404 хуже переадресации. `/groups` сам откроет первую
 * группу на нужной вкладке.
 */
function MentorLegacyRedirect({ tab }) {
  return <Navigate to={`/groups?tab=${tab}`} replace />;
}

const SW = ({ children }) => <Suspense fallback={<Splash />}>{children}</Suspense>;

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<SW><DashboardRedirect /></SW>} />

        {/* Shared paths dispatched by role */}
        <Route path="/chat" element={<SW><RoleView views={{ mentor: MentorChat, admin: AdminChat }} /></SW>} />
        <Route path="/groups" element={<SW><RoleView views={{ superadmin: SuperGroups, admin: AdminGroups, mentor: MentorGroups }} /></SW>} />
        {/* Карточка группы. У админа она была под RoleGuard(['admin']); теперь
            тот же путь обслуживает и ментора — RoleView так же не пускает
            чужие роли (уводит на «/»), поэтому доступ админа не расширился. */}
        <Route path="/groups/:id" element={<SW><RoleView views={{ admin: AdminGroupDetail, mentor: MentorGroupWorkspace }} /></SW>} />
        <Route path="/reports" element={<SW><RoleView views={{ superadmin: SuperReports, admin: AdminReports }} /></SW>} />
        <Route path="/settings" element={<SW><RoleView views={{ superadmin: SuperSettings, admin: AdminSettings }} /></SW>} />
        <Route path="/profile" element={<SW><RoleView views={{ admin: AdminProfile, superadmin: AdminProfile, mentor: MentorProfile }} /></SW>} />
        <Route path="/attendance" element={<SW><RoleView views={{ superadmin: SuperAttendance, mentor: () => <MentorLegacyRedirect tab="davomat" /> }} /></SW>} />
        <Route path="/tests" element={<SW><RoleView views={{ mentor: () => <MentorLegacyRedirect tab="testlar" /> }} /></SW>} />
        <Route path="/coins" element={<SW><RoleView views={{ mentor: () => <MentorLegacyRedirect tab="koinlar" /> }} /></SW>} />
        <Route path="/students" element={<SW><RoleView views={{ admin: AdminStudents, superadmin: SuperStudents, mentor: MentorStudents }} /></SW>} />

        {/* Admin routes */}
        {/* Карточка ученика: у админа своя, у ментора — статистика по его
            предмету. RoleView так же не пускает чужие роли, как RoleGuard. */}
        <Route
          path="/students/:id"
          element={<SW><RoleView views={{ admin: AdminStudentDetail, mentor: MentorStudentDetail }} /></SW>}
        />

        <Route element={<RoleGuard allow={['admin']} />}>
          <Route path="/payments" element={<SW><AdminPayments /></SW>} />
          <Route path="/expenses" element={<SW><AdminExpenses /></SW>} />
          <Route path="/mentors" element={<SW><AdminMentors /></SW>} />
        </Route>

        {/* Super Admin routes */}
        <Route element={<RoleGuard allow={['superadmin']} />}>
          <Route path="/branches" element={<SW><SuperBranches /></SW>} />
          <Route path="/branches/:id" element={<SW><SuperBranchDetail /></SW>} />
          <Route path="/admins" element={<SW><SuperAdmins /></SW>} />
          <Route path="/stats" element={<SW><SuperStats /></SW>} />
          <Route path="/announcements" element={<SW><SuperAnnouncements /></SW>} />
          <Route path="/reminders" element={<SW><SuperReminders /></SW>} />
          <Route path="/audit" element={<SW><SuperAudit /></SW>} />
        </Route>

        {/* Methodist routes */}
        <Route path="/methodist/types" element={<SW><TrainingTypes /></SW>} />
        <Route path="/methodist/types/:trainingTypeId/topics" element={<SW><Topics /></SW>} />
        <Route path="/methodist/topics/:topicId/lessons" element={<SW><Lessons /></SW>} />
        <Route path="/methodist/lessons/:lessonId/edit" element={<SW><LessonEditor /></SW>} />
        <Route path="/methodist/analytics" element={<SW><MethodistAnalytics /></SW>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
