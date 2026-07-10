import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  CornerDownLeft,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Users,
  Users2,
} from 'lucide-react';
import clsx from 'clsx';
import { branchesApi } from '../api/endpoints/branches';
import { adminsApi } from '../api/endpoints/admins';
import { useHotkey } from '../hooks/useHotkey';
import { useSettingsStore } from '../stores/settings';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  action: () => void;
  keywords?: string;
}

export function CommandPalette(): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLang = useSettingsStore((s) => s.setLang);

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
    enabled: open,
  });

  const adminsQuery = useQuery({
    queryKey: ['admins'],
    queryFn: () => adminsApi.list(),
    enabled: open,
  });

  useHotkey('mod+k', (e) => {
    e.preventDefault();
    setOpen((v) => !v);
  });

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-command-palette', handler);
    return () => window.removeEventListener('open-command-palette', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const allItems = useMemo<Item[]>(() => {
    const close = () => setOpen(false);
    const nav = (to: string) => () => {
      close();
      navigate(to);
    };

    const actions: Item[] = [
      { id: 'nav-dash', title: 'Дашборд', icon: LayoutDashboard, group: 'Навигация', action: nav('/superadmin') },
      { id: 'nav-branches', title: 'Филиалы', icon: Building2, group: 'Навигация', action: nav('/superadmin/branches') },
      { id: 'nav-users', title: 'Админы', icon: Users, group: 'Навигация', action: nav('/superadmin/users') },
      { id: 'nav-stats', title: 'Отчёты', icon: BarChart3, group: 'Навигация', action: nav('/superadmin/stats') },
      { id: 'nav-reminders', title: 'Уведомления', icon: Bell, group: 'Навигация', action: nav('/superadmin/reminders') },
      { id: 'nav-students', title: 'Студенты', icon: GraduationCap, group: 'Навигация', action: nav('/superadmin/students') },
      { id: 'nav-groups', title: 'Группы', icon: Users2, group: 'Навигация', action: nav('/superadmin/groups') },
      { id: 'nav-attendance', title: 'Посещаемость', icon: CalendarCheck2, group: 'Навигация', action: nav('/superadmin/attendance') },
      { id: 'nav-settings', title: 'Настройки', icon: Settings, group: 'Навигация', action: nav('/superadmin/settings') },

      { id: 'action-branch', title: 'Открыть филиал', subtitle: 'Создать новый', icon: Plus, group: 'Действия', action: nav('/superadmin/branches?create=1') },
      { id: 'action-student', title: 'Добавить студента', icon: Plus, group: 'Действия', action: nav('/superadmin/students?create=1') },
      { id: 'action-user', title: 'Добавить админа', icon: Plus, group: 'Действия', action: nav('/superadmin/users?create=1') },
      { id: 'action-group', title: 'Создать группу', icon: Plus, group: 'Действия', action: nav('/superadmin/groups?create=1') },

      { id: 'theme-light', title: 'Тема: светлая', icon: Sun, group: 'Настройки', action: () => { setTheme('light'); close(); }, keywords: 'light theme svetlaya' },
      { id: 'theme-dark', title: 'Тема: тёмная', icon: Moon, group: 'Настройки', action: () => { setTheme('dark'); close(); }, keywords: 'dark theme temnaya' },
      { id: 'theme-system', title: 'Тема: системная', icon: Sparkles, group: 'Настройки', action: () => { setTheme('system'); close(); } },
      { id: 'lang-ru', title: 'Язык: Русский', icon: Sparkles, group: 'Настройки', action: () => { setLang('ru'); close(); }, keywords: 'russian ru' },
      { id: 'lang-uz', title: 'Til: O\'zbek', icon: Sparkles, group: 'Настройки', action: () => { setLang('uz'); close(); }, keywords: 'uzbek uz' },
      { id: 'lang-en', title: 'Lang: English', icon: Sparkles, group: 'Настройки', action: () => { setLang('en'); close(); } },
    ];

    const branchItems: Item[] =
      branchesQuery.data?.branches.map((b) => ({
        id: `branch-${b.id}`,
        title: b.name,
        subtitle: b.address ?? undefined,
        icon: Building2,
        group: 'Филиалы',
        action: nav(`/superadmin/branches/${b.id}`),
        keywords: (b.phone ?? '') + ' ' + (b.address ?? ''),
      })) ?? [];

    const adminItems: Item[] =
      adminsQuery.data?.admins.map((u) => ({
        id: `admin-${u.id}`,
        title: `${u.lastName} ${u.firstName}`,
        subtitle: `admin · ${u.email}`,
        icon: Users,
        group: 'Администраторы',
        action: nav('/superadmin/users'),
        keywords: u.email + ' ' + (u.phone ?? ''),
      })) ?? [];

    return [...actions, ...branchItems, ...adminItems];
  }, [branchesQuery.data, adminsQuery.data, navigate, setTheme, setLang]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.subtitle ?? '').toLowerCase().includes(q) ||
        (i.keywords ?? '').toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // Group by group name preserving order
  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of filtered) {
      const list = map.get(item.group);
      if (list) list.push(item);
      else map.set(item.group, [item]);
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [filtered]);

  const flatItems = filtered;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(flatItems.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flatItems[active]?.action();
    }
  }

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh] bg-black/50 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300">
          <Search className="size-4 text-base-content/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Найти филиал, студента, действие..."
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
          <kbd className="kbd kbd-xs">Esc</kbd>
        </div>

        <div ref={listRef} className="max-h-96 overflow-y-auto py-1">
          {groups.length === 0 && (
            <div className="p-8 text-center text-sm text-base-content/50">
              Ничего не найдено
            </div>
          )}
          {(() => {
            let idx = -1;
            return groups.map((g) => (
              <div key={g.name}>
                <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-base-content/40">
                  {g.name}
                </div>
                {g.items.map((item) => {
                  idx++;
                  const isActive = idx === active;
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      data-cmd-idx={idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => item.action()}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-base-200/60',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-xs text-base-content/50 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      {isActive && <CornerDownLeft className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        <div className="border-t border-base-300 px-4 py-2 flex items-center justify-between text-[10px] text-base-content/50">
          <div className="flex items-center gap-2">
            <kbd className="kbd kbd-xs">↑↓</kbd> навигация
            <kbd className="kbd kbd-xs">⏎</kbd> открыть
          </div>
          <div>{flatItems.length} результатов</div>
        </div>
      </div>
    </div>
  );
}
