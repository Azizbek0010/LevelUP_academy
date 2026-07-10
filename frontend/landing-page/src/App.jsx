import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Roles from './pages/Roles.jsx';
import Finance from './pages/Finance.jsx';
import Gamification from './pages/Gamification.jsx';
import Contacts from './pages/Contacts.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        {/* Лендинг живёт на /landing — корень редиректит туда */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/landing" element={<Home />} />
        <Route path="/landing/features" element={<Features />} />
        <Route path="/landing/roles" element={<Roles />} />
        <Route path="/landing/finance" element={<Finance />} />
        <Route path="/landing/gamification" element={<Gamification />} />
        <Route path="/landing/contacts" element={<Contacts />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
