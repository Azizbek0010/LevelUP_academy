import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Building2, Pencil, Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { branchesApi, type BranchItem } from '../../../shared/api/endpoints/branches';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { SkeletonTable } from '../../../shared/ui/Skeleton';
import { toast } from '../../../shared/ui/Toast';
import { BranchFormModal } from './BranchFormModal';

type StatusFilter = 'active' | 'archived' | 'all';

export default function BranchesPage(): React.ReactElement {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('active');
  const [editing, setEditing] = useState<BranchItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<{ branch: BranchItem; action: 'archive' | 'unarchive' } | null>(null);

  const query = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });

  const archiveMut = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archived ? branchesApi.archive(id) : branchesApi.unarchive(id),
    onSuccess: () => {
      toast.success('Статус филиала обновлён');
      setArchiveTarget(null);
      void qc.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: () => toast.error('Не удалось изменить статус'),
  });

  const branches = useMemo(() => {
    let list: BranchItem[] = query.data?.branches ?? [];
    if (filter === 'active') list = list.filter((b) => !b.isArchived);
    if (filter === 'archived') list = list.filter((b) => b.isArchived);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address ?? '').toLowerCase().includes(q) ||
        (b.phone ?? '').includes(q),
      );
    }
    return list;
  }, [query.data, search, filter]);

  const allBranches = query.data?.branches ?? [];
  const totalStudents = branches.reduce((s, b) => s + b.students, 0);
  const totalAdmins = branches.reduce((s, b) => s + b.admins, 0);

  return (
    <div className="p-8">
      <PageHeader
        icon={Building2}
        title="Branches"
        subtitle={`${branches.length} филиалов · ${totalStudents} студентов`}
        right={
          <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Открыть филиал
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill label="Всего филиалов" value={String(allBranches.length)} />
        <StatPill label="Активных" value={String(allBranches.filter((b) => !b.isArchived).length)} accent />
        <StatPill label="Студентов" value={String(totalStudents)} />
        <StatPill label="Администраторов" value={String(totalAdmins)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-base-300 bg-base-100 max-w-sm w-full">
          <Search className="size-4 text-base-content/40" />
          <input type="search" value={search} placeholder="Название, адрес или телефон…"
            className="grow bg-transparent text-base-content outline-none text-sm placeholder:text-base-content/40"
            onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="inline-flex items-center rounded-lg border border-base-300 bg-base-100 p-0.5">
          {(['active', 'archived', 'all'] as const).map((v) => (
            <button key={v} type="button"
              className={clsx('px-3 h-7 rounded-md text-[12px] font-medium transition-all', filter === v ? 'bg-primary text-primary-content' : 'text-base-content/60 hover:text-base-content')}
              onClick={() => setFilter(v)}>
              {v === 'active' ? 'Активные' : v === 'archived' ? 'Архив' : 'Все'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-base-300">
          <div className="text-lg font-semibold leading-tight">Branches overview</div>
          <div className="text-xs text-base-content/50">Клик по строке — детали филиала</div>
        </div>

        {query.isLoading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : branches.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Building2} title="Филиалов не найдено"
              description={search || filter !== 'active' ? 'Попробуйте сменить фильтр или запрос' : 'Откройте первый филиал'}
              action={!search && filter === 'active' ? (
                <button type="button" className="btn btn-primary btn-sm gap-2" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" /> Открыть филиал
                </button>
              ) : null} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dense-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Название</th>
                  <th>Адрес</th>
                  <th className="text-right">Студенты</th>
                  <th className="text-right">Администраторы</th>
                  <th className="text-center">Тип</th>
                  <th className="text-center">Статус</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <tr key={b.id} data-clickable="true"
                    onClick={() => navigate(`/superadmin/branches/${b.id}`)}
                    style={{ animationDelay: `${i * 40}ms` }} className="chart-rise">
                    <td>
                      <div className="font-medium">{b.name}</div>
                      {b.phone && <div className="text-[11px] text-base-content/50 font-mono">{b.phone}</div>}
                    </td>
                    <td className="text-sm text-base-content/60">{b.address ?? '—'}</td>
                    <td className="text-right tabular-nums font-medium">{b.students}</td>
                    <td className="text-right tabular-nums">{b.admins}</td>
                    <td className="text-center">
                      {b.isMain
                        ? <span className="badge badge-primary badge-sm">Главный</span>
                        : <span className="badge badge-ghost badge-sm">Филиал</span>}
                    </td>
                    <td className="text-center">
                      {b.isArchived
                        ? <span className="badge badge-warning badge-sm">В архиве</span>
                        : <span className="badge badge-success badge-sm gap-1"><span className="size-1.5 rounded-full bg-current" />Активен</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <IconButton icon={Pencil} title="Изменить" onClick={() => setEditing(b)} />
                        <IconButton
                          icon={b.isArchived ? ArchiveRestore : Archive}
                          title={b.isArchived ? 'Восстановить' : 'В архив'}
                          onClick={() => setArchiveTarget({ branch: b, action: b.isArchived ? 'unarchive' : 'archive' })}
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

      <BranchFormModal
        open={addOpen || !!editing}
        editing={editing}
        onClose={() => { setAddOpen(false); setEditing(null); }}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && archiveMut.mutate({ id: archiveTarget.branch.id, archived: archiveTarget.action === 'archive' })}
        title={archiveTarget?.action === 'archive' ? 'Архивировать филиал?' : 'Восстановить филиал?'}
        message={archiveTarget ? `Филиал "${archiveTarget.branch.name}" будет ${archiveTarget.action === 'archive' ? 'переведён в архив' : 'восстановлен из архива'}.` : ''}
        confirmLabel={archiveTarget?.action === 'archive' ? 'В архив' : 'Восстановить'}
        pending={archiveMut.isPending}
      />
    </div>
  );
}

function StatPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">{label}</div>
      <div className={clsx('text-xl font-bold tabular-nums tracking-tight mt-0.5', accent && 'text-primary')}>{value}</div>
    </div>
  );
}

function IconButton({ icon: Icon, title, onClick, disabled }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" title={title} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="size-7 rounded-md grid place-items-center transition-colors disabled:opacity-40 text-base-content/60 hover:bg-base-200 hover:text-base-content">
      <Icon className="size-3.5" />
    </button>
  );
}
