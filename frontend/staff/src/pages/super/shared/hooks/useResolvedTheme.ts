import { useEffect, useState } from 'react';

/**
 * Returns 'light' or 'dark' based on the currently applied `data-theme`
 * attribute on <html>. Reactive — updates when the theme changes.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => detect());

  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(detect()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}

function detect(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
