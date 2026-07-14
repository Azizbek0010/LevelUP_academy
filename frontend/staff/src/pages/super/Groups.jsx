import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Archive, ArchiveRestore, Trash2, Search, Users, Layers, Banknote } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { fmt, money } from '../../format.js';

const DAY_LABEL = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср',
  thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

function useSuperGroups() {
  const { token, logout } = useAuth();
  const q = useQuery({
    queryKey: ['super-groups'],
    queryFn: () => api.superGroups(token),
    enabled: !!token,
  });
  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);
  return q;
}

export default function SuperGroups() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, error } = useSuperGroups();

  const allGroups = data?.groups ?? data?.items ?? [];

  const archiveMutation = useMutation({
    mutationFn: (id) => api.superArchiveGroup(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-groups'] }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id) => api.superUnarchiveGroup(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-groups'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.superDeleteGroup(token, id),
    onSuccess: () => {
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['super-groups'] });
    },
  });

  const filtered = allGroups.filter((g) => {
    const matchSearch = !search ||
      (g.name ?? '').toLowerCase().includes(search.toLowerCase());
    const archived = g.isArchived ?? g.is_archived ?? false;
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && !archived) ||
      (filter === 'archived' && archived);
    return matchSearch && matchFilter;
  });

  const totalStudents = allGroups.reduce((s, g) => s + (g.studentsCount ?? g.students_count ?? g.students ?? 0), 0);
  const activeCount = allGroups.filter((g) => !(g.isArchived ?? g.is_archived)).length;
  const totalRevenue = allGroups.reduce((s, g) => s + Number(g.monthlyPrice ?? g.monthly_price ?? 0), 0);

  const formatSchedule = (g) => {
    const days = g.lessonDays ?? g.lesson_days ?? [];
    if (!days.length) return '—';
    return days.map((d) => DAY_LABEL[d] ?? d).join(', ');
  };

  const formatPrice = (g) => {
    const price = g.monthlyPrice ?? g.monthly_price;
    return price ? money(price) : '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Группы" subtitle="Все учебные группы организации" />

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <Layers size={16} className="text-primary" />
          <span className="text-sm font-semibold">Всего: {allGroups.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <Layers size={16} className="text-success" />
          <span className="text-sm font-semibold">Активных: {activeCount}</span>
        </div>
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <Users size={16} className="text-info" />
          <span className="text-sm font-semibold">Студентов: {totalStudents}</span>
        </div>
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <Banknote size={16} className="text-warning" />
          <span className="text-sm font-semibold">Оборот/мес: {money(totalRevenue)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="input input-bordered flex items-center gap-2 flex-1 max-w-sm">
          <Search size={16} className="text-base-content/40" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="grow bg-transparent outline-none text-sm"
          />
        </label>

        <div className="join">
          {['active', 'archived', 'all'].map((f) => (
            <button
              key={f}
              className={`join-item btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'active' ? 'Активные' : f === 'archived' ? 'Архив' : 'Все'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error && error.status !== 401 ? (
        <div className="alert alert-error text-sm">
          <span>{error.message}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Группы не найдены
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Группа</th>
                  <th>Ментор</th>
                  <th>Расписание</th>
                  <th className="text-right">Студенты</th>
                  <th className="text-right">Абонемент</th>
                  <th>Статус</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const archived = g.isArchived ?? g.is_archived ?? false;
                  const mentorName = g.mentorName ?? g.mentor_name ?? g.mentor ?? '—';
                  const studentCount = g.studentsCount ?? g.students_count ?? g.students ?? 0;

                  return (
                    <tr key={g.id} className="hover">
                      <td>
                        <span className="font-medium text-sm">{g.name}</span>
                        {g.subject && (
                          <div className="text-xs text-base-content/50">{g.subject}</div>
                        )}
                      </td>
                      <td>
                        {mentorName !== '—' ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={mentorName} size={28} />
                            <span className="text-sm">{mentorName}</span>
                          </div>
                        ) : (
                          <span className="text-base-content/40 text-sm">—</span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/70">{formatSchedule(g)}</td>
                      <td className="text-right text-sm tabular-nums">{fmt(studentCount)}</td>
                      <td className="text-right text-sm tabular-nums">{formatPrice(g)}</td>
                      <td>
                        {archived
                          ? <span className="badge badge-ghost badge-sm">Архив</span>
                          : <span className="badge badge-success badge-sm">Активна</span>
                        }
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {archived ? (
                            <button
                              className="btn btn-ghost btn-xs text-success"
                              title="Разархивировать"
                              onClick={() => unarchiveMutation.mutate(g.id)}
                              disabled={unarchiveMutation.isPending}
                            >
                              <ArchiveRestore size={14} />
                            </button>
                          ) : (
                            <button
                              className="btn btn-ghost btn-xs text-warning"
                              title="Архивировать"
                              onClick={() => archiveMutation.mutate(g.id)}
                              disabled={archiveMutation.isPending}
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            title="Удалить"
                            onClick={() => setDeleteTarget(g)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg mb-2">Удалить группу?</h3>
            <p className="text-sm text-base-content/70 mb-6">
              Вы уверены, что хотите удалить группу <strong>{deleteTarget.name}</strong>? Это действие необратимо.
            </p>
            {deleteMutation.error && (
              <div className="alert alert-error text-xs mb-3">
                <span>{deleteMutation.error.message}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Отмена
              </button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Удалить'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)} />
        </div>
      )}
    </div>
  );
}
