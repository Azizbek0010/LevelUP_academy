import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, ShieldAlert, Users, BookOpen } from 'lucide-react';
import { dateShort, ADMIN_STATUS } from '../../format.js';
import { useSuperAdmins, useSuperBranches, useSuperMethodists, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

// ─── Schemas ───────────────────────────────────────────────
const phoneRegex = /^\+?\d{7,20}$/;

const adminCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  email:     z.string().trim().min(1, 'Email обязателен').email('Неверный формат email').max(120),
  password:  z.string().min(8, 'Мин. 8 символов').max(128),
  branchId:  z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const adminEditSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  branchId:  z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const methodistCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  email:     z.string().trim().min(1, 'Email обязателен').email('Неверный формат email').max(120),
  password:  z.string().min(8, 'Мин. 8 символов').max(128),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const methodistEditSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

// ─── Admin Tab ─────────────────────────────────────────────
function AdminsTab() {
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

  const schema = modalMode === 'create' ? adminCreateSchema : adminEditSchema;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const admins = adminsData?.admins || [];
  const branches = branchesData?.branches || [];
  const activeBranches = branches.filter((b) => !b.isArchived);

  const rows = admins.filter((a) => {
    const full = `${a.firstName} ${a.lastName}`.toLowerCase();
    return full.includes(q.toLowerCase())
      || a.email.toLowerCase().includes(q.toLowerCase())
      || (a.branchName || '').toLowerCase().includes(q.toLowerCase());
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
    reset({ firstName: admin.firstName || '', lastName: admin.lastName || '', branchId: admin.branchId || '', phone: admin.phone || '' });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (modalMode === 'create') {
        await api.superCreateAdmin(token, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          email:     formData.email.trim(),
          password:  formData.password,
          branchId:  formData.branchId,
          phone:     formData.phone.trim() || undefined,
        });
      } else {
        await api.superUpdateAdmin(token, currentId, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          branchId:  formData.branchId,
          phone:     formData.phone.trim() || undefined,
        });
      }
      invalidate('super-admins', 'super-dashboard');
      setModalOpen(false);
    } catch (e) {
      setErr(e.status === 409 ? 'Email уже занят' : e.message);
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
    } catch (e) { setErr(e.message); }
  };

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          className="input input-bordered input-sm max-w-xs"
          placeholder="Поиск администратора…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate} disabled={!branches.length}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {showErr && <div className="alert alert-error text-sm mb-3"><span>{showErr}</span></div>}

      {isLoading || !adminsData ? (
        <SkeletonTable rows={6} cols={6} />
      ) : rows.length === 0 ? (
        <p className="text-center opacity-50 py-8 text-sm">Администраторы не найдены</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ФИО</th><th>Email</th><th>Филиал</th><th>Создан</th><th>Статус</th><th className="w-10"></th>
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

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">
              {modalMode === 'create' ? 'Создать администратора' : 'Редактировать администратора'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
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
    </>
  );
}

// ─── Methodist Tab ──────────────────────────────────────────
function MethodistsTab() {
  const { data: methodistsData, isLoading, error } = useSuperMethodists();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);

  const schema = modalMode === 'create' ? methodistCreateSchema : methodistEditSchema;
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const methodists = methodistsData?.methodists || [];

  const rows = methodists.filter((m) => {
    const full = `${m.firstName} ${m.lastName}`.toLowerCase();
    return full.includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase());
  });

  const openCreate = () => {
    setModalMode('create');
    setErr('');
    reset({ firstName: '', lastName: '', email: '', password: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setModalMode('edit');
    setCurrentId(m.id);
    setErr('');
    reset({ firstName: m.firstName || '', lastName: m.lastName || '', phone: m.phone || '' });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (modalMode === 'create') {
        await api.superCreateMethodist(token, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          email:     formData.email.trim(),
          password:  formData.password,
          phone:     formData.phone.trim() || undefined,
        });
      } else {
        await api.superUpdateMethodist(token, currentId, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          phone:     formData.phone.trim() || undefined,
        });
      }
      invalidate('super-methodists');
      setModalOpen(false);
    } catch (e) {
      setErr(e.status === 409 ? 'Email уже занят' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async (m) => {
    setErr('');
    try {
      if (m.status === 'frozen') await api.superUnfreezeMethodist(token, m.id);
      else await api.superFreezeMethodist(token, m.id);
      invalidate('super-methodists');
    } catch (e) { setErr(e.message); }
  };

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <input
          className="input input-bordered input-sm max-w-xs"
          placeholder="Поиск методиста…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {showErr && <div className="alert alert-error text-sm mb-3"><span>{showErr}</span></div>}

      {isLoading || !methodistsData ? (
        <SkeletonTable rows={4} cols={5} />
      ) : rows.length === 0 ? (
        <p className="text-center opacity-50 py-8 text-sm">Методисты не найдены</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ФИО</th><th>Email</th><th>Телефон</th><th>Создан</th><th>Статус</th><th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const s = ADMIN_STATUS[m.status === 'frozen' ? 'frozen' : 'active'] || { label: m.status, cls: 'badge-ghost' };
                return (
                  <tr key={m.id} className={m.status === 'frozen' ? 'opacity-60' : ''}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${m.firstName} ${m.lastName}`} size={32} />
                        <span className="font-semibold">{m.firstName} {m.lastName}</span>
                      </div>
                    </td>
                    <td className="text-sm font-mono">{m.email}</td>
                    <td className="text-sm">{m.phone || '—'}</td>
                    <td className="text-sm tabular-nums">{dateShort(m.createdAt)}</td>
                    <td><span className={`badge badge-sm font-semibold ${s.cls}`}>{s.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        {m.status !== 'frozen' && (
                          <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(m)} title="Редактировать">
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button
                          className={`btn btn-square btn-xs ${m.status === 'frozen' ? 'btn-success btn-outline' : 'btn-ghost text-error'}`}
                          onClick={() => toggleFreeze(m)}
                          title={m.status === 'frozen' ? 'Разморозить' : 'Заморозить'}
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

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold text-lg">
              {modalMode === 'create' ? 'Добавить методиста' : 'Редактировать методиста'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-4">
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
                    <input {...register('email')} placeholder="methodist@levelup.local" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} />
                    {errors.email && <span className="text-xs text-error mt-1">{errors.email.message}</span>}
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text mb-1">Пароль (мин. 8) *</span>
                    <input type="password" {...register('password')} placeholder="••••••••" className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} />
                    {errors.password && <span className="text-xs text-error mt-1">{errors.password.message}</span>}
                  </label>
                </>
              ) : (
                <div className="text-xs text-base-content/50 bg-base-200 rounded-lg px-3 py-2">
                  Email нельзя изменить после создания
                </div>
              )}
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
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function SuperAdmins() {
  const [activeTab, setActiveTab] = useState('admins');
  const { data: adminsData } = useSuperAdmins();
  const { data: methodistsData } = useSuperMethodists();

  const adminCount = adminsData?.admins?.length ?? 0;
  const methodistCount = methodistsData?.methodists?.length ?? 0;

  const tabs = [
    { id: 'admins',     label: 'Администраторы', Icon: Users,    count: adminCount },
    { id: 'methodists', label: 'Методисты',       Icon: BookOpen, count: methodistCount },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Сотрудники" subtitle="Администраторы филиалов и методисты организации" />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-base-200">
            {tabs.map(({ id, label, Icon, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
              >
                <Icon size={16} />
                {label}
                <span className={`badge badge-sm ${activeTab === id ? 'badge-primary' : 'badge-ghost'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'admins'     && <AdminsTab />}
          {activeTab === 'methodists' && <MethodistsTab />}
        </div>
      </div>
    </div>
  );
}
