import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Edit2, ShieldAlert, KeyRound, Copy, Check, AlertTriangle,
  MoreVertical, ChevronDown,
} from 'lucide-react';
import { dateShort } from '../../format.js';
import { useSuperAdmins, useSuperMentors, useSuperMethodists, useSuperBranches, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import PhoneInput from '../../components/PhoneInput.jsx';
import { Card, SearchInput, StatusBadge, Modal, Dropdown, DropdownItem, Avatar } from './_ui.jsx';

/**
 * «Сотрудники» — раньше две отдельные вкладки (Администраторы / Методисты),
 * каждая со своим поиском. Karis: поиск сверху должен видеть ВСЕХ сотрудников
 * разом (включая менторов — read-only, заводит их Admin филиала, но видеть
 * и находить их Super Admin должен), а у каждой строки должно быть видно,
 * кто это — админ/ментор/методист. Поэтому одна таблица на всех троих.
 *
 * Действия (редактировать/сбросить пароль/заморозить) раньше сидели прямо в
 * строке рядом с местом, по которому кликают, чтобы открыть карточку —
 * лёгкий промах мышью бил не туда. Теперь они в выпадающем меню (тот же
 * паттерн, что и ActionDropdown в admin/Expenses.jsx), с остановкой всплытия
 * клика, чтобы не открывать карточку сотрудника по ошибке.
 */

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

function schemaFor(role, mode) {
  if (role === 'admin') return mode === 'create' ? adminCreateSchema : adminEditSchema;
  return mode === 'create' ? methodistCreateSchema : methodistEditSchema;
}

const STATUS_META = {
  active: { label: 'Активен', tone: 'success' },
  frozen: { label: 'Заморожен', tone: 'danger' },
  fired:  { label: 'Уволен', tone: 'danger' },
};

// Тон роли — не success/warning/error: те заняты статусом и уровнями
// дисциплины, брать их для роли было бы путаницей («красный» ментор ≠
// проблема). primary/info/neutral свободны на этой странице.
const ROLE_META = {
  admin:     { label: 'Администратор', tone: 'primary' },
  mentor:    { label: 'Ментор',        tone: 'info' },
  methodist: { label: 'Методист',      tone: 'neutral' },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] ?? { label: role, tone: 'neutral' };
  return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>;
}

// ─── Показ сгенерированного пароля (один раз) ────────────────
function TempPasswordModal({ email, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(password || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal isOpen title="Пароль сгенерирован" onClose={onClose} className="max-w-lg border border-base-300" actions={<button className="btn btn-primary w-full" onClick={onClose}>Готово</button>}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-success/20 grid place-items-center">
          <Check size={24} className="text-success" />
        </div>
        <div>
          <h4 className="font-bold text-success">Готово!</h4>
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
    </Modal>
  );
}

// ─── Действия над строкой сотрудника ──────────────────────────
// Ментор — read-only для Super Admin (заводит и правит его Admin филиала),
// поэтому у него в меню нечего показывать.
function StaffActionsMenu({ row, resetBusy, onEdit, onResetPassword, onToggleFreeze }) {
  if (row.role === 'mentor') {
    return <span className="text-xs text-base-content/30 px-2">только просмотр</span>;
  }
  const frozen = row.status === 'frozen';
  return (
    <Dropdown
      trigger={(toggle) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base-content/45 hover:text-base-content hover:bg-base-200 transition-all"
        >
          <MoreVertical size={16} />
        </button>
      )}
    >
      {(close) => (
        <>
          {!frozen && (
            <>
              <DropdownItem icon={Edit2} onClick={() => { onEdit(row); close(); }}>
                Редактировать
              </DropdownItem>
              <DropdownItem
                icon={KeyRound}
                disabled={resetBusy}
                onClick={() => { onResetPassword(row); close(); }}
              >
                {resetBusy ? 'Сброс пароля…' : 'Сбросить пароль'}
              </DropdownItem>
              <div className="border-t border-base-300 my-1" />
            </>
          )}
          <DropdownItem
            icon={ShieldAlert}
            danger={!frozen}
            onClick={() => { onToggleFreeze(row); close(); }}
          >
            {frozen ? 'Разморозить' : 'Заморозить'}
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

// ─── Кнопка «Добавить» — выбор роли (ментора Super Admin не заводит) ────
function AddStaffButton({ onPick, disabled }) {
  return (
    <Dropdown
      trigger={(toggle) => (
        <button
          className="btn btn-primary btn-sm gap-1.5"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          disabled={disabled}
        >
          <Plus size={16} /> Добавить <ChevronDown size={14} />
        </button>
      )}
    >
      {(close) => (
        <>
          <DropdownItem onClick={() => { onPick('admin'); close(); }}>Администратора</DropdownItem>
          <DropdownItem onClick={() => { onPick('methodist'); close(); }}>Методиста</DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export default function SuperAdmins() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const invalidate = useInvalidate();

  const admins = useSuperAdmins();
  const mentors = useSuperMentors();
  const methodists = useSuperMethodists();
  const branchesQ = useSuperBranches();

  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [formModal, setFormModal] = useState(null); // { role: 'admin'|'methodist', mode: 'create'|'edit', id }
  const [busy, setBusy] = useState(false);
  const [resetBusyId, setResetBusyId] = useState(null);
  const [tempPassword, setTempPassword] = useState(null); // { email, password }

  const schema = formModal ? schemaFor(formModal.role, formModal.mode) : adminCreateSchema;
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const branches = branchesQ.data?.branches || [];
  const activeBranches = branches.filter((b) => !b.isArchived);

  const allRows = useMemo(() => [
    ...(admins.data?.admins ?? []).map((u) => ({ ...u, role: 'admin' })),
    ...(mentors.data?.mentors ?? []).map((u) => ({ ...u, role: 'mentor' })),
    ...(methodists.data?.methodists ?? []).map((u) => ({ ...u, role: 'methodist' })),
  ], [admins.data, mentors.data, methodists.data]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = !query ? allRows : allRows.filter((r) => {
      const full = `${r.firstName} ${r.lastName}`.toLowerCase();
      return full.includes(query)
        || (r.email || '').toLowerCase().includes(query)
        || (r.branchName || '').toLowerCase().includes(query);
    });
    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allRows, q]);

  const loading = admins.isLoading || mentors.isLoading || methodists.isLoading;
  const loadError = [admins.error, mentors.error, methodists.error].find((e) => e && e.status !== 401);
  const showErr = err || loadError?.message || '';

  const openCreate = (role) => {
    setErr('');
    if (role === 'admin') reset({ firstName: '', lastName: '', email: '', branchId: activeBranches?.[0]?.id || '', phone: '' });
    else reset({ firstName: '', lastName: '', email: '', phone: '' });
    setFormModal({ role, mode: 'create', id: null });
  };

  const openEdit = (row) => {
    setErr('');
    if (row.role === 'admin') {
      reset({
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        branchId: row.branchId || '',
        phone: row.phone || '',
        monthlySalary: row.monthlySalary ?? '',
      });
    } else {
      reset({
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        phone: row.phone || '',
        monthlySalary: row.monthlySalary ?? '',
      });
    }
    setFormModal({ role: row.role, mode: 'edit', id: row.id, email: row.email });
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (formModal.role === 'admin') {
        if (formModal.mode === 'create') {
          const { admin } = await api.superCreateAdmin(token, {
            firstName: formData.firstName.trim(),
            lastName:  formData.lastName.trim(),
            email:     formData.email.trim(),
            branchId:  formData.branchId,
            phone:     formData.phone.trim() || undefined,
          });
          setTempPassword({ email: admin.email, password: admin.tempPassword });
        } else {
          await api.superUpdateAdmin(token, formModal.id, {
            firstName: formData.firstName.trim(),
            lastName:  formData.lastName.trim(),
            branchId:  formData.branchId,
            phone:     formData.phone.trim() || undefined,
            monthlySalary: formData.monthlySalary,
          });
        }
        invalidate('super-admins', 'super-dashboard');
      } else {
        if (formModal.mode === 'create') {
          const { methodist } = await api.superCreateMethodist(token, {
            firstName: formData.firstName.trim(),
            lastName:  formData.lastName.trim(),
            email:     formData.email.trim(),
            phone:     formData.phone.trim() || undefined,
          });
          setTempPassword({ email: methodist.email, password: methodist.tempPassword });
        } else {
          await api.superUpdateMethodist(token, formModal.id, {
            firstName: formData.firstName.trim(),
            lastName:  formData.lastName.trim(),
            phone:     formData.phone.trim() || undefined,
            monthlySalary: formData.monthlySalary,
          });
        }
        invalidate('super-methodists');
      }
      setFormModal(null);
    } catch (e) {
      setErr(e.status === 409 ? 'Email уже занят' : e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFreeze = async (row) => {
    setErr('');
    try {
      if (row.role === 'admin') {
        if (row.status === 'frozen') await api.superUnfreezeAdmin(token, row.id);
        else await api.superFreezeAdmin(token, row.id);
        invalidate('super-admins', 'super-dashboard');
      } else {
        if (row.status === 'frozen') await api.superUnfreezeMethodist(token, row.id);
        else await api.superFreezeMethodist(token, row.id);
        invalidate('super-methodists');
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetPassword = async (row) => {
    setErr('');
    setResetBusyId(row.id);
    try {
      if (row.role === 'admin') {
        const { admin } = await api.superResetAdminPassword(token, row.id);
        setTempPassword({ email: row.email, password: admin.tempPassword });
      } else {
        const { methodist } = await api.superResetMethodistPassword(token, row.id);
        setTempPassword({ email: row.email, password: methodist.tempPassword });
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setResetBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Сотрудники" subtitle="Администраторы, менторы и методисты организации" />

      <Card className="p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Поиск по имени, email, филиалу…"
              className="w-full max-w-xs"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-base-content/45">
                Показано {rows.length} из {allRows.length}
              </span>
              <AddStaffButton onPick={openCreate} disabled={!branches.length} />
            </div>
          </div>

          {showErr && <div className="alert alert-error text-sm mb-3"><span>{showErr}</span></div>}

          {loading ? (
            <SkeletonTable rows={6} cols={7} />
          ) : rows.length === 0 ? (
            <p className="text-center opacity-50 py-8 text-sm">
              {allRows.length === 0 ? 'Сотрудников пока нет' : 'По запросу ничего не найдено'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ФИО</th><th>Роль</th><th>Email</th><th>Телефон</th>
                    <th>Филиал</th><th>Создан</th><th>Статус</th><th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const s = STATUS_META[row.status] || { label: row.status, tone: 'neutral' };
                    const dimmed = row.status === 'frozen' || row.status === 'fired';
                    return (
                      <tr
                        key={`${row.role}-${row.id}`}
                        className={`cursor-pointer hover:bg-base-200/50 ${dimmed ? 'opacity-60' : ''}`}
                        onClick={() => navigate(`/admins/${row.role}/${row.id}`)}
                      >
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={`${row.firstName} ${row.lastName}`} size="md" />
                            <span className="font-semibold">{row.firstName} {row.lastName}</span>
                          </div>
                        </td>
                        <td><RoleBadge role={row.role} /></td>
                        <td className="text-sm font-mono">{row.email}</td>
                        <td className="text-sm font-mono">{row.phone || '—'}</td>
                        <td className="font-medium">{row.branchName || '—'}</td>
                        <td className="text-sm tabular-nums">{dateShort(row.createdAt)}</td>
                        <td><StatusBadge tone={s.tone}>{s.label}</StatusBadge></td>
                        <td className="text-right">
                          <StaffActionsMenu
                            row={row}
                            resetBusy={resetBusyId === row.id}
                            onEdit={openEdit}
                            onResetPassword={resetPassword}
                            onToggleFreeze={toggleFreeze}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      <Modal
        isOpen={!!formModal}
        onClose={() => setFormModal(null)}
        title={formModal ? (
          formModal.mode === 'create'
            ? `Создать ${formModal.role === 'admin' ? 'администратора' : 'методиста'}`
            : `Редактировать ${formModal.role === 'admin' ? 'администратора' : 'методиста'}`
        ) : ''}
      >
        {formModal && (
          <>
            {err && <div className="alert alert-error text-sm py-2 mb-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              {formModal.mode === 'create' ? (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Email (Логин) *</span>
                  <input {...register('email')} placeholder={`${formModal.role}@levelup.local`} className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} />
                  {errors.email && <span className="text-xs text-error mt-1">{errors.email.message}</span>}
                  <span className="text-xs text-base-content/45 mt-1">Пароль сгенерируется автоматически и покажется после создания</span>
                </label>
              ) : formModal.role === 'admin' ? (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Email (Логин)</span>
                  <input type="email" disabled value={formModal.email || ''} className="input input-bordered w-full bg-base-200 cursor-not-allowed opacity-70" />
                </label>
              ) : (
                <div className="text-xs text-base-content/50 bg-base-200 rounded-lg px-3 py-2">
                  Email нельзя изменить после создания
                </div>
              )}
              {formModal.role === 'admin' && (
                <label className="form-control w-full">
                  <span className="label-text mb-1">Назначить в филиал *</span>
                  <select {...register('branchId')} className={`select select-bordered w-full ${errors.branchId ? 'select-error' : ''}`}>
                    <option value="" disabled>Выберите филиал</option>
                    {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {errors.branchId && <span className="text-xs text-error mt-1">{errors.branchId.message}</span>}
                </label>
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
              {formModal.mode === 'edit' && (
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormModal(null)} disabled={busy}>Отмена</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-sm" />}
                  {formModal.mode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      {tempPassword && (
        <TempPasswordModal
          email={tempPassword.email}
          password={tempPassword.password}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}
