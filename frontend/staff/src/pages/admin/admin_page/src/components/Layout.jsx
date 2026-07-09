import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';

export default function Layout({ children, pageTitle, pageSubtitle }) {
  const { isAuth } = useAuth();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // AuthContext auto-initializes mock auth in demo mode (no page reload needed)
  if (!isAuth) {
    return null;
  }

  const dateStr = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle || 'Boshqaruv paneli'}
          subtitle={`${pageSubtitle || 'LevelUp Akademiyasi'} · ${dateStr}`}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
          sidebarOpen={sidebarOpen}
        />
        {/* ⚡ Scroll container with GPU acceleration */}
        <div className="flex-1 overflow-y-auto relative" style={{ willChange: 'scroll-position', WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-5 pb-8 space-y-5">
            <div className="page-enter">
              {children}
            </div>
            <footer className="pt-4 pb-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
              <span>© 2026 LevelUp Academy</span>
              <div className="flex items-center gap-4">
                <span className="hover:text-[var(--text)] cursor-pointer transition-colors">Yordam</span>
                <span className="hover:text-[var(--text)] cursor-pointer transition-colors">Hujjatlar</span>
              </div>
            </footer>
          </div>
          
          {/* Theme toggle - bottom left, smooth animation, no layout shift */}
          <button
            onClick={toggle}
            className="fixed bottom-4 left-4 z-50 w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-500 ease-out"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: '0 4px 16px var(--shadow-lg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--green)';
              e.currentTarget.style.color = 'var(--green)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={theme === 'dark' ? 'Yorug\' tema' : 'Qorong\'u tema'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <HiOutlineSun className="w-5 h-5 transition-transform duration-500 ease-out" style={{ transform: 'rotate(0deg) scale(1)' }} />
            ) : (
              <HiOutlineMoon className="w-5 h-5 transition-transform duration-500 ease-out" style={{ transform: 'rotate(0deg) scale(1)' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
