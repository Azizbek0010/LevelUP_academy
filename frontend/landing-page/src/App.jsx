import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Features from './pages/Features.jsx';
import Roles from './pages/Roles.jsx';
import Finance from './pages/Finance.jsx';
import Pricing from './pages/Pricing.jsx';
import ForLanguageSchool from './pages/ForLanguageSchool.jsx';
import Blog from './pages/Blog.jsx';
import BlogArticle from './pages/BlogArticle.jsx';
import Gamification from './pages/Gamification.jsx';
import Contacts from './pages/Contacts.jsx';
import NotFound from './pages/NotFound.jsx';

/**
 * Канонические пути лендинга. Русская версия живёт на них как есть, узбекская — под
 * префиксом /uz (см. src/i18n/index.js). Один список на оба языка: разойтись они не могут.
 * Держать в синхроне с ROUTES в scripts/prerender.js и с public/sitemap.xml.
 */
export const PAGES = [
  { path: '/landing', element: <Home /> },
  { path: '/landing/features', element: <Features /> },
  { path: '/landing/roles', element: <Roles /> },
  { path: '/landing/finance', element: <Finance /> },
  { path: '/landing/pricing', element: <Pricing /> },
  { path: '/landing/for-language-school', element: <ForLanguageSchool /> },
  { path: '/landing/blog', element: <Blog /> },
  { path: '/landing/blog/:slug', element: <BlogArticle /> },
  { path: '/landing/gamification', element: <Gamification /> },
  { path: '/landing/contacts', element: <Contacts /> },
];

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
        {/* В проде корень редиректит Vercel (308). Здесь — для dev-сервера и для
            прямого перехода внутри SPA. */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="/uz" element={<Navigate to="/uz/landing" replace />} />

        {PAGES.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        {PAGES.map(({ path, element }) => (
          <Route key={`uz${path}`} path={`/uz${path}`} element={element} />
        ))}
        {/* Битый URL — это 404, а не повод молча увести на главную: редирект
            делал из любого несуществующего адреса «живую» страницу (soft-404). */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
