import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { fmt, money, dateShort } from '../../format.js';
import { useSuperBranches, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const branchSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(80, 'Макс. 80 символов'),
  address: z.string().trim().max(160, 'Макс. 160 символов').or(z.literal('')),
  phone: z.string().trim()
    .refine(
      (val) => val === '' || /^\+998\d{9}$/.test(val),
      'Формат телефона должен быть: +998XXXXXXXXX (9 цифр)'
    )
    .or(z.literal('')),
});

export default function SuperBranches() {
  const { data, isLoading, error, refetch } = useSuperBranches();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Стейты подтверждения архивации
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null); // { id, name, isArchived }

  // Установка динамического заголовка вкладки
  useEffect(() => {
    document.title = 'Филиалы | LevelUp Academy';
  }, []);

  // Слушатель Esc для быстрого закрытия модалок
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleArchiveClick = (id, name, isArchived) => {
    setArchiveTarget({ id, name, isArchived });
    setConfirmOpen(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setErr('');
    setBusy(true);
    try {
      if (archiveTarget.isArchived) {
        await api.superUnarchiveBranch(token, archiveTarget.id);
      } else {
        await api.superArchiveBranch(token, archiveTarget.id);
      }
      invalidate('super-branches', 'super-dashboard');
      setConfirmOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      setArchiveTarget(null);
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

      {error && error.status !== 401 ? (
        <div className="card bg-base-100 shadow-sm border border-error/20 max-w-lg mx-auto mt-6">
          <div className="card-body items-center text-center p-6 gap-3">
            <div className="p-3 bg-error/10 text-error rounded-full">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-bold text-lg">Ошибка загрузки филиалов</h3>
            <p className="text-sm text-base-content/60">{error.message || 'Произошла непредвиденная ошибка при запросе к серверу.'}</p>
            <div className="card-actions mt-2">
              <button className="btn btn-primary btn-sm px-6" onClick={() => refetch()}>
                Повторить попытку
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

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
                <div className="card bg-base-100 shadow-sm border border-dashed border-base-300">
                  <div className="card-body text-center py-16 space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40">
                      <Building2 size={32} />
                    </div>
                    <div className="max-w-sm mx-auto">
                      <h3 className="text-lg font-bold">Нет филиалов</h3>
                      <p className="text-sm text-base-content/50 mt-1">
                        {q ? 'По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.' : 'Филиалов пока нет. Создайте первый филиал, чтобы начать работу.'}
                      </p>
                    </div>
                    {!q && (
                      <button className="btn btn-primary btn-sm mx-auto gap-1.5" onClick={openCreate}>
                        <Plus size={16} /> Создать первый филиал
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rows.map((b) => (
                    <div
                      key={b.id}
                      className={`card bg-base-100 border border-base-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 ${b.isArchived ? 'opacity-65' : ''}`}
                    >
                      {/* Status indicator bar at the very bottom */}
                      {b.isArchived ? (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-base-300" />
                      ) : b.debt > 0 ? (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-error/50 to-error animate-pulse" />
                      ) : (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/30 via-primary to-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}

                      <div className="card-body p-5 gap-3">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm shadow-primary/5">
                              <Building2 size={18} className="text-primary" />
                            </div>
                            <div>
                              <Link to={`/branches/${b.id}`} className="font-bold hover:text-primary text-base leading-snug block transition-colors">
                                {b.name}
                              </Link>
                              {b.isMain && (
                                <span className="inline-block bg-gradient-to-r from-primary to-lime-400 text-primary-content text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 shadow-sm shadow-primary/10">
                                  Главный
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`badge badge-sm border-0 font-medium ${b.isArchived ? 'badge-ghost text-base-content/50' : 'bg-success/10 text-success'}`}>
                            {b.isArchived ? 'Архив' : 'Активен'}
                          </span>
                        </div>

                        {/* Address & Phone */}
                        <div className="space-y-1.5 text-xs text-base-content/60 border-t border-base-200 pt-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="shrink-0 text-base-content/40" />
                            <span>{b.address || 'Адрес не указан'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone size={13} className="shrink-0 text-base-content/40" />
                            <span>{b.phone || 'Телефон не указан'}</span>
                          </div>
                        </div>

                        {/* Stats 2x2 with slightly improved layout */}
                        <div className="grid grid-cols-2 gap-3 mt-1 bg-base-200/30 border border-base-200/50 rounded-xl p-3 text-xs">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Ученики</div>
                            <div className="text-sm font-extrabold mt-0.5 tabular-nums text-base-content/80">{fmt(b.students)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Админы</div>
                            <div className="text-sm font-extrabold mt-0.5 tabular-nums text-base-content/80">{fmt(b.admins)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Доход</div>
                            <div className="text-sm font-extrabold mt-0.5 text-success tabular-nums">{money(b.revenue)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Долг</div>
                            <div className={`text-sm font-extrabold mt-0.5 tabular-nums ${b.debt > 0 ? 'text-error font-black' : 'text-base-content/40'}`} title={money(b.debt)}>
                              {money(b.debt)}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-1.5 mt-1 pt-2 border-t border-base-200 text-xs">
                          {!b.isArchived && (
                            <button
                              className="btn btn-ghost btn-xs text-base-content/70 hover:text-primary transition-colors"
                              onClick={() => openEdit(b)}
                            >
                              Изменить
                            </button>
                          )}
                          <button
                            className={`btn btn-xs transition-colors ${b.isArchived ? 'btn-ghost text-base-content/70 hover:text-primary' : 'btn-ghost text-error/80 hover:text-error'}`}
                            onClick={() => handleArchiveClick(b.id, b.name, b.isArchived)}
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
        </>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl border border-base-200 shadow-xl">
            <h3 className="font-bold text-lg">
              {modalMode === 'create' ? 'Добавить филиал' : 'Редактировать филиал'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1">Название *</span>
                <input
                  {...register('name')}
                  autoFocus
                  placeholder="Например: Чиланзар"
                  className={`input input-bordered w-full rounded-xl ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Адрес</span>
                <input
                  {...register('address')}
                  placeholder="Улица, дом, ориентир"
                  className={`input input-bordered w-full rounded-xl ${errors.address ? 'input-error' : ''}`}
                />
                {errors.address && <span className="text-xs text-error mt-1">{errors.address.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Телефон</span>
                <input
                  {...register('phone')}
                  placeholder="+998901234567"
                  className={`input input-bordered w-full rounded-xl ${errors.phone ? 'input-error' : ''}`}
                />
                {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost btn-sm rounded-xl" onClick={() => setModalOpen(false)} disabled={busy}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary btn-sm rounded-xl shadow-sm shadow-primary/10" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-sm" />}
                  {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}

      {/* Confirm Archive Modal */}
      {confirmOpen && archiveTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-2xl border border-base-200 shadow-xl">
            <div className="flex items-center gap-3 text-warning">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="font-bold text-lg">
                {archiveTarget.isArchived ? 'Активировать?' : 'Архивировать?'}
              </h3>
            </div>
            <p className="text-sm text-base-content/60 mt-3">
              {archiveTarget.isArchived
                ? `Вы действительно хотите вернуть филиал «${archiveTarget.name}» в список активных?`
                : `Вы действительно хотите архивировать филиал «${archiveTarget.name}»? Это временно скроет его из активного списка.`}
            </p>
            <div className="modal-action gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                Отмена
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-xl ${archiveTarget.isArchived ? 'btn-primary' : 'btn-error text-error-content'}`}
                onClick={confirmArchive}
                disabled={busy}
              >
                {busy && <span className="loading loading-spinner loading-sm" />}
                Да, продолжить
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmOpen(false)} />
        </div>
      )}
    </div>
  );
}
