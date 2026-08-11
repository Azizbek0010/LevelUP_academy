import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';

import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import RoleGuard from './components/RoleGuard.jsx';
import Splash from './components/Splash.jsx';
// Lazy-loaded pages
const SuperDashboard = lazy(() => import('./pages/super/Dashboard.jsx'));
const SuperBranches = lazy(() => import('./pages/super/Branches.jsx'));
const SuperAdmins = lazy(() => import('./pages/super/Admins.jsx'));
const SuperStaffDetail = lazy(() => import('./pages/super/StaffDetail.jsx'));
const SuperBranchDetail = lazy(() => import('./pages/super/BranchDetail.jsx'));
const SuperSettings = lazy(() => import('./pages/super/Settings.jsx'));
const SuperTrainingTypes = lazy(() => import('./pages/super/TrainingTypes.jsx'));
const SuperShopCatalog = lazy(() => import('./pages/super/ShopCatalog.jsx'));
const SuperStudents = lazy(() => import('./pages/super/Students.jsx'));
const SuperGroups = lazy(() => import('./pages/super/Groups.jsx'));
const SuperStats = lazy(() => import('./pages/super/Stats.jsx'));
const SuperAnnouncements = lazy(() => import('./pages/super/Announcements.jsx'));
const SuperReminders = lazy(() => import('./pages/super/Reminders.jsx'));
const SuperAudit = lazy(() => import('./pages/super/Audit.jsx'));
const SuperDiscipline = lazy(() => import('./pages/super/Discipline.jsx'));
const SuperAttendance = lazy(() => import('./pages/super/Attendance.jsx'));

const BranchManagerDashboard = lazy(() => import('./pages/branch-manager/Dashboard.jsx'));
const BranchManagerIncome = lazy(() => import('./pages/branch-manager/Income.jsx'));
const BranchManagerExpenses = lazy(() => import('./pages/branch-manager/Expenses.jsx'));
const BranchManagerReports = lazy(() => import('./pages/branch-manager/Reports.jsx'));
const BranchManagerBranch = lazy(() => import('./pages/branch-manager/Branch.jsx'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminStudents = lazy(() => import('./pages/admin/Students.jsx'));
const AdminGroups = lazy(() => import('./pages/admin/Groups.jsx'));
const AdminGroupDetail = lazy(() => import('./pages/admin/GroupDetail.jsx'));
const AdminStudentDetail = lazy(() => import('./pages/admin/StudentDetail.jsx'));
const AdminPayments = lazy(() => import('./pages/admin/Payments.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminMentors = lazy(() => import('./pages/admin/Mentors.jsx'));
const AdminMentorDetail = lazy(() => import('./pages/admin/MentorDetail.jsx'));
const AdminChat = lazy(() => import('./pages/admin/Chat.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/Profile.jsx'));

const MentorDashboard = lazy(() => import('./pages/mentor/Dashboard.jsx'));
const MentorChat = lazy(() => import('./pages/mentor/Chat.jsx'));
const MentorGroups = lazy(() => import('./pages/mentor/Groups.jsx'));
const MentorGroupWorkspace = lazy(() => import('./pages/mentor/group/GroupWorkspace.jsx'));
const MentorProfile = lazy(() => import('./pages/mentor/Profile.jsx'));
const MentorStudents = lazy(() => import('./pages/mentor/Students.jsx'));
const MentorStudentDetail = lazy(() => import('./pages/mentor/StudentDetail.jsx'));

const MethodistDashboard = lazy(() => import('./pages/methodist/Dashboard.jsx'));
const MethodistProfile = lazy(() => import('./pages/methodist/Profile.jsx'));
const TrainingTypes = lazy(() => import('./pages/methodist/TrainingTypes.jsx'));
const Topics = lazy(() => import('./pages/methodist/Topics.jsx'));
const Lessons = lazy(() => import('./pages/methodist/Lessons.jsx'));
const LessonEditor = lazy(() => import('./pages/methodist/LessonEditor.jsx'));
const MethodistAnalytics = lazy(() => import('./pages/methodist/Analytics.jsx'));

function Protected({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  return token ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  const role = user?.role;
  if (role === 'seo') return <SuperDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'branch_manager') return <BranchManagerDashboard />;
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

/**
 * SEO Отчёты и Статистика были одной и той же выборкой (итоги +
 * разбивка по филиалам) на двух страницах — слиты в Статистику 2026-07-28.
 * `/reports` у Admin'а остаётся своей страницей (RoleView ниже), а старые
 * ссылки на super-Отчёты уводим на /stats вместо 404.
 */
function SuperReportsRedirect() {
  return <Navigate to="/stats" replace />;
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
        <Route path="/chat" element={<SW><RoleView views={{ mentor: MentorChat, admin: AdminChat, branch_manager: AdminChat }} /></SW>} />
        <Route path="/groups" element={<SW><RoleView views={{ seo: SuperGroups, admin: AdminGroups, branch_manager: AdminGroups, mentor: MentorGroups }} /></SW>} />
        {/* Карточка группы. У админа она была под RoleGuard(['admin']); теперь
            тот же путь обслуживает и ментора — RoleView так же не пускает
            чужие роли (уводит на «/»), поэтому доступ админа не расширился.
            branch_manager получил тот же admin-компонент 07.08.2026 — скоуп
            по филиалу у обеих ролей уже одинаковый (authorize.js). */}
        <Route path="/groups/:id" element={<SW><RoleView views={{ admin: AdminGroupDetail, branch_manager: AdminGroupDetail, mentor: MentorGroupWorkspace }} /></SW>} />
        <Route path="/reports" element={<SW><RoleView views={{ seo: SuperReportsRedirect, admin: AdminReports, branch_manager: BranchManagerReports }} /></SW>} />
        {/* admin: AdminSettings убран — файл page/admin/Settings.jsx удалён (Abduloh),
            импорта не было (мёртвая ссылка), в adminNav такого пункта тоже нет. */}
        <Route path="/settings" element={<SW><RoleView views={{ seo: SuperSettings }} /></SW>} />
        <Route path="/profile" element={<SW><RoleView views={{ admin: AdminProfile, seo: AdminProfile, mentor: MentorProfile, methodist: MethodistProfile }} /></SW>} />
        <Route path="/attendance" element={<SW><RoleView views={{ seo: SuperAttendance, mentor: () => <MentorLegacyRedirect tab="davomat" /> }} /></SW>} />
        <Route path="/tests" element={<SW><RoleView views={{ mentor: () => <MentorLegacyRedirect tab="testlar" /> }} /></SW>} />
        <Route path="/coins" element={<SW><RoleView views={{ mentor: () => <MentorLegacyRedirect tab="koinlar" /> }} /></SW>} />
        <Route path="/students" element={<SW><RoleView views={{ admin: AdminStudents, branch_manager: AdminStudents, seo: SuperStudents, mentor: MentorStudents }} /></SW>} />

        {/* Admin routes */}
        {/* Карточка ученика: у админа своя, у ментора — статистика по его
            предмету. RoleView так же не пускает чужие роли, как RoleGuard.
            branch_manager — тот же admin-компонент (07.08.2026, см. /groups). */}
        <Route
          path="/students/:id"
          element={<SW><RoleView views={{ admin: AdminStudentDetail, branch_manager: AdminStudentDetail, mentor: MentorStudentDetail }} /></SW>}
        />

        {/* branch_manager получил доступ 07.08.2026 — те же admin-страницы,
            бэкенд уже пускает эту роль в свою же branchId (admin.routes.js). */}
        <Route element={<RoleGuard allow={['admin', 'branch_manager']} />}>
          <Route path="/payments" element={<SW><AdminPayments /></SW>} />
          {/* deep-link на конкретного студента+сумму — Abduloh, автоподстановка суммы из группы */}
          <Route path="/payments/:studentId/:amount?" element={<SW><AdminPayments /></SW>} />
          <Route path="/mentors" element={<SW><AdminMentors /></SW>} />
          <Route path="/mentors/:id" element={<SW><AdminMentorDetail /></SW>} />
          {/* Магазин и Расписание убраны из UI 11.08.2026 (Karis): пункты меню
              удалены, маршруты закомментированы до востребования. */}
          {/* <Route path="/shop" element={<SW><AdminShop /></SW>} /> */}
          {/* <Route path="/schedule" element={<SW><AdminSchedule /></SW>} /> */}
        </Route>
        {/* Расходы — с 11.08.2026 только у branch manager (Karis); у админа
            раздел убран из UI, страница осталась для менеджера. */}
        <Route path="/expenses" element={<SW><RoleView views={{ branch_manager: BranchManagerExpenses }} /></SW>} />

        {/* Branch Manager: свой обзорный дашборд + разделы, специфичные для роли */}
        <Route element={<RoleGuard allow={['branch_manager']} />}>
          <Route path="/income" element={<SW><BranchManagerIncome /></SW>} />
          <Route path="/branch" element={<SW><BranchManagerBranch /></SW>} />
        </Route>

        {/* SEO routes */}
        <Route element={<RoleGuard allow={['seo']} />}>
          <Route path="/branches" element={<SW><SuperBranches /></SW>} />
          <Route path="/branches/:id" element={<SW><SuperBranchDetail /></SW>} />
          <Route path="/admins" element={<SW><SuperAdmins /></SW>} />
          <Route path="/admins/:role/:id" element={<SW><SuperStaffDetail /></SW>} />
          <Route path="/stats" element={<SW><SuperStats /></SW>} />
          <Route path="/announcements" element={<SW><SuperAnnouncements /></SW>} />
          <Route path="/reminders" element={<SW><SuperReminders /></SW>} />
          <Route path="/audit" element={<SW><SuperAudit /></SW>} />
          <Route path="/methodics" element={<SW><SuperTrainingTypes /></SW>} />
          <Route path="/shop-catalog" element={<SW><SuperShopCatalog /></SW>} />
        <Route path="/discipline" element={<SW><SuperDiscipline /></SW>} />
        </Route>

        {/* Methodist routes */}
        <Route element={<RoleGuard allow={['methodist']} />}>
          <Route path="/methodist/types" element={<SW><TrainingTypes /></SW>} />
          <Route path="/methodist/types/:trainingTypeId/topics" element={<SW><Topics /></SW>} />
          <Route path="/methodist/topics/:topicId/lessons" element={<SW><Lessons /></SW>} />
          <Route path="/methodist/lessons/:lessonId/edit" element={<SW><LessonEditor /></SW>} />
          <Route path="/methodist/analytics" element={<SW><MethodistAnalytics /></SW>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
