import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Search, Users, UserCheck, UserX } from 'lucide-react';
import { useInvalidate } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { dateShort } from '../../format.js';
import { useQuery } from '@tanstack/react-query';

function useStudentsQuery(search, statusFilter, page) {
  const { token, logout } = useAuth();
  const qs =
    `?page=${page}&limit=20` +
    (search ? `&search=${encodeURIComponent(search)}` : '') +
    (statusFilter !== 'all' ? `&frozen=${statusFilter === 'frozen'}` : '');

  const q = useQuery({
    queryKey: ['super-students', search, statusFilter, page],
    queryFn: () => api.superStudents(token, qs),
    enabled: !!token,
  });

  useEffect(() => {
    if (q.error?.status === 401) logout();
  }, [q.error, logout]);

  return q;
}

export default function SuperStudents() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const qc = useQueryClient();

  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(rawSearch.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const { data, isLoading, error } = useStudentsQuery(search, statusFilter, page);

  const items = data?.students ?? data?.items ?? [];
  const pageCount = data?.pageCount ?? 1;
  const total = data?.total ?? items.length;
  const activeCount = items.filter((s) => s.status === 'active' || !s.frozen).length;

  const deleteMutation = useMutation({
    mutationFn: (id) => api.superDeleteStudent(token, id),
    onSuccess: () => {
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['super-students'] });
    },
  });

  const handleFilterChange = (f) => {
    setStatusFilter(f);
    setPage(1);
  };

  const statusBadge = (student) => {
    const frozen = student.frozen || student.status === 'frozen';
    return frozen
      ? <span className="badge badge-error badge-sm">Заморожен</span>
      : <span className="badge badge-success badge-sm">Активен</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Студенты" subtitle="Все студенты организации" />

      {/* Stat pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <Users size={16} className="text-primary" />
          <span className="text-sm font-semibold">Всего: {total}</span>
        </div>
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <UserCheck size={16} className="text-success" />
          <span className="text-sm font-semibold">На странице: {items.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-base-100 rounded-xl px-4 py-2 shadow-sm border border-base-200">
          <UserCheck size={16} className="text-info" />
          <span className="text-sm font-semibold">Активных: {activeCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="input input-bordered flex items-center gap-2 flex-1 max-w-sm">
          <Search size={16} className="text-base-content/40" />
          <input
            type="text"
            placeholder="Поиск студентов..."
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="grow bg-transparent outline-none text-sm"
          />
        </label>

        <div className="join">
          {['all', 'active', 'frozen'].map((f) => (
            <button
              key={f}
              className={`join-item btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleFilterChange(f)}
            >
              {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Заморожены'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : error && error.status !== 401 ? (
        <div className="alert alert-error text-sm">
          <span>{error.message}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-base-content/40 text-sm">
          Студентов не найдено
        </div>
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Телефон</th>
                  <th>Статус</th>
                  <th>Создан</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((student) => {
                  const fullName = `${student.firstName ?? student.first_name ?? ''} ${student.lastName ?? student.last_name ?? ''}`.trim();
                  return (
                    <tr
                      key={student.id}
                      className="hover cursor-pointer"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={fullName || 'S'} size={32} />
                          <span className="font-medium text-sm">{fullName || '—'}</span>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/70">
                        {student.phone || '—'}
                      </td>
                      <td>{statusBadge(student)}</td>
                      <td className="text-sm text-base-content/50">
                        {dateShort(student.createdAt ?? student.created_at)}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => setDeleteTarget(student)}
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-base-200">
              <span className="text-xs text-base-content/50">
                Страница {page} из {pageCount}
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  «
                </button>
                <button
                  className="join-item btn btn-xs"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg mb-2">Удалить студента?</h3>
            <p className="text-sm text-base-content/70 mb-6">
              Вы уверены, что хотите удалить{' '}
              <strong>
                {`${deleteTarget.firstName ?? deleteTarget.first_name ?? ''} ${deleteTarget.lastName ?? deleteTarget.last_name ?? ''}`.trim()}
              </strong>
              ? Это действие необратимо.
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
