import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [overlay, setOverlay] = useState(null); // { color, phase: 'enter' | 'exit' | null }
  const timeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const toggle = useCallback(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#F6FBEA';

    // Phase 1: overlay fades in using CSS animation (theme-enter)
    setOverlay({ color: bg, phase: 'enter' });

    // Phase 2: when fully visible, switch theme
    timeoutRef.current = setTimeout(() => {
      setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

      // Phase 3: start fading out overlay using CSS animation (theme-exit)
      timeoutRef.current = setTimeout(() => {
        setOverlay(prev => prev ? { ...prev, phase: 'exit' } : null);

        // Phase 4: remove overlay after exit animation
        timeoutRef.current = setTimeout(() => {
          setOverlay(null);
        }, 650);
      }, 50);
    }, 300);
  }, []);

  const overlayClass = overlay
    ? `fixed inset-0 z-[99999] pointer-events-none ${
        overlay.phase === 'enter'
          ? 'animate-[theme-enter_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards]'
          : 'animate-[theme-exit_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]'
      }`
    : '';

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
      {overlay && <div className={overlayClass} style={{ background: overlay.color }} />}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
