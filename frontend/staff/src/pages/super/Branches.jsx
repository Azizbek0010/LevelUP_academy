import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, MapPin, Phone } from 'lucide-react';
import { fmt, money, dateShort } from '../../format.js';
import { useSuperBranches, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const branchSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(80, 'Макс. 80 символов'),
  address: z.string().trim().max(160, 'Макс. 160 символов').or(z.literal('')),
  phone: z.string().trim().max(30, 'Макс. 30 символов').or(z.literal('')),
});

export default function SuperBranches() {
  const { data, isLoading, error } = useSuperBranches();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '', phone: '' },
  });

  const branches = data?.branches || [];
  const rows = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(q.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(q.toLowerCase()),
  );

  const openCreate = () => {
    setModalMode('create');
    setErr('');
    reset({ name: '', address: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (branch) => {
    setModalMode('edit');
    setCurrentId(branch.id);
    setErr('');
    reset({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
    setModalOpen(true);
  };

  const onFormSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      const body = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
      };
      if (modalMode === 'create') {
        await api.superCreateBranch(token, body);
      } else {
        await api.superUpdateBranch(token, currentId, body);
      }
      invalidate('super-branches', 'super-dashboard');
      setModalOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleArchive = async (id, archived) => {
    try {
      if (archived) await api.superUnarchiveBranch(token, id);
      else await api.superArchiveBranch(token, id);
      invalidate('super-branches', 'super-dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Филиалы" subtitle="Управление филиалами организации">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate}>
          <Plus size={16} /> Новый филиал
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="space-y-5">
          <input
            className="input input-bordered input-sm max-w-xs"
            placeholder="Поиск филиалов…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {rows.length === 0 ? (
            <div className="card bg-base-100">
              <div className="card-body text-center py-12">
                <p className="text-base-content/40">Филиалов пока нет. Создайте первый филиал.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rows.map((b) => (
                <div
                  key={b.id}
                  className={`card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 ${b.isArchived ? 'opacity-60' : ''}`}
                >
                  <div className="card-body p-5 gap-3">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Building2 size={18} className="text-primary" />
                        </div>
                        <div>
                          <Link to={`/branches/${b.id}`} className="font-bold hover:text-primary text-base leading-snug block">
                            {b.name}
                          </Link>
                          {b.isMain && (
                            <span className="badge badge-primary badge-xs mt-1">Главный</span>
                          )}
                        </div>
                      </div>
                      <span className={`badge badge-sm ${b.isArchived ? 'badge-ghost' : 'badge-success'}`}>
                        {b.isArchived ? 'Архив' : 'Активен'}
                      </span>
                    </div>

                    {/* Address & Phone */}
                    <div className="space-y-1.5 text-xs text-base-content/60 border-t border-base-200 pt-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="shrink-0" />
                        <span>{b.address || 'Адрес не указан'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0" />
                        <span>{b.phone || 'Телефон не указан'}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-1 bg-base-200/50 rounded-xl p-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">Ученики</div>
                        <div className="text-lg font-extrabold mt-0.5 tabular-nums">{fmt(b.students)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-base-content/50 tracking-wider">Доход</div>
                        <div className="text-lg font-extrabold mt-0.5 tabular-nums">{fmt(b.revenue)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-1.5 mt-1 pt-2 border-t border-base-200 text-xs">
                      {!b.isArchived && (
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEdit(b)}
                        >
                          Изменить
                        </button>
                      )}
                      <button
                        className={`btn btn-xs ${b.isArchived ? 'btn-ghost' : 'btn-ghost text-error'}`}
                        onClick={() => toggleArchive(b.id, b.isArchived)}
                      >
                        {b.isArchived ? 'Активировать' : 'В архив'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg">
              {modalMode === 'create' ? 'Добавить филиал' : 'Редактировать филиал'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1">Название *</span>
                <input
                  {...register('name')}
                  placeholder="Например: Чиланзар"
                  className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Адрес</span>
                <input
                  {...register('address')}
                  placeholder="Улица, дом, ориентир"
                  className={`input input-bordered w-full ${errors.address ? 'input-error' : ''}`}
                />
                {errors.address && <span className="text-xs text-error mt-1">{errors.address.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Телефон</span>
                <input
                  {...register('phone')}
                  placeholder="+998901234567"
                  className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                />
                {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)} disabled={busy}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-sm" />}
                  {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
