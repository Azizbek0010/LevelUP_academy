import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Snowflake, Sun, Users, BookOpen, Mail, Phone } from 'lucide-react';
import clsx from 'clsx';
import { adminsApi, type AdminItem, type AdminCreateInput } from '../../../shared/api/endpoints/admins';
import { methodistsApi, type MethodistItem, type MethodistCreateInput } from '../../../shared/api/endpoints/methodists';
import { branchesApi } from '../../../shared/api/endpoints/branches';
import { PageHeader, Avatar } from '../../../shared/ui/PageHeader';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import { useForm } from 'react-hook-form';

type Tab = 'admins' | 'methodists';

export default function UsersPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('admins');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();

  const adminsQuery = useQuery({ queryKey: ['admins'], queryFn: () => adminsApi.list() });
  const methodistsQuery = useQuery({ queryKey: ['methodists'], queryFn: () => methodistsApi.list() });

  const admins = adminsQuery.data?.admins ?? [];
  const methodists = methodistsQuery.data?.methodists ?? [];

  const filteredAdmins = admins.filter((a) =>
    `${a.firstName} ${a.lastName} ${a.email} ${a.branchName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMethodists = methodists.filter((m) =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(search.toLowerCase()),
  );

  const freezeAdmin = useMutation({
    mutationFn: ({ id, frozen }: { id: string; frozen: boolean }) => adminsApi.freeze(id, frozen),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admins'] }); toast.success('Статус обновлён'); },
    onError: () => toast.error('Не удалось обновить статус'),
  });

  const freezeMethodist = useMutation({
    mutationFn: ({ id, frozen }: { id: string; frozen: boolean }) => methodistsApi.freeze(id, frozen),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['methodists'] }); toast.success('Статус обновлён'); },
    onError: () => toast.error('Не удалось обновить статус'),
  });

  const isLoading = tab === 'admins' ? adminsQuery.isLoading : methodistsQuery.isLoading;

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Сотрудники"
        subtitle="Управление администраторами и методистами"
        right={
          <button className="btn btn-primary btn-sm gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Добавить
          </button>
        }
      />

      {/* Tabs */}
      <div className="tabs tabs-box w-fit">
        <button className={clsx('tab gap-2', tab === 'admins' && 'tab-active')} onClick={() => setTab('admins')}>
          <Users className="size-4" />
          Администраторы
          <span className="badge badge-sm">{admins.length}</span>
        </button>
        <button className={clsx('tab gap-2', tab === 'methodists' && 'tab-active')} onClick={() => setTab('methodists')}>
          <BookOpen className="size-4" />
          Методисты
          <span className="badge badge-sm">{methodists.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
        <input className="input input-bordered pl-9 w-full" placeholder="Поиск по имени, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Всего администраторов" value={admins.length} color="oklch(85% 0.22 130)" />
        <StatCard label="Активных" value={admins.filter((a) => a.status === 'active').length} color="oklch(78% 0.18 145)" />
        <StatCard label="Методистов" value={methodists.length} color="oklch(70% 0.20 300)" />
        <StatCard label="Заморожено" value={[...admins, ...methodists].filter((u) => u.status === 'frozen').length} color="oklch(68% 0.22 25)" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-base-200 rounded-xl animate-pulse" />)}
        </div>
      ) : tab === 'admins' ? (
        <AdminsTable admins={filteredAdmins} onFreeze={(id, frozen) => freezeAdmin.mutate({ id, frozen })} />
      ) : (
        <MethodistsTable methodists={filteredMethodists} onFreeze={(id, frozen) => freezeMethodist.mutate({ id, frozen })} />
      )}

      {addOpen && (
        <AddUserModal
          tab={tab}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: tab === 'admins' ? ['admins'] : ['methodists'] });
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function AdminsTable({ admins, onFreeze }: { admins: AdminItem[]; onFreeze: (id: string, frozen: boolean) => void }) {
  if (admins.length === 0) return (
    <div className="card bg-base-100 border border-base-300 p-12 text-center">
      <Users className="size-10 text-base-content/20 mx-auto mb-3" />
      <p className="text-base-content/50">Администраторов не найдено</p>
    </div>
  );

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-sm dense-table">
          <thead className="bg-base-200/60">
            <tr>
              <th>Имя</th><th>Email</th><th>Телефон</th><th>Филиал</th><th>Статус</th><th className="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-base-200/40">
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={`${a.firstName} ${a.lastName}`} size="sm" />
                    <span className="font-medium">{a.firstName} {a.lastName}</span>
                  </div>
                </td>
                <td className="text-sm"><a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-primary text-base-content/70"><Mail className="size-3" />{a.email}</a></td>
                <td className="text-sm text-base-content/60">{a.phone ? <span className="flex items-center gap-1"><Phone className="size-3" />{a.phone}</span> : '—'}</td>
                <td className="text-sm">{a.branchName ?? '—'}</td>
                <td><StatusBadge status={a.status} /></td>
                <td className="text-right">
                  <button className={clsx('btn btn-xs gap-1', a.status === 'active' ? 'btn-ghost text-warning' : 'btn-ghost text-success')} onClick={() => onFreeze(a.id, a.status === 'active')}>
                    {a.status === 'active' ? <><Snowflake className="size-3" />Заморозить</> : <><Sun className="size-3" />Разморозить</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MethodistsTable({ methodists, onFreeze }: { methodists: MethodistItem[]; onFreeze: (id: string, frozen: boolean) => void }) {
  if (methodists.length === 0) return (
    <div className="card bg-base-100 border border-base-300 p-12 text-center">
      <BookOpen className="size-10 text-base-content/20 mx-auto mb-3" />
      <p className="text-base-content/50">Методистов не найдено</p>
    </div>
  );

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-sm dense-table">
          <thead className="bg-base-200/60">
            <tr>
              <th>Имя</th><th>Email</th><th>Телефон</th><th>Статус</th><th className="text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {methodists.map((m) => (
              <tr key={m.id} className="hover:bg-base-200/40">
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
                    <span className="font-medium">{m.firstName} {m.lastName}</span>
                  </div>
                </td>
                <td className="text-sm"><a href={`mailto:${m.email}`} className="flex items-center gap-1 hover:text-primary text-base-content/70"><Mail className="size-3" />{m.email}</a></td>
                <td className="text-sm text-base-content/60">{m.phone ? <span className="flex items-center gap-1"><Phone className="size-3" />{m.phone}</span> : '—'}</td>
                <td><StatusBadge status={m.status} /></td>
                <td className="text-right">
                  <button className={clsx('btn btn-xs gap-1', m.status === 'active' ? 'btn-ghost text-warning' : 'btn-ghost text-success')} onClick={() => onFreeze(m.id, m.status === 'active')}>
                    {m.status === 'active' ? <><Snowflake className="size-3" />Заморозить</> : <><Sun className="size-3" />Разморозить</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddUserModal({ tab, onClose, onSuccess }: { tab: Tab; onClose: () => void; onSuccess: () => void }) {
  const { data: branchesData } = useQuery({ queryKey: ['branches'], queryFn: () => branchesApi.list() });
  const branches = (branchesData?.branches ?? []).filter((b) => !b.isArchived);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminCreateInput & MethodistCreateInput & { branchId: string }>();

  const createAdmin = useMutation({ mutationFn: (d: AdminCreateInput) => adminsApi.create(d) });
  const createMethodist = useMutation({ mutationFn: (d: MethodistCreateInput) => methodistsApi.create(d) });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (tab === 'admins') {
        await createAdmin.mutateAsync({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password, branchId: data.branchId, phone: data.phone ?? undefined });
      } else {
        await createMethodist.mutateAsync({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password, phone: data.phone ?? undefined });
      }
      toast.success(tab === 'admins' ? 'Администратор добавлен' : 'Методист добавлен');
      onSuccess();
    } catch {
      toast.error('Не удалось создать сотрудника');
    }
  });

  return (
    <Modal open onClose={onClose} title={tab === 'admins' ? 'Добавить администратора' : 'Добавить методиста'} size="md"
      footer={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary btn-sm" form="add-user-form" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="loading loading-spinner loading-xs" />}Добавить
        </button>
      </>}
    >
      <form id="add-user-form" onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label label-text">Имя</span>
            <input className={clsx('input input-bordered input-sm', errors.firstName && 'input-error')} {...register('firstName', { required: true })} />
          </label>
          <label className="form-control">
            <span className="label label-text">Фамилия</span>
            <input className={clsx('input input-bordered input-sm', errors.lastName && 'input-error')} {...register('lastName', { required: true })} />
          </label>
        </div>
        <label className="form-control">
          <span className="label label-text">Email</span>
          <input type="email" className={clsx('input input-bordered input-sm', errors.email && 'input-error')} {...register('email', { required: true })} />
        </label>
        <label className="form-control">
          <span className="label label-text">Пароль (минимум 8 символов)</span>
          <input type="password" className={clsx('input input-bordered input-sm', errors.password && 'input-error')} {...register('password', { required: true, minLength: 8 })} />
        </label>
        <label className="form-control">
          <span className="label label-text">Телефон (необязательно)</span>
          <input type="tel" className="input input-bordered input-sm" {...register('phone')} placeholder="+998901234567" />
        </label>
        {tab === 'admins' && (
          <label className="form-control">
            <span className="label label-text">Филиал</span>
            <select className={clsx('select select-bordered select-sm', errors.branchId && 'select-error')} {...register('branchId', { required: true })}>
              <option value="">— выберите филиал —</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.isMain ? ' (главный)' : ''}</option>)}
            </select>
          </label>
        )}
      </form>
    </Modal>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === 'active'
    ? <span className="badge badge-success badge-sm gap-1"><span className="size-1.5 rounded-full bg-current" />Активен</span>
    : <span className="badge badge-warning badge-sm gap-1"><Snowflake className="size-3" />Заморожен</span>;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card bg-base-100 border border-base-300 p-4 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 size-16 rounded-full opacity-10" style={{ background: color, filter: 'blur(12px)' }} />
      <div className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">{label}</div>
      <div className="text-3xl font-bold tabular-nums mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
