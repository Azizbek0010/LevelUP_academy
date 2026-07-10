import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Pencil, Plus, Search, Trash2, Users2 } from 'lucide-react';
import clsx from 'clsx';
import { groupsApi, type GroupItem } from '../../../shared/api/endpoints/groups';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader, Avatar } from '../../../shared/ui/PageHeader';
import { toast } from '../../../shared/ui/Toast';
import { GroupFormModal } from './GroupFormModal';
import { GroupEditModal } from './GroupEditModal';

type StatusFilter = 'active' | 'archived' | 'all';

const DAY_LABEL: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export default function GroupsPage(): React.ReactElement {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('active');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<GroupItem | null>(null);
  const [toDelete, setToDelete] = useState<GroupItem | null>(null);

  const query = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list(),
  });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? groupsApi.archive(id) : groupsApi.unarchive(id),
    onMutate: async ({ id, archived }) => {
      await qc.cancelQueries({ queryKey: ['groups'] });
      const prev = qc.getQueryData<{ items: GroupItem[] }>(['groups']);
      qc.setQueryData<{ items: GroupItem[] }>(['groups'], (old) =>
        !old
          ? old
          : {
              ...old,
              items: old.items.map((g) =>
                g.id === id ? { ...g, status: archived ? 'archived' : 'active' } : g,
              ),
            },
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['groups'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['groups'] });
      const prev = qc.getQueryData<{ items: GroupItem[] }>(['groups']);
      qc.setQueryData<{ items: GroupItem[] }>(['groups'], (old) =>
        !old ? old : { ...old, items: old.items.filter((g) => g.id !== id) },
      );
      return { prev };
    },
    onSuccess: () => {
      toast.success('Группа удалена');
      setToDelete(null);
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['groups'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });

  const groups = useMemo(() => {
    let list: GroupItem[] = query.data?.items ?? [];
    if (filter !== 'all') list = list.filter((g) => g.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) => g.name.toLowerCase().includes(q) || g.mentorName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [query.data, search, filter]);

  const all = query.data?.items ?? [];
  const active = all.filter((g) => g.status === 'active').length;
  const totalStudents = all.reduce((s, g) => s + g.studentCount, 0);
  const totalFee = all.reduce((s, g) => s + g.monthlyFee * g.studentCount, 0);

  return (
    <div className="p-8">
      <PageHeader
        icon={Users2}
        title="Groups"
        subtitle={`${all.length} групп · ${active} активных`}
        right={
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2 rounded-lg"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" /> Добавить группу
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatPill label="Всего" value={String(all.length)} />
        <StatPill label="Активных" value={String(active)} accent />
        <StatPill label="Студентов" value={String(totalStudents)} />
        <StatPill label="Оборот/мес" value={`${(totalFee / 1_000_000).toFixed(1)}M`} accent />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-base-300 bg-base-100 max-w-sm w-full">
          <Search className="size-4 text-base-content/40" />
          <input
            type="search"
            value={search}
            placeholder="Название или ментор…"
            className="grow bg-transparent text-base-content outline-none text-sm placeholder:text-base-content/40"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="inline-flex items-center rounded-lg border border-base-300 bg-base-100 p-0.5">
          {(['active', 'archived', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={clsx(
                'px-3 h-7 rounded-md text-[12px] font-medium transition-all',
                filter === v
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/60 hover:text-base-content',
              )}
              onClick={() => setFilter(v)}
            >
              {v === 'active' ? 'Активные' : v === 'archived' ? 'Архив' : 'Все'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-base-300">
          <div className="text-lg font-semibold leading-tight">Groups overview</div>
          <div className="text-xs text-base-content/50">
            {groups.length} из {all.length}
          </div>
        </div>

        {query.isLoading ? (
          <div className="p-10 text-center text-base-content/40 text-sm">Загрузка…</div>
        ) : groups.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users2}
              title="Групп не найдено"
              description={
                search || filter !== 'active'
                  ? 'Попробуй сменить фильтр или запрос'
                  : 'Создай первую группу'
              }
              action={
                !search && filter === 'active' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="size-4" /> Добавить группу
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Группа</th>
                  <th>Ментор</th>
                  <th>Расписание</th>
                  <th className="text-right">Студенты</th>
                  <th className="text-right">Абонемент</th>
                  <th>Статус</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr
                    key={g.id}
                    data-clickable="true"
                    onClick={() => navigate(`/superadmin/groups/${g.id}`)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className="chart-rise"
                  >
                    <td>
                      <div className="font-medium">{g.name}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={g.mentorName} size="sm" />
                        <span className="text-[13px] truncate">{g.mentorName}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[12px] text-base-content/70">
                      {g.lessonDays.map((d) => DAY_LABEL[d] ?? d).join(' ')} ·{' '}
                      {g.lessonStartTime}–{g.lessonEndTime}
                    </td>
                    <td className="text-right tabular-nums font-medium">{g.studentCount}</td>
                    <td className="text-right tabular-nums font-medium">
                      {CURRENCY.format(g.monthlyFee)}
                    </td>
                    <td>
                      {g.status === 'archived' ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-base-content/40">
                          <span className="size-1.5 rounded-full bg-base-content/40" />
                          архив
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] text-success font-medium">
                          <span className="size-1.5 rounded-full bg-success" />
                          актив
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          icon={Pencil}
                          title="Изменить (состав, расписание, ментор)"
                          onClick={() => setEditing(g)}
                        />
                        <IconButton
                          icon={g.status === 'archived' ? ArchiveRestore : Archive}
                          title={g.status === 'archived' ? 'Восстановить' : 'В архив'}
                          disabled={archiveMut.isPending && archiveMut.variables?.id === g.id}
                          onClick={() =>
                            archiveMut.mutate({ id: g.id, archived: g.status !== 'archived' })
                          }
                        />
                        <IconButton
                          icon={Trash2}
                          title="Удалить"
                          tone="error"
                          onClick={() => setToDelete(g)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GroupFormModal open={addOpen} onClose={() => setAddOpen(false)} />

      <GroupEditModal
        open={!!editing}
        group={editing}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Удалить группу?"
        message={
          toDelete
            ? `Группа "${toDelete.name}" будет удалена. Все связи со студентами и уроки удалятся тоже. Для сохранения истории используйте архивацию.`
            : ''
        }
        confirmLabel="Удалить"
        danger
        pending={deleteMut.isPending}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">
        {label}
      </div>
      <div
        className={clsx(
          'text-xl font-bold tabular-nums tracking-tight mt-0.5',
          accent && 'text-primary',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function IconButton({
  icon: Icon,
  title,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'error';
}): React.ReactElement {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        'size-7 rounded-md grid place-items-center transition-colors disabled:opacity-40',
        tone === 'error'
          ? 'text-error/70 hover:bg-error/10 hover:text-error'
          : 'text-base-content/60 hover:bg-base-200 hover:text-base-content',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
