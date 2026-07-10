import { useEffect } from 'react';

/** Global keyboard shortcut listener. `combo` examples: 'mod+k', 'esc', 'shift+/'. */
export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void): void {
  useEffect(() => {
    const parts = combo.toLowerCase().split('+');
    const needMod = parts.includes('mod');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');
    const key = parts[parts.length - 1] ?? '';

    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      if (needMod !== isMod && needMod) return;
      if (needShift !== e.shiftKey) return;
      if (needAlt !== e.altKey) return;
      if (e.key.toLowerCase() !== key) return;
      handler(e);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo, handler]);
}
