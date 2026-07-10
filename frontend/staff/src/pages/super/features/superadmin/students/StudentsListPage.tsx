import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Send,
  Snowflake,
  Trash2,
  Users2,
} from 'lucide-react';
import clsx from 'clsx';
import { studentsApi, type StudentListItem } from '../../../shared/api/endpoints/students';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader, Avatar } from '../../../shared/ui/PageHeader';
import { toast } from '../../../shared/ui/Toast';
import { StudentFormModal } from './StudentFormModal';
import { AddToGroupModal } from './AddToGroupModal';

type StatusFilter = 'active' | 'frozen' | 'all';

export default function StudentsListPage(): React.ReactElement {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<StudentListItem | null>(null);
  const [toGroup, setToGroup] = useState<StudentListItem | null>(null);
  const pageSize = 20;
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ['students', { search: debouncedSearch, statusFilter, page }],
    queryFn: () =>
      studentsApi.list({
        search: debouncedSearch || undefined,
        isArchived: false,
        frozen:
          statusFilter === 'frozen' ? true : statusFilter === 'active' ? false : undefined,
        page,
        pageSize,
      }),
    placeholderData: keepPreviousData,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => studentsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['students'] });
      const snapshots = qc.getQueriesData<{ items: StudentListItem[]; total: number }>({
        queryKey: ['students'],
      });
      qc.setQueriesData<{ items: StudentListItem[]; total: number }>(
        { queryKey: ['students'] },
        (old) =>
          !old
            ? old
            : { ...old, items: old.items.filter((s) => s.id !== id), total: Math.max(0, old.total - 1) },
      );
      return { snapshots };
    },
    onSuccess: () => {
      toast.success('Студент удалён');
      setToDelete(null);
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['students'] }),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = query.data?.pageCount ?? 1;

  const withTg = items.filter((s) => !!s.telegramChatId).length;
  const inGroups = items.filter((s) => s.groupCount > 0).length;

  return (
    <div className="p-8">
      <PageHeader
        icon={GraduationCap}
        title="Students"
        subtitle={`${total} студентов на странице · ${pageCount} стр.`}
        right={
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2 rounded-lg"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" /> Добавить студента
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatPill label="Всего" value={String(total)} />
        <StatPill label="На странице" value={String(items.length)} />
        <StatPill label="С Telegram" value={String(withTg)} accent />
        <StatPill label="В группах" value={String(inGroups)} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-base-300 bg-base-100 max-w-sm w-full">
          <Search className="size-4 text-base-content/40" />
          <input
            type="search"
            value={search}
            placeholder="Поиск по имени или телефону…"
            className="grow bg-transparent text-base-content outline-none text-sm placeholder:text-base-content/40"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>

        <div className="inline-flex items-center rounded-lg border border-base-300 bg-base-100 p-0.5">
          {(['active', 'frozen', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={clsx(
                'px-3 h-7 rounded-md text-[12px] font-medium transition-all',
                statusFilter === v
                  ? 'bg-primary text-primary-content'
                  : 'text-base-content/60 hover:text-base-content',
              )}
              onClick={() => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              {v === 'active' ? 'Активные' : v === 'frozen' ? 'Заморожены' : 'Все'}
            </button>
          ))}
        </div>

        {query.isFetching && (
          <Loader2 className="size-4 animate-spin text-base-content/40 ml-auto" />
        )}
      </div>

      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold leading-tight">Students overview</div>
            <div className="text-xs text-base-content/50">
              {items.length} из {total}
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="p-10 text-center text-base-content/40 text-sm">Загрузка…</div>
        ) : query.isError ? (
          <div className="p-8 text-center text-error text-sm">
            Не удалось загрузить: {(query.error as Error).message}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={GraduationCap}
              title="Ничего не найдено"
              description={
                debouncedSearch
                  ? `По запросу «${debouncedSearch}» никого нет`
                  : 'Здесь пока пусто. Добавь первого студента.'
              }
              action={
                !debouncedSearch ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm gap-2"
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="size-4" /> Добавить студента
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
                  <th style={{ width: '30%' }}>ФИО</th>
                  <th>Телефон студента</th>
                  <th>Телефон родителя</th>
                  <th className="text-right">Группы</th>
                  <th>Telegram</th>
                  <th>Статус</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s, i) => (
                  <tr
                    key={s.id}
                    data-clickable="true"
                    onClick={() => navigate(`/superadmin/students/${s.id}`)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className="chart-rise"
                  >
                    <td>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                        <div className="font-medium truncate">
                          {s.lastName} {s.firstName}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[12px] text-base-content/70">
                      {s.phone ?? '—'}
                    </td>
                    <td className="font-mono text-[12px] text-base-content/70">
                      {s.parentPhone}
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {s.groupCount > 0 ? (
                        s.groupCount
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td>
                      {s.telegramChatId ? (
                        <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase">
                          <Send className="size-3" /> TG
                        </span>
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td>
                      {s.isFrozen ? (
                        <span
                          className="inline-flex items-center gap-1 text-[12px] text-info font-medium"
                          title={
                            s.freezeReason
                              ? `Причина: ${s.freezeReason}${s.expectedReturnAt ? ` · возврат ${s.expectedReturnAt}` : ''}`
                              : 'заморозка'
                          }
                        >
                          <Snowflake className="size-3" />
                          заморозка
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
                          icon={Users2}
                          title="Добавить в группу"
                          onClick={() => setToGroup(s)}
                        />
                        <IconButton
                          icon={Trash2}
                          title="Удалить"
                          tone="error"
                          onClick={() => setToDelete(s)}
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

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="text-base-content/60">
            Стр. <span className="font-semibold">{page}</span> из{' '}
            <span className="font-semibold">{pageCount}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <IconButton
              icon={ChevronLeft}
              title="Назад"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            <span className="px-3 h-7 rounded-md bg-primary text-primary-content text-[12px] font-bold grid place-items-center">
              {page}
            </span>
            <IconButton
              icon={ChevronRight}
              title="Далее"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            />
          </div>
        </div>
      )}

      <StudentFormModal open={addOpen} onClose={() => setAddOpen(false)} />

      <AddToGroupModal
        open={!!toGroup}
        student={toGroup}
        onClose={() => setToGroup(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
        title="Удалить студента?"
        message={
          toDelete
            ? `Студент "${toDelete.lastName} ${toDelete.firstName}" будет удалён без возможности восстановления. Для сохранения истории используйте архивацию.`
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
