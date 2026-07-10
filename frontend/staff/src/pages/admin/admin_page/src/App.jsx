import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import Toast from './components/Toast.jsx';

const pageTitles = {
  '/': { title: 'Boshqaruv paneli', subtitle: 'Umumiy ko\'rinish va tahlillar' },
  '/students': { title: 'Talabalar', subtitle: 'Talabalar bilan ishlash' },
  '/groups': { title: 'Guruhlar', subtitle: 'O\'quv guruhlari' },
  '/payments': { title: "To'lovlar", subtitle: 'Moliyaviy operatsiyalar' },
  '/expenses': { title: 'Xarajatlar', subtitle: 'Xarajatlar hisobi' },
  '/reports': { title: 'Hisobotlar', subtitle: 'Tahlil va statistika' },
  '/mentors': { title: 'Mentorlar', subtitle: "O'qituvchilar" },
  '/chat': { title: 'Chat', subtitle: 'Xabarlar' },
};

function findPageTitle(pathname) {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Dynamic routes like /groups/:id
  if (pathname.startsWith('/groups/')) return { title: 'Guruh tafsilotlari', subtitle: 'Guruh haqida ma\'lumot' };
  if (pathname.startsWith('/students/')) return { title: 'Talaba tafsilotlari', subtitle: 'Talaba haqida ma\'lumot' };
  return { title: 'Boshqaruv paneli', subtitle: 'LevelUp Academy' };
}

function AppContent() {
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const pageInfo = findPageTitle(location.pathname);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  return (
    <Layout pageTitle={pageInfo.title} pageSubtitle={pageInfo.subtitle}>
      <Outlet />
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={closeToast} />}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
