import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, ShieldAlert, Users, BookOpen, KeyRound, Copy, Check, AlertTriangle } from 'lucide-react';
import { dateShort, ADMIN_STATUS } from '../../format.js';
import { useSuperAdmins, useSuperBranches, useSuperMethodists, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import PhoneInput from '../../components/PhoneInput.jsx';

// ─── Schemas ───────────────────────────────────────────────
// Пароль больше не вводится руками — сервер генерирует случайный и отдаёт
// один раз в ответе (tempPassword), так же как при заведении Super Admin
// Main Admin'ом. Опечатка/автозаполнение браузера в этом поле раньше давали
// аккаунт с паролем, который никто потом не мог вспомнить, а сбросить было
// нечем — теперь для этого есть кнопка «Сбросить пароль».
const phoneRegex = /^\+?\d{7,20}$/;

// Оклад — метаданные карточки, не пересчитывается автоматически (см. backend
// super.schemas.js). Пустое поле = не трогать текущее значение, поэтому '' до
// coerce превращается в undefined, а не в 0.
const monthlySalaryField = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.coerce.number().min(0, 'Не может быть отрицательным').max(1_000_000_000_000).optional(),
);

const adminCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  email:     z.string().trim().min(1, 'Email обязателен').email('Неверный формат email').max(120),
  branchId:  z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const adminEditSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  branchId:  z.string().uuid('Выберите филиал').min(1, 'Выберите филиал'),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
  monthlySalary: monthlySalaryField,
});

const methodistCreateSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  email:     z.string().trim().min(1, 'Email обязателен').email('Неверный формат email').max(120),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
});

const methodistEditSchema = z.object({
  firstName: z.string().trim().min(1, 'Имя обязательно').max(80),
  lastName:  z.string().trim().min(1, 'Фамилия обязательна').max(80),
  phone:     z.string().trim().regex(phoneRegex, 'Формат: +998901234567').or(z.literal('')),
  monthlySalary: monthlySalaryField,
});

// ─── Показ сгенерированного пароля (один раз) ────────────────
function TempPasswordModal({ email, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(password || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-success/20 grid place-items-center">
            <Check size={24} className="text-success" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-success">Готово!</h3>
            <p className="text-sm text-base-content/60">Пароль сгенерирован автоматически</p>
          </div>
        </div>
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-warning">Сохраните пароль — показывается только один раз!</p>
          </div>
          <div className="bg-base-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-base-content/55 w-16 shrink-0">Логин:</span>
              <span className="font-semibold">{email}</span>
            </div>
            <div className="border-t border-base-200 pt-2 mt-2">
              <div className="text-xs text-base-content/50 mb-1.5 font-semibold uppercase tracking-wider">Пароль</div>
              <div className="flex items-center gap-2">
                <code className="font-mono font-bold text-xl tracking-widest bg-base-200 px-3 py-2 rounded-lg flex-1 text-center">
                  {password}
                </code>
                <button className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'} gap-1.5`} onClick={copy}>
                  {copied ? <><Check size={14} /> Скопировано</> : <><Copy size={14} /> Копировать</>}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-primary w-full" onClick={onClose}>Готово</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

// ─── Admin Tab ─────────────────────────────────────────────
function AdminsTab() {
  const { data: adminsData, isLoading, error } = useSuperAdmins();
  const { data: branchesData } = useSuperBranches();
  const { token } = useAuth();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resetBusyId, setResetBusyId] = useState(null);
  const [tempPassword, setTempPassword] = useState(null); // { email, password }

  const schema = modalMode === 'create' ? adminCreateSchema : adminEditSchema;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

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
    reset({ firstName: '', lastName: '', email: '', branchId: activeBranches?.[0]?.id || '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setModalMode('edit');
    setCurrentId(admin.id);
    setErr('');
    reset({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      branchId: admin.branchId || '',
      phone: admin.phone || '',
      monthlySalary: admin.monthlySalary ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (modalMode === 'create') {
        const { admin } = await api.superCreateAdmin(token, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          email:     formData.email.trim(),
          branchId:  formData.branchId,
          phone:     formData.phone.trim() || undefined,
        });
        setTempPassword({ email: admin.email, password: admin.tempPassword });
      } else {
        await api.superUpdateAdmin(token, currentId, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          branchId:  formData.branchId,
          phone:     formData.phone.trim() || undefined,
          monthlySalary: formData.monthlySalary,
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

  const resetPassword = async (admin) => {
    setErr('');
    setResetBusyId(admin.id);
    try {
      const { admin: updated } = await api.superResetAdminPassword(token, admin.id);
      setTempPassword({ email: admin.email, password: updated.tempPassword });
    } catch (e) {
      setErr(e.message);
    } finally {
      setResetBusyId(null);
    }
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
                <th>ФИО</th><th>Email</th><th>Телефон</th><th>Филиал</th><th>Создан</th><th>Статус</th><th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const s = ADMIN_STATUS[a.status === 'frozen' ? 'frozen' : 'active'] || { label: a.status, cls: 'badge-ghost' };
                return (
                  <tr
                    key={a.id}
                    className={`cursor-pointer hover:bg-base-200/50 ${a.status === 'frozen' ? 'opacity-60' : ''}`}
                    onClick={() => navigate(`/admins/admin/${a.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${a.firstName} ${a.lastName}`} size={32} />
                        <span className="font-semibold">{a.firstName} {a.lastName}</span>
                      </div>
                    </td>
                    <td className="text-sm font-mono">{a.email}</td>
                    <td className="text-sm font-mono">{a.phone || '—'}</td>
                    <td className="font-medium">{a.branchName || '—'}</td>
                    <td className="text-sm tabular-nums">{dateShort(a.createdAt)}</td>
                    <td><span className={`badge badge-sm font-semibold ${s.cls}`}>{s.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {a.status !== 'frozen' && (
                          <>
                            <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(a)} title="Редактировать">
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-square btn-xs"
                              onClick={() => resetPassword(a)}
                              disabled={resetBusyId === a.id}
                              title="Сбросить пароль"
                            >
                              {resetBusyId === a.id
                                ? <span className="loading loading-spinner loading-xs" />
                                : <KeyRound size={14} />}
                            </button>
                          </>
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
                <label className="form-control w-full">
                  <span className="label-text mb-1">Email (Логин) *</span>
                  <input {...register('email')} placeholder="admin@levelup.local" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} />
                  {errors.email && <span className="text-xs text-error mt-1">{errors.email.message}</span>}
                  <span className="text-xs text-base-content/45 mt-1">Пароль сгенерируется автоматически и покажется после создания</span>
                </label>
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
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                    />
                  )}
                />
                {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
              </label>
              {modalMode === 'edit' && (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Оклад, UZS</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('monthlySalary')}
                    placeholder="Не указан"
                    className={`input input-bordered w-full ${errors.monthlySalary ? 'input-error' : ''}`}
                  />
                  {errors.monthlySalary
                    ? <span className="text-xs text-error mt-1">{errors.monthlySalary.message}</span>
                    : <span className="text-xs text-base-content/45 mt-1">Метаданные карточки — не участвует в автоматических расчётах</span>}
                </label>
              )}
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

      {tempPassword && (
        <TempPasswordModal
          email={tempPassword.email}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
      )}
    </>
  );
}

// ─── Methodist Tab ──────────────────────────────────────────
function MethodistsTab() {
  const { data: methodistsData, isLoading, error } = useSuperMethodists();
  const { token } = useAuth();
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resetBusyId, setResetBusyId] = useState(null);
  const [tempPassword, setTempPassword] = useState(null); // { email, password }

  const schema = modalMode === 'create' ? methodistCreateSchema : methodistEditSchema;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const methodists = methodistsData?.methodists || [];

  const rows = methodists.filter((m) => {
    const full = `${m.firstName} ${m.lastName}`.toLowerCase();
    return full.includes(q.toLowerCase()) || m.email.toLowerCase().includes(q.toLowerCase());
  });

  const openCreate = () => {
    setModalMode('create');
    setErr('');
    reset({ firstName: '', lastName: '', email: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setModalMode('edit');
    setCurrentId(m.id);
    setErr('');
    reset({
      firstName: m.firstName || '',
      lastName: m.lastName || '',
      phone: m.phone || '',
      monthlySalary: m.monthlySalary ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (modalMode === 'create') {
        const { methodist } = await api.superCreateMethodist(token, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          email:     formData.email.trim(),
          phone:     formData.phone.trim() || undefined,
        });
        setTempPassword({ email: methodist.email, password: methodist.tempPassword });
      } else {
        await api.superUpdateMethodist(token, currentId, {
          firstName: formData.firstName.trim(),
          lastName:  formData.lastName.trim(),
          phone:     formData.phone.trim() || undefined,
          monthlySalary: formData.monthlySalary,
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

  const resetPassword = async (m) => {
    setErr('');
    setResetBusyId(m.id);
    try {
      const { methodist } = await api.superResetMethodistPassword(token, m.id);
      setTempPassword({ email: m.email, password: methodist.tempPassword });
    } catch (e) {
      setErr(e.message);
    } finally {
      setResetBusyId(null);
    }
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
                  <tr
                    key={m.id}
                    className={`cursor-pointer hover:bg-base-200/50 ${m.status === 'frozen' ? 'opacity-60' : ''}`}
                    onClick={() => navigate(`/admins/methodist/${m.id}`)}
                  >
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {m.status !== 'frozen' && (
                          <>
                            <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(m)} title="Редактировать">
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-square btn-xs"
                              onClick={() => resetPassword(m)}
                              disabled={resetBusyId === m.id}
                              title="Сбросить пароль"
                            >
                              {resetBusyId === m.id
                                ? <span className="loading loading-spinner loading-xs" />
                                : <KeyRound size={14} />}
                            </button>
                          </>
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
                <label className="form-control w-full">
                  <span className="label-text mb-1">Email (Логин) *</span>
                  <input {...register('email')} placeholder="methodist@levelup.local" className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} />
                  {errors.email && <span className="text-xs text-error mt-1">{errors.email.message}</span>}
                  <span className="text-xs text-base-content/45 mt-1">Пароль сгенерируется автоматически и покажется после создания</span>
                </label>
              ) : (
                <div className="text-xs text-base-content/50 bg-base-200 rounded-lg px-3 py-2">
                  Email нельзя изменить после создания
                </div>
              )}
              <label className="form-control w-full">
                <span className="label-text mb-1">Телефон</span>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                    />
                  )}
                />
                {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
              </label>
              {modalMode === 'edit' && (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Оклад, UZS</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('monthlySalary')}
                    placeholder="Не указан"
                    className={`input input-bordered w-full ${errors.monthlySalary ? 'input-error' : ''}`}
                  />
                  {errors.monthlySalary
                    ? <span className="text-xs text-error mt-1">{errors.monthlySalary.message}</span>
                    : <span className="text-xs text-base-content/45 mt-1">Метаданные карточки — не участвует в автоматических расчётах</span>}
                </label>
              )}
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

      {tempPassword && (
        <TempPasswordModal
          email={tempPassword.email}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
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
