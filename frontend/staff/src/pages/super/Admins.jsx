import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';
import { dateShort, ADMIN_STATUS } from '../../format.js';
import { useSuperAdmins, useSuperBranches, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const phoneRegex = /^\+?\d{7,20}$/;

const createSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName: z.string().trim().min(1, 'Фамилия обязательна').max(80),
  email: z.string().trim().min(1, 'Email обязателен').email('Неверный формат email').max(120),
  password: z.string().min(8, 'Мин. 8 символов').max(128),
  branchId: z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone: z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const editSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName: z.string().trim().min(1, 'Фамилия обязательна').max(80),
  branchId: z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone: z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

export default function SuperAdmins() {
  const { data: adminsData, isLoading, error } = useSuperAdmins();
  const { data: branchesData } = useSuperBranches();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);

  const schema = modalMode === 'create' ? createSchema : editSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const admins = adminsData?.admins || [];
  const branches = branchesData?.branches || [];
  const activeBranches = branches.filter((b) => !b.isArchived);

  const rows = admins.filter((a) => {
    const full = `${a.firstName} ${a.lastName}`.toLowerCase();
    return full.includes(q.toLowerCase()) || a.email.toLowerCase().includes(q.toLowerCase()) || (a.branchName || '').toLowerCase().includes(q.toLowerCase());
  });

  const openCreate = () => {
    setModalMode('create');
    setErr('');
    reset({ firstName: '', lastName: '', email: '', password: '', branchId: activeBranches?.[0]?.id || '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setModalMode('edit');
    setCurrentId(admin.id);
    setErr('');
    reset({ firstName: admin.firstName || '', lastName: admin.lastName || '', email: admin.email || '', password: '', branchId: admin.branchId || '', phone: admin.phone || '' });
    setModalOpen(true);
  };

  const onFormSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (modalMode === 'create') {
        await api.superCreateAdmin(token, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          branchId: formData.branchId,
          phone: formData.phone.trim() || undefined,
        });
      } else {
        await api.superUpdateAdmin(token, currentId, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          branchId: formData.branchId,
          phone: formData.phone.trim() || undefined,
        });
      }
      invalidate('super-admins', 'super-dashboard');
      setModalOpen(false);
    } catch (e) {
      if (e.status === 409) setErr('Email уже занят');
      else setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async (admin) => {
    setErr('');
    try {
      if (admin.status === 'frozen') await api.superUnfreezeAdmin(token, admin.id);
      else await api.superFreezeAdmin(token, admin.id);
      invalidate('super-admins', 'super-dashboard');
    } catch (e) {
      setErr(e.message);
    }
  };

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Администраторы" subtitle="Управление администраторами филиалов">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate} disabled={!branches.length}>
          <Plus size={16} /> Добавить админа
        </button>
      </PageHeader>

      {showErr && <div className="alert alert-error text-sm"><span>{showErr}</span></div>}

      {isLoading || !adminsData ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body gap-4 p-6">
            <input
              className="input input-bordered input-sm max-w-xs"
              placeholder="Поиск администратора…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {rows.length === 0 ? (
              <p className="text-center opacity-50 py-8">Администраторы не найдены</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Email</th>
                      <th>Филиал</th>
                      <th>Создан</th>
                      <th>Статус</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const s = ADMIN_STATUS[a.status === 'frozen' ? 'frozen' : 'active'] || { label: a.status, cls: 'badge-ghost' };
                      return (
                        <tr key={a.id} className={a.status === 'frozen' ? 'opacity-60' : ''}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={`${a.firstName} ${a.lastName}`} size={32} />
                              <span className="font-semibold">{a.firstName} {a.lastName}</span>
                            </div>
                          </td>
                          <td className="text-sm font-mono">{a.email}</td>
                          <td className="font-medium">{a.branchName || '—'}</td>
                          <td className="text-sm tabular-nums">{dateShort(a.createdAt)}</td>
                          <td><span className={`badge badge-sm font-semibold ${s.cls}`}>{s.label}</span></td>
                          <td>
                            <div className="flex items-center gap-1">
                              {a.status !== 'frozen' && (
                                <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(a)} title="Редактировать">
                                  <Edit2 size={14} />
                                </button>
                              )}
                              <button
                                className={`btn btn-square btn-xs ${a.status === 'frozen' ? 'btn-success btn-outline' : 'btn-ghost text-error'}`}
                                onClick={() => toggleFreeze(a)}
                                title={a.status === 'frozen' ? 'Разморозить' : 'Заморозить'}
                              >
                                <ShieldAlert size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">
              {modalMode === 'create' ? 'Создать администратора' : 'Редактировать администратора'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="form-control w-full">
                  <span className="label-text mb-1">Имя *</span>
                  <input {...register('firstName')} placeholder="Имя" className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`} />
                  {errors.firstName && <span className="text-xs text-error mt-1">{errors.firstName.message}</span>}
                </label>
                <label className="form-control w-full">
                  <span className="label-text mb-1">Фамилия *</span>
                  <input {...register('lastName')} placeholder="Фамилия" className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`} />
                  {errors.lastName && <span className="text-xs text-error mt-1">{errors.lastName.message}</span>}
                </label>
              </div>

              {modalMode === 'create' ? (
                <>
                  <label className="form-control w-full">
                    <span className="label-text mb-1">Email (Логин) *</span>
                    <input {...register('email')} placeholder="admin@levelup.local" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} />
                    {errors.email && <span className="text-xs text-error mt-1">{errors.email.message}</span>}
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text mb-1">Пароль (мин. 8) *</span>
                    <input type="password" {...register('password')} placeholder="••••••••" className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} />
                    {errors.password && <span className="text-xs text-error mt-1">{errors.password.message}</span>}
                  </label>
                </>
              ) : (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Email (Логин)</span>
                  <input type="email" disabled {...register('email')} className="input input-bordered w-full bg-base-200 cursor-not-allowed opacity-70" />
                </label>
              )}

              <label className="form-control w-full">
                <span className="label-text mb-1">Назначить в филиал *</span>
                <select {...register('branchId')} className={`select select-bordered w-full ${errors.branchId ? 'select-error' : ''}`}>
                  <option value="" disabled>Выберите филиал</option>
                  {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <span className="text-xs text-error mt-1">{errors.branchId.message}</span>}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1">Телефон</span>
                <input {...register('phone')} placeholder="+998901234567" className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`} />
                {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
              </label>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)} disabled={busy}>Отмена</button>
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
