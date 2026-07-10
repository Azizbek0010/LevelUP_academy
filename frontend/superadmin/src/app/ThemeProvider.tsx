import { useEffect, type ReactNode } from 'react';
import { applyTheme, useSettingsStore, watchSystemTheme } from '../shared/stores/settings';

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactElement {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    return watchSystemTheme(() => applyTheme('system'));
  }, [theme]);

  return <>{children}</>;
}
