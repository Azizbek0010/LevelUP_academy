import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileClock,
  GraduationCap,
  KeyRound,
  Search,
  Trash2,
  User as UserIcon,
  Users2,
  Wallet,
  Wifi,
  Workflow,
  Pencil,
  Archive,
  Megaphone,
} from 'lucide-react';
import clsx from 'clsx';
import { auditApi, type AuditItem } from '../../../shared/api/endpoints/audit';
import { SkeletonTable } from '../../../shared/ui/Skeleton';
import { EmptyState } from '../../../shared/ui/EmptyState';

const ACTION_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  'branch.created': { label: 'Открыт филиал', icon: Building2, tone: 'text-success' },
  'branch.updated': { label: 'Изменён филиал', icon: Pencil, tone: 'text-info' },
  'branch.archived': { label: 'Филиал в архив', icon: Archive, tone: 'text-warning' },
  'branch.deleted': { label: 'Удалён филиал', icon: Trash2, tone: 'text-error' },
  'user.created': { label: 'Добавлен пользователь', icon: UserIcon, tone: 'text-success' },
  'user.updated': { label: 'Изменён пользователь', icon: Pencil, tone: 'text-info' },
  'user.password_changed': { label: 'Смена пароля', icon: KeyRound, tone: 'text-warning' },
  'user.archived': { label: 'Пользователь в архив', icon: Archive, tone: 'text-warning' },
  'user.deleted': { label: 'Удалён пользователь', icon: Trash2, tone: 'text-error' },
  'student.created': { label: 'Добавлен студент', icon: GraduationCap, tone: 'text-success' },
  'student.updated': { label: 'Изменён студент', icon: Pencil, tone: 'text-info' },
  'student.archived': { label: 'Студент в архив', icon: Archive, tone: 'text-warning' },
  'student.deleted': { label: 'Удалён студент', icon: Trash2, tone: 'text-error' },
  'group.created': { label: 'Создана группа', icon: Users2, tone: 'text-success' },
  'group.updated': { label: 'Изменена группа', icon: Pencil, tone: 'text-info' },
  'group.archived': { label: 'Группа в архив', icon: Archive, tone: 'text-warning' },
  'group.deleted': { label: 'Удалена группа', icon: Trash2, tone: 'text-error' },
  'attendance.marked': { label: 'Отмечена посещаемость', icon: FileClock, tone: 'text-info' },
  'reminder.sent': { label: 'Отправлено напоминание', icon: FileClock, tone: 'text-info' },
  'reminder.deleted': { label: 'Удалено напоминание', icon: Trash2, tone: 'text-error' },
  'rule.enabled': { label: 'Включено правило', icon: Workflow, tone: 'text-success' },
  'rule.disabled': { label: 'Выключено правило', icon: Workflow, tone: 'text-warning' },
  'rule.updated': { label: 'Изменено правило', icon: Workflow, tone: 'text-info' },
  'announcement.sent': { label: 'Отправлен анонс', icon: Megaphone, tone: 'text-primary' },
  'session.login': { label: 'Вход в систему', icon: Wifi, tone: 'text-success' },
  'session.logout': { label: 'Выход из системы', icon: Wifi, tone: 'text-base-content/50' },
  'payment.received': { label: 'Платёж принят', icon: Wallet, tone: 'text-success' },
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'супер-админ',
  admin: 'админ',
  mentor: 'ментор',
  unknown: 'аноним',
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-primary/10 text-primary',
  admin: 'bg-info/10 text-info',
  mentor: 'bg-success/10 text-success',
  unknown: 'bg-base-300 text-base-content/50',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  return `${days} дн назад`;
}

function formatFull(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Человекочитаемое описание изменений из meta ────────────────

const META_KEY_LABEL: Record<string, string> = {
  archived: 'В архив',
  action: 'Тип действия',
  added: 'Добавлено',
  reason: 'Причина',
  note: 'Заметка',
  via: 'Канал',
  studentId: 'ID студента',
  message: 'Сообщение',
  attempts: 'Попыток',
  minutesAfter: 'Мин. после',
  error: 'Ошибка',
  field: 'Поле',
  len: 'Длина',
  recipients: 'Получателей',
};

const ACTION_VERB_LABEL: Record<string, string> = {
  'students-added': 'Добавлены студенты',
  'student-removed': 'Убран студент',
  'freeze': 'Заморожен',
  'unfreeze': 'Снята заморозка',
};

interface ChangeItem {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warn' | 'error';
}

function describeMeta(meta: Record<string, unknown> | null): ChangeItem[] {
  if (!meta) return [];
  const items: ChangeItem[] = [];
  const skip = new Set(['method', 'path', 'body']);
  for (const [k, v] of Object.entries(meta)) {
    if (skip.has(k)) continue;
    let value = '';
    let tone: ChangeItem['tone'] = 'default';
    if (v === null || v === undefined) continue;
    if (k === 'archived') {
      value = v === true ? 'да' : 'нет';
      tone = v === true ? 'warn' : 'success';
    } else if (k === 'action') {
      value = ACTION_VERB_LABEL[String(v)] ?? String(v);
    } else if (k === 'error') {
      value = String(v);
      tone = 'error';
    } else if (typeof v === 'object') {
      value = JSON.stringify(v);
    } else {
      value = String(v);
    }
    items.push({ label: META_KEY_LABEL[k] ?? k, value, tone });
  }
  return items;
}

export default function AuditLogPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list(),
    refetchInterval: 5000,
  });

  const items = query.data?.items ?? [];

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.entityType));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (entityFilter !== 'all' && i.entityType !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.actorName.toLowerCase().includes(q) ||
          i.entityLabel.toLowerCase().includes(q) ||
          (ACTION_META[i.action]?.label ?? i.action).toLowerCase().includes(q) ||
          i.ip.includes(q)
        );
      }
      return true;
    });
  }, [items, search, entityFilter]);

  return (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileClock className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Аудит-лог</h1>
          <p className="text-base-content/60 text-sm">
            Кто что менял, когда и откуда — по всей организации
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="input input-bordered flex items-center gap-2 max-w-sm w-full">
          <Search className="size-4 text-base-content/50" />
          <input
            type="search"
            value={search}
            placeholder="Пользователь, действие, объект, IP..."
            className="grow"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <select
          className="select select-bordered select-sm"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="all">Все объекты</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs text-base-content/50">
          {filtered.length} из {items.length}
          {query.isFetching && (
            <span className="loading loading-dots loading-xs ml-2 align-middle" />
          )}
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th className="w-6"></th>
                <th>Действие</th>
                <th>Пользователь</th>
                <th>Объект</th>
                <th>IP</th>
                <th className="text-right">Когда</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <SkeletonTable rows={8} cols={6} />
                  </td>
                </tr>
              )}
              {!query.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={FileClock}
                      title="Записей нет"
                      description={
                        search || entityFilter !== 'all'
                          ? 'Попробуй сменить фильтр или поисковый запрос'
                          : 'Записи появятся когда кто-то что-то сделает'
                      }
                    />
                  </td>
                </tr>
              )}
              {filtered.map((entry) => (
                <AuditRow
                  key={entry.id}
                  entry={entry}
                  expanded={expanded === entry.id}
                  onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditItem;
  expanded: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: FileClock, tone: 'text-base-content' };
  const Icon = meta.icon;

  return (
    <>
      <tr className="hover:bg-base-200/40 cursor-pointer" onClick={onToggle}>
        <td>
          <button type="button" className="btn btn-ghost btn-xs btn-square">
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                'font-mono text-[10px] w-4 text-center shrink-0',
                entry.status === 'failure' ? 'text-error' : 'text-success',
              )}
              title={entry.statusCode ? `HTTP ${entry.statusCode}` : undefined}
            >
              {entry.status === 'failure' ? '✕' : '✓'}
            </span>
            <Icon className={`size-4 shrink-0 ${meta.tone}`} />
            <span className="text-sm">{meta.label}</span>
          </div>
        </td>
        <td>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{entry.actorName}</span>
            <span
              className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                ROLE_BADGE[entry.actorRole],
              )}
            >
              {ROLE_LABEL[entry.actorRole]}
            </span>
          </div>
        </td>
        <td className="text-sm text-base-content/70">
          <span className="text-[10px] text-base-content/40 uppercase tracking-wider mr-1.5">
            {entry.entityType}
          </span>
          {entry.entityLabel}
        </td>
        <td className="font-mono text-xs">{entry.ip}</td>
        <td className="text-right text-xs text-base-content/60">{timeAgo(entry.createdAt)}</td>
      </tr>
      {expanded && (
        <tr className="bg-base-200/30">
          <td colSpan={6} className="p-4">
            {(() => {
              const changes = describeMeta(entry.meta);
              return (
                <div className="space-y-4">
                  {/* Читаемые изменения — что именно поменялось */}
                  {changes.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold mb-2">
                        Что изменилось
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {changes.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-base-100 border border-base-300"
                          >
                            <span className="text-[11px] text-base-content/50 min-w-[120px]">
                              {c.label}
                            </span>
                            <span
                              className={clsx(
                                'text-[12px] font-mono flex-1 min-w-0 truncate',
                                c.tone === 'success' && 'text-success',
                                c.tone === 'warn' && 'text-warning',
                                c.tone === 'error' && 'text-error',
                              )}
                            >
                              {c.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Технические детали */}
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold mb-2">
                      Детали события
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-base-content/50 mb-1">Точное время</div>
                        <div className="font-mono">
                          {formatFull(entry.createdAt)}{' '}
                          <span className="text-base-content/50">· {timeAgo(entry.createdAt)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-base-content/50 mb-1">Кто</div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{entry.actorName}</span>
                          <span
                            className={clsx(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              ROLE_BADGE[entry.actorRole],
                            )}
                          >
                            {ROLE_LABEL[entry.actorRole]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-base-content/50 mb-1">Что</div>
                        <div className="text-sm">
                          {(ACTION_META[entry.action]?.label ?? entry.action)}{' '}
                          <span className="text-base-content/40 font-mono text-[11px]">
                            ({entry.action})
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-base-content/50 mb-1">Над чем</div>
                        <div className="text-sm">
                          <span className="text-[10px] text-base-content/40 uppercase tracking-wider mr-1.5">
                            {entry.entityType}
                          </span>
                          {entry.entityLabel || '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-base-content/50 mb-1">IP · местоположение</div>
                        <div className="font-mono">{entry.ip || '—'}</div>
                      </div>
                      <div>
                        <div className="text-base-content/50 mb-1">User-Agent</div>
                        <div className="font-mono truncate">{entry.userAgent}</div>
                      </div>
                      {entry.entityId && (
                        <div>
                          <div className="text-base-content/50 mb-1">ID объекта</div>
                          <div className="font-mono">{entry.entityId}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-base-content/50 mb-1">Actor ID</div>
                        <div className="font-mono">{entry.actorId || '—'}</div>
                      </div>
                      {entry.statusCode !== undefined && (
                        <div>
                          <div className="text-base-content/50 mb-1">HTTP статус</div>
                          <div className="font-mono">
                            <span
                              className={
                                entry.status === 'failure' ? 'text-error' : 'text-success'
                              }
                            >
                              {entry.status === 'failure' ? '✕' : '✓'}
                            </span>{' '}
                            {entry.statusCode}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* JSON целиком — для дебага */}
                  {entry.meta && Object.keys(entry.meta).length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold mb-2">
                        Метаданные (JSON)
                      </div>
                      <pre className="bg-base-100 border border-base-300 rounded-lg p-3 overflow-x-auto text-[11px]">
                        {JSON.stringify(entry.meta, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })()}
          </td>
        </tr>
      )}
    </>
  );
}
