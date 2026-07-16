import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown, ChevronRight, CheckCircle, XCircle,
  LogIn, LogOut, Plus, Pencil, Trash2, Archive,
  ShieldAlert, Eye, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// ---- Constants ----

const ACTION_META = {
  'auth.login':          { label: 'Вход',           Icon: LogIn,       color: 'text-success' },
  'auth.logout':         { label: 'Выход',          Icon: LogOut,      color: 'text-base-content/50' },
  'auth.login.failed':   { label: 'Ошибка входа',   Icon: ShieldAlert, color: 'text-error' },
  'student.create':      { label: 'Студент создан',  Icon: Plus,        color: 'text-info' },
  'student.update':      { label: 'Студент изменён', Icon: Pencil,      color: 'text-warning' },
  'student.delete':      { label: 'Студент удалён',  Icon: Trash2,      color: 'text-error' },
  'student.freeze':      { label: 'Заморожен',       Icon: ShieldAlert, color: 'text-warning' },
  'student.unfreeze':    { label: 'Разморожен',      Icon: CheckCircle, color: 'text-success' },
  'admin.create':        { label: 'Админ создан',    Icon: Plus,        color: 'text-info' },
  'admin.update':        { label: 'Админ изменён',   Icon: Pencil,      color: 'text-warning' },
  'admin.freeze':        { label: 'Админ заморожен', Icon: ShieldAlert, color: 'text-warning' },
  'branch.create':       { label: 'Филиал создан',   Icon: Plus,        color: 'text-info' },
  'branch.update':       { label: 'Филиал изменён',  Icon: Pencil,      color: 'text-warning' },
  'branch.archive':      { label: 'Филиал архивирован', Icon: Archive,  color: 'text-warning' },
  'branch.unarchive':    { label: 'Разархивирован',  Icon: RefreshCw,   color: 'text-success' },
  'group.create':        { label: 'Группа создана',  Icon: Plus,        color: 'text-info' },
  'group.update':        { label: 'Группа изменена', Icon: Pencil,      color: 'text-warning' },
  'group.archive':       { label: 'Группа архивирована', Icon: Archive, color: 'text-warning' },
  'payment.create':      { label: 'Платёж создан',   Icon: Plus,        color: 'text-success' },
  'payment.refund':      { label: 'Возврат',         Icon: XCircle,     color: 'text-error' },
  'settings.update':     { label: 'Настройки',       Icon: Pencil,      color: 'text-base-content/60' },
  'announcement.create': { label: 'Анонс создан',    Icon: Plus,        color: 'text-info' },
  'announcement.delete': { label: 'Анонс удалён',    Icon: Trash2,      color: 'text-error' },
};

const ROLE_LABEL = {
  superadmin:  'Super Admin',
  admin:       'Администратор',
  mentor:      'Ментор',
  methodist:   'Методист',
  student:     'Студент',
  parent:      'Родитель',
  main_admin:  'Main Admin',
};

const ROLE_BADGE = {
  superadmin: 'badge-primary',
  admin:      'badge-info',
  mentor:     'badge-success',
  methodist:  'badge-warning',
  student:    'badge-ghost',
  parent:     'badge-ghost',
  main_admin: 'badge-secondary',
};

// ---- Helpers ----

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}с назад`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч назад`;
  const d = Math.floor(h / 24);
  return `${d}д назад`;
}

function formatFull(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(iso));
}

function describeMeta(meta) {
  if (!meta) return null;
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta); } catch (_) { return meta; }
  }
  return JSON.stringify(meta, null, 2);
}

// ---- Query ----

function useAuditQuery() {
  const { token, logout } = useAuth();
  const q = useQuery({
    queryKey: ['super-audit'],
    queryFn: () => api.superAudit(token),
    enabled: !!token,
    refetchInterval: 5000,
  });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

// ---- Component ----

export default function SuperAudit() {
  const { data, isLoading, error } = useAuditQuery();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const items = data?.items ?? [];

  // Derive unique entity types
  const entityTypes = ['all', ...new Set(
    items.map((item) => item.entityType ?? item.entity_type ?? '').filter(Boolean)
  )];

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = items.filter((item) => {
    const action = item.action ?? '';
    const actorName = item.actorName ?? item.actor_name ?? '';
    const entityLabel = item.entityLabel ?? item.entity_label ?? item.entityType ?? item.entity_type ?? '';
    const ip = item.ip ?? '';
    const actionMeta = ACTION_META[action];
    const actionLabel = actionMeta?.label ?? action;

    const matchSearch =
      !search ||
      actorName.toLowerCase().includes(search.toLowerCase()) ||
      entityLabel.toLowerCase().includes(search.toLowerCase()) ||
      actionLabel.toLowerCase().includes(search.toLowerCase()) ||
      ip.includes(search);

    const entityType = item.entityType ?? item.entity_type ?? '';
    const matchEntity = entityFilter === 'all' || entityType === entityFilter;

    return matchSearch && matchEntity;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Журнал аудита" subtitle="История действий в системе" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Поиск по имени, действию, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-bordered input-sm flex-1 max-w-sm"
        />
        <select
          className="select select-bordered select-sm"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          {entityTypes.map((et) => (
            <option key={et} value={et}>{et === 'all' ? 'Все объекты' : et}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : error && error.status !== 401 ? (
        <div className="alert alert-error text-sm"><span>{error.message}</span></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/40 text-sm">Записей не найдено</div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th className="w-8" />
                  <th>Действие</th>
                  <th>Кто</th>
                  <th>Объект</th>
                  <th>IP</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const action = item.action ?? '';
                  const meta = ACTION_META[action] ?? { label: action, Icon: Eye, color: 'text-base-content/60' };
                  const { label, Icon, color } = meta;
                  const success = item.success ?? item.ok ?? true;
                  const actorName = item.actorName ?? item.actor_name ?? '—';
                  const actorRole = item.actorRole ?? item.actor_role ?? '';
                  const entityLabel = item.entityLabel ?? item.entity_label ?? item.entityType ?? item.entity_type ?? '—';
                  const ip = item.ip ?? '—';
                  const createdAt = item.createdAt ?? item.created_at;
                  const isExpanded = !!expanded[item.id];
                  const userAgent = item.userAgent ?? item.user_agent ?? '—';
                  const metaStr = describeMeta(item.meta);

                  return [
                    <tr key={item.id} className="hover">
                      <td>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => toggleExpand(item.id)}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${color}`}>
                          <Icon size={15} />
                          <span className="font-medium text-sm">{label}</span>
                          {success
                            ? <CheckCircle size={12} className="text-success" />
                            : <XCircle size={12} className="text-error" />
                          }
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{actorName}</span>
                          {actorRole && (
                            <span className={`badge badge-xs ${ROLE_BADGE[actorRole] ?? 'badge-ghost'}`}>
                              {ROLE_LABEL[actorRole] ?? actorRole}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-base-content/70">{entityLabel}</td>
                      <td className="text-xs font-mono text-base-content/50">{ip}</td>
                      <td className="text-xs text-base-content/50 whitespace-nowrap">
                        {timeAgo(createdAt)}
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={`${item.id}-exp`} className="bg-base-200/40">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs">
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">Точное время</div>
                              <div>{formatFull(createdAt)}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">Кто</div>
                              <div>{actorName} ({ROLE_LABEL[actorRole] ?? actorRole})</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">Действие</div>
                              <div className="font-mono">{action}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">Объект</div>
                              <div>{entityLabel}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">IP</div>
                              <div className="font-mono">{ip}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base-content/50 mb-0.5">User Agent</div>
                              <div className="truncate max-w-xs">{userAgent}</div>
                            </div>
                            {metaStr && (
                              <div className="col-span-2 md:col-span-3">
                                <div className="font-semibold text-base-content/50 mb-0.5">Meta</div>
                                <pre className="bg-base-300 rounded p-2 text-xs overflow-x-auto max-h-32">
                                  {metaStr}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
