import { useSettingsStore } from '../stores/settings';
import { translate } from './dict';

export function useT(): (key: string) => string {
  const lang = useSettingsStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}
